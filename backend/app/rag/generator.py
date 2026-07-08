# backend/app/rag/generator.py
import os
import time
import uuid
import json
import re
from typing import Generator
from dotenv import load_dotenv
from openai import OpenAI

from app.rag.retriever import retrieve_context
from app.rag.prompts import build_prompt, build_contextualize_prompt
from app.rag.chat_history import init_db, save_message, get_history
from app.rag.log import logger
from app.rag.redis_cache import get_cached_response, set_cached_response

# Import third-party APIs
from app.services.weather import WeatherService
from app.services.openfda import OpenFDAService  # Import OpenFDA

load_dotenv()


class RAGResponseGenerator:
    """A class to handle standalone question reformulation, hybrid database retrieval,
    Redis caching, and final response generation (streaming and standard).
    """

    def __init__(
        self,
        model_name: str = "llama-3.3-70b-versatile",
        model_name_rewrite: str = "llama-3.1-8b-instant",  # Fast 8B model for query reformulations
        temperature_rewrite: float = 0.0,
        temperature_generation: float = 0.2,
        max_tokens_generation: int = 1000,
    ):
        self.model_name = model_name
        self.model_name_rewrite = model_name_rewrite
        self.temperature_rewrite = temperature_rewrite
        self.temperature_generation = temperature_generation
        self.max_tokens_generation = max_tokens_generation
        
        self.client = OpenAI(
            api_key=os.getenv("GROQ_API_KEY"),
            base_url="https://api.groq.com/openai/v1"
        )
        self.weather_service = WeatherService()
        self.fda_service = OpenFDAService()  # Initialize OpenFDA Service
        init_db()

    def _is_conversational_greeting(self, question: str) -> bool:
        """Detects if the query is a simple greeting or conversational opener."""
        clean_q = question.strip().lower().rstrip('?').rstrip('.')
        greetings = {
            "hi", "hello", "hey", "good morning", "good afternoon", "good evening",
            "how are you", "who are you", "what is your name", "what are you",
            "are you there", "yo", "sup", "greetings"
        }
        return clean_q in greetings

    def _is_history_recall(self, question: str) -> bool:
        """Detects if the query is asking to recall past conversation history questions."""
        clean_q = question.strip().lower().rstrip('?').rstrip('.')
        history_keywords = {
            "first question", "second question", "third question", 
            "previous question", "what did i ask", "what was my first",
            "what was my second", "what was my third", "recall my first",
            "recall my second", "recall my third", "what is the first",
            "what is the second", "what is the third"
        }
        return any(kw in clean_q for kw in history_keywords)

    def _is_weather_query(self, question: str) -> bool:
        """Detects if the query is asking about weather reports."""
        clean_q = question.strip().lower()
        keywords = ["weather", "temperature", "temp", "rain", "forecast", "climate", "humidity"]
        return any(kw in clean_q for kw in keywords)

    def _extract_city_name(self, question: str) -> str:
        """Extracts candidate city name from weather query."""
        clean_q = question.strip().lower().replace("?", "").replace(".", "")
        clean_q = clean_q.replace("weather", "").replace("temperature", "").replace("temp", "")
        clean_q = clean_q.replace("in", "").replace("for", "").replace("today", "")
        city = clean_q.strip().title()
        return city if city else "Tirupati"

    def _extract_drug_name(self, question: str) -> str:
        """Extracts candidate drug names from the query using common suffixes."""
        clean_q = question.lower()
        stopwords = {"drug", "medicine", "pill", "tablet", "vaccine", "side", "effect", "warnings"}
        
        # Look for capitalization or suffixes common in pharmaceutical drugs
        words = clean_q.split()
        for w in words:
            w_clean = re.sub(r'[^\w]', '', w)
            if len(w_clean) > 4 and (
                w_clean.endswith("in") or w_clean.endswith("ol") or 
                w_clean.endswith("fen") or w_clean.endswith("am") or 
                w_clean.endswith("mab") or w_clean.endswith("prill") or 
                w_clean.endswith("sone")
            ):
                if w_clean not in stopwords:
                    return w_clean.capitalize()
        return ""

    def _should_bypass_rewrite(self, question: str) -> bool:
        """Heuristically decides if the question is already standalone to save reformulation latency."""
        clean_q = question.strip().lower()
        pronouns = ["it", "them", "they", "he", "she", "him", "her", "this", "that", "these", "those"]
        
        if any(f" {p} " in f" {clean_q} " for p in pronouns):
            return False
            
        stems = ["what is", "how to", "why does", "explain the", "symptoms of", "treatment for"]
        if any(clean_q.startswith(s) for s in stems):
            return True
            
        return False

    def _reformulate_question(self, question: str, context_window: list[dict]) -> str:
        """Uses a ultra-fast 8B model to reformulate follow-ups in ~0.2 seconds."""
        if not context_window or self._should_bypass_rewrite(question):
            return question

        rewrite_prompt = build_contextualize_prompt(question, context_window)
        try:
            rewrite_response = self.client.chat.completions.create(
                model=self.model_name_rewrite,
                messages=[{"role": "user", "content": rewrite_prompt}],
                temperature=self.temperature_rewrite,
                max_tokens=100
            )
            candidate_question = rewrite_response.choices[0].message.content.strip()
            if candidate_question:
                return candidate_question
        except Exception as e:
            logger.error(f"Error reformulating question: {e}")
        return question

    def _get_weather_context_if_needed(self, question: str) -> tuple[str, str]:
        """Helper to fetch weather reports if it is a weather query."""
        if not self._is_weather_query(question):
            return "", ""
            
        city = self._extract_city_name(question)
        w_data = self.weather_service.get_weather_with_health_tips(city)
        if not w_data.get("success"):
            return "", ""
            
        weather_text = f"""
[Source Document: Live Weather API Lookup]
City: {w_data['city']}
Temperature: {w_data['temp']}°C
Humidity: {w_data['humidity']}%
Conditions: {w_data['description']}
Medical Weather Advisory: {w_data['health_advisory']}
"""
        return weather_text, w_data.get("city", "")

    def _get_fda_context_if_needed(self, question: str, force: bool = False) -> str:
        """Queries OpenFDA if the question mentions a drug name or forced as a fallback."""
        drug_name = self._extract_drug_name(question)
        if not drug_name and not force:
            return ""

        search_term = drug_name if drug_name else "Aspirin"
        if not drug_name and force:
            # Grab first long word as fallback search term
            words = [w for w in question.split() if len(w) > 4]
            if words:
                search_term = words[0]

        details = self.fda_service.get_drug_details(search_term)
        if not details.get("found"):
            return ""

        events = self.fda_service.get_adverse_events(search_term)
        events_str = ", ".join(events) if events else "None reported"

        return f"""
[Source Document: OpenFDA Live Database Lookup]
Official Drug Name: {details['brand_name']} ({details['generic_name']})
Primary Purpose: {details['purpose']}
Indications & Usage: {details['indications']}
FDA Safety Warnings: {details['warnings']}
Dosage & Administration Guidelines: {details['dosage_and_administration']}
Top Reported Side Effects (Adverse Events): {events_str}
"""

    def _build_metadata_package(self, session_id: str, question: str, standalone_question: str, docs: list[dict]) -> dict:
        """Packages context retrieval chunks into a serialized dict for client display."""
        chunk_details = []
        for index, doc in enumerate(docs):
            chunk_details.append({
                "chunk_no": index + 1,
                "score": round(float(doc.get("score", 0.0)), 4),
                "chunk_text": doc.get("text", ""),
                "page_no": doc.get("page", "Unknown"),
                "source": doc.get("source", "Unknown")
            })
        return {
            "session_id": session_id,
            "question": question,
            "standalone_question": standalone_question,
            "chunk_count": len(docs),
            "source": docs[0].get("source", "Unknown") if docs else "Unknown",
            "chunks": chunk_details
        }

    def generate_answer(self, question: str, session_id: str = None, email: str = None) -> dict:
        """Generates a complete answer (includes weather & OpenFDA contexts)."""
        if session_id is None:
            session_id = str(uuid.uuid4())

        cached_payload = get_cached_response(question)
        if cached_payload:
            try:
                parsed = json.loads(cached_payload)
                save_message(session_id, "user", question, email)
                save_message(session_id, "model", parsed["answer"], email)
                return parsed
            except Exception:
                pass

        history_limit = 100 if self._is_history_recall(question) else 6
        context_window = get_history(session_id, limit=history_limit)
        
        is_weather = self._is_weather_query(question)
        is_greeting = self._is_conversational_greeting(question)
        is_recall = self._is_history_recall(question)

        # Bypass Qdrant search for greetings, history recall, or weather requests
        if is_greeting or is_recall or is_weather:
            docs = []
            standalone_question = question
        else:
            standalone_question = self._reformulate_question(question, context_window)
            docs = retrieve_context(standalone_question)

        # Fetch weather contextual data
        weather_context, weather_city = self._get_weather_context_if_needed(standalone_question)
        
        # Determine if we should force OpenFDA lookup (if vector DB returned no results)
        force_fda = not docs and not weather_context and not is_greeting and not is_recall
        fda_context = self._get_fda_context_if_needed(standalone_question, force=force_fda)

        # Trigger RAG fallback if context is completely empty
        if not docs and not weather_context and not fda_context and not is_greeting and not is_recall:
            no_info_ans = "Information not found in the medical knowledge base."
            save_message(session_id, "user", question, email)
            save_message(session_id, "model", no_info_ans, email)
            return {
                "answer": no_info_ans,
                "sources": [],
                "metadata": self._build_metadata_package(session_id, question, standalone_question, [])
            }

        # Build prompt context blocks
        context_list = []
        for idx, doc in enumerate(docs):
            context_list.append(f"Source [{idx + 1}]: [Document: {doc.get('source', 'Unknown')}, Page: {doc.get('page', 'Unknown')}]\nText: {doc['text']}")
        
        if weather_context:
            context_list.append(weather_context)
        if fda_context:
            context_list.append(fda_context)

        context = "\n\n".join(context_list)
        prompt = build_prompt(question=question, context=context, chat_history=context_window)

        try:
            response = self.client.chat.completions.create(
                model=self.model_name,
                messages=[{"role": "user", "content": prompt}],
                temperature=self.temperature_generation,
                max_tokens=self.max_tokens_generation
            )
            answer_text = response.choices[0].message.content.strip()
            save_message(session_id, "user", question, email)
            save_message(session_id, "model", answer_text, email)

            metadata = self._build_metadata_package(session_id, question, standalone_question, docs)
            if weather_city:
                metadata["weather_city"] = weather_city

            # Format display sources list
            sources = [{"page": d.get("page", "Unknown"), "source": d.get("source", "Unknown")} for d in docs]
            if weather_context:
                sources.append({"page": "Live API", "source": "Weather Forecast"})
            if fda_context:
                sources.append({"page": "Live API", "source": "FDA Drug Database"})

            result = {
                "answer": answer_text,
                "sources": sources,
                "metadata": metadata
            }
            set_cached_response(question, json.dumps(result))
            return result
        except Exception as e:
            logger.error(f"Groq Error: {e}")
            return {"answer": "Error generating response.", "sources": [], "metadata": {"error": str(e)}}

    def generate_answer_stream(self, question: str, session_id: str = None, email: str = None) -> Generator[str, None, None]:
        """Generates and streams answer tokens in SSE format (includes weather & OpenFDA contexts)."""
        if session_id is None:
            session_id = str(uuid.uuid4())

        cached_payload = get_cached_response(question)
        if cached_payload:
            try:
                logger.info("CACHE HIT 🚀 Streaming from Redis memory")
                parsed = json.loads(cached_payload)
                cached_text = parsed["answer"]

                save_message(session_id, "user", question, email)
                save_message(session_id, "model", cached_text, email)

                yield f"data: {json.dumps({'metadata': parsed['metadata']})}\n\n"
                chunk_size = 25
                for i in range(0, len(cached_text), chunk_size):
                    yield f"data: {json.dumps({'token': cached_text[i:i+chunk_size]})}\n\n"
                    time.sleep(0.02)
                yield "data: [DONE]\n\n"
                return
            except Exception as e:
                logger.error(f"Failed to read from cache: {e}")

        history_limit = 100 if self._is_history_recall(question) else 6
        context_window = get_history(session_id, limit=history_limit)
        
        is_weather = self._is_weather_query(question)
        is_greeting = self._is_conversational_greeting(question)
        is_recall = self._is_history_recall(question)

        # Bypass Qdrant search for greetings, history recall, or weather requests
        if is_greeting or is_recall or is_weather:
            docs = []
            standalone_question = question
        else:
            standalone_question = self._reformulate_question(question, context_window)
            docs = retrieve_context(standalone_question)

        # Fetch weather contextual data
        weather_context, weather_city = self._get_weather_context_if_needed(standalone_question)
        
        # Determine if we should force OpenFDA lookup (if vector DB returned no results)
        force_fda = not docs and not weather_context and not is_greeting and not is_recall
        fda_context = self._get_fda_context_if_needed(standalone_question, force=force_fda)

        save_message(session_id, "user", question, email)

        # Trigger RAG fallback if context is completely empty
        if not docs and not weather_context and not fda_context and not is_greeting and not is_recall:
            no_info_ans = "Information not found in the medical knowledge base."
            save_message(session_id, "model", no_info_ans, email)
            yield f"data: {json.dumps({'token': no_info_ans, 'metadata': self._build_metadata_package(session_id, question, standalone_question, [])})}\n\n"
            yield "data: [DONE]\n\n"
            return

        # Build prompt context blocks
        context_list = []
        for idx, doc in enumerate(docs):
            context_list.append(f"Source [{idx + 1}]: [Document: {doc.get('source', 'Unknown')}, Page: {doc.get('page', 'Unknown')}]\nText: {doc['text']}")
        
        if weather_context:
            context_list.append(weather_context)
        if fda_context:
            context_list.append(fda_context)

        context = "\n\n".join(context_list)
        prompt = build_prompt(question=question, context=context, chat_history=context_window)
        
        metadata = self._build_metadata_package(session_id, question, standalone_question, docs)
        if weather_city:
            metadata["weather_city"] = weather_city

        yield f"data: {json.dumps({'metadata': metadata})}\n\n"

        try:
            response_stream = self.client.chat.completions.create(
                model=self.model_name,
                messages=[{"role": "user", "content": prompt}],
                temperature=self.temperature_generation,
                max_tokens=self.max_tokens_generation,
                stream=True
            )

            full_answer = []
            for chunk in response_stream:
                token = chunk.choices[0].delta.content
                if token:
                    full_answer.append(token)
                    yield f"data: {json.dumps({'token': token})}\n\n"

            final_answer = "".join(full_answer)
            save_message(session_id, "model", final_answer, email)

            cache_data = {"answer": final_answer, "metadata": metadata}
            set_cached_response(question, json.dumps(cache_data))
        except Exception as e:
            logger.error(f"Groq Streaming Error: {e}")
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

        yield "data: [DONE]\n\n"


# ==========================================================
# Compatibility Layer (Adapter) for Module-Level Imports
# ==========================================================
_generator = RAGResponseGenerator()
generate_answer = _generator.generate_answer
generate_answer_stream = _generator.generate_answer_stream