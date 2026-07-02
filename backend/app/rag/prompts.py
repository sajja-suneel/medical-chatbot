# C:\Users\sajja\vscode\health\backend\app\rag\prompts.py
from app.rag.prompt_templates import HEALTHCARE_ASSISTANT_INSTRUCTIONS, CONTEXTUALIZE_INSTRUCTIONS


class PromptManager:
    """A class to construct generation and contextualization prompts for the LLM."""

    def __init__(
        self,
        assistant_instructions: str = HEALTHCARE_ASSISTANT_INSTRUCTIONS,
        contextualize_instructions: str = CONTEXTUALIZE_INSTRUCTIONS,
    ):
        self.assistant_instructions = assistant_instructions
        self.contextualize_instructions = contextualize_instructions

    def build_prompt(self, question: str, context: str, chat_history: list = None) -> str:
        """Constructs a prompt using the medical context, question, and chat history."""
        history_str = "No conversation history."
        if chat_history:
            history_str = "\n".join(
                f"{msg['role'].capitalize()}: {msg['content']}"
                for msg in chat_history
            )

        return f"""{self.assistant_instructions}

Retrieved Medical Context:
{context}

Conversation History:
{history_str}

User Question:
{question}

Answer:
"""

    def build_contextualize_prompt(self, question: str, chat_history: list) -> str:
        """Constructs a prompt instructing the model to reformulate a follow-up question."""
        history_str = "\n".join(
            f"{msg['role'].capitalize()}: {msg['content']}"
            for msg in chat_history
        )
        return f"""{self.contextualize_instructions}

Conversation History:
{history_str}

Follow-up Question: {question}

Standalone Question:"""


# ==========================================================
# Compatibility Layer (Adapter) for Module-Level Imports
# ==========================================================
_prompt_manager = PromptManager()
build_prompt = _prompt_manager.build_prompt
build_contextualize_prompt = _prompt_manager.build_contextualize_prompt