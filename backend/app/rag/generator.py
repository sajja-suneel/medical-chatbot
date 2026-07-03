# backend/app/rag/generator.py
import os
import time
import uuid
import json
from typing import Generator
from dotenv import load_dotenv
from openai import OpenAI

from app.rag.retriever import retrieve_context
from app.rag.prompts import build_prompt, build_contextualize_prompt
from app.rag.chat_history import init_db, save_message, get_history
from app.rag.log import logger
from app.rag.redis_cache import get_cached_response, set_cached_response

load_dotenv()


class RAGResponseGenerator:
    """A class to handle standalone question reformulation, hybrid database retrieval,
    Redis caching, and final response generation (streaming and standard).
    """

    def __init__(
        self,
        model_name: str = "llama-3.3-70b-versatile",
        model_name_rewrite: str = "llama-3.1-8b-instant",  # Blazing-fast 8B model for query reformulations
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

    def _should_bypass_rewrite(self, question: str) -> bool:
        """Heuristically decides if the question is already standalone to save reformulation latency."""
        clean_q = question.strip().lower()
        # Pronouns/reference words that require history context to resolve
        pronouns = ["it", "them", "they", "he", "she", "him", "her", "this", "that", "these", "those"]
        
        # If the query contains reference words, we MUST reformulate
        if any(f" {p} " in f" {clean_q} " for p in pronouns):
            return False
            
        # If the query starts with common complete question stems, bypass reformulation
        stems = ["what is", "how to", "why does", "explain the", "symptoms of", "treatment for"]
        if any(clean_q.startswith(s) for s in stems):
            return True
            
        # Default to False (safer reformulation fallback)
        return False

    def _reformulate_question(self, question: str, context_window: list[dict]) -> str:
        """Uses a ultra-fast 8B model to reformulate follow-ups in ~0.2 seconds."""
        if not context_window or self._should_bypass_rewrite(question):
            return question

        rewrite_prompt = build_contextualize_prompt(question, context_window)
        try:
            # Using model_name_rewrite (llama-3.1-8b-instant) instead of the heavy 70B model
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
        """Generates a complete answer (highly optimized for speed)."""
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

        # Dynamically set limit based on history recall request
        history_limit = 100 if self._is_history_recall(question) else 6
        context_window = get_history(session_id, limit=history_limit)
        
        # Bypass vector search if it is a general greeting or history recall
        if self._is_conversational_greeting(question) or self._is_history_recall(question):
            docs = []
            standalone_question = question
        else:
            standalone_question = self._reformulate_question(question, context_window)
            docs = retrieve_context(standalone_question)

        # If it is not a greeting/history recall and no documents exist, return RAG fallback
        if not docs and not self._is_conversational_greeting(question) and not self._is_history_recall(question):
            no_info_ans = "Information not found in the medical knowledge base."
            save_message(session_id, "user", question, email)
            save_message(session_id, "model", no_info_ans, email)
            return {
                "answer": no_info_ans,
                "sources": [],
                "metadata": self._build_metadata_package(session_id, question, standalone_question, [])
            }

        # Format context blocks with sequential indices so LLM knows exactly how to cite [1], [2], etc.
        context = "\n\n".join(
            f"Source [{idx + 1}]: [Document: {doc.get('source', 'Unknown')}, Page: {doc.get('page', 'Unknown')}]\nText: {doc['text']}"
            for idx, doc in enumerate(docs)
        )
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
            result = {
                "answer": answer_text,
                "sources": [{"page": d.get("page", "Unknown"), "source": d.get("source", "Unknown")} for d in docs],
                "metadata": metadata
            }
            set_cached_response(question, json.dumps(result))
            return result
        except Exception as e:
            logger.error(f"Groq Error: {e}")
            return {"answer": "Error generating response.", "sources": [], "metadata": {"error": str(e)}}

    def generate_answer_stream(self, question: str, session_id: str = None, email: str = None) -> Generator[str, None, None]:
        """Generates and streams answer tokens in Server-Sent Events (SSE) format (highly optimized)."""
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

        # Dynamically set limit based on history recall request
        history_limit = 100 if self._is_history_recall(question) else 6
        context_window = get_history(session_id, limit=history_limit)
        
        # Bypass vector search if it is a general greeting or history recall
        if self._is_conversational_greeting(question) or self._is_history_recall(question):
            docs = []
            standalone_question = question
        else:
            standalone_question = self._reformulate_question(question, context_window)
            docs = retrieve_context(standalone_question)

        save_message(session_id, "user", question, email)

        # If it is not a greeting/history recall and no documents exist, return RAG fallback
        if not docs and not self._is_conversational_greeting(question) and not self._is_history_recall(question):
            no_info_ans = "Information not found in the medical knowledge base."
            save_message(session_id, "model", no_info_ans, email)
            yield f"data: {json.dumps({'token': no_info_ans, 'metadata': self._build_metadata_package(session_id, question, standalone_question, [])})}\n\n"
            yield "data: [DONE]\n\n"
            return

        # Format context blocks with sequential indices so LLM knows exactly how to cite [1], [2], etc.
        context = "\n\n".join(
            f"Source [{idx + 1}]: [Document: {doc.get('source', 'Unknown')}, Page: {doc.get('page', 'Unknown')}]\nText: {doc['text']}"
            for idx, doc in enumerate(docs)
        )
        prompt = build_prompt(question=question, context=context, chat_history=context_window)
        metadata = self._build_metadata_package(session_id, question, standalone_question, docs)

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