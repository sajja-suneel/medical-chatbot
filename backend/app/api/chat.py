# backend/app/api/chat.py
import uuid
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from app.rag.generator import generate_answer_stream
from app.utils.firebase_verifier import get_current_user
from app.rag.chat_history import get_user_sessions, get_history, delete_user_session

router = APIRouter()

class ChatRequest(BaseModel):
    question: str
    session_id: str = None
    domain: str = "medical"

@router.post("/chat")
def chat(request: ChatRequest, current_user: dict = Depends(get_current_user)):
    session_id = request.session_id or str(uuid.uuid4())
    email = current_user.get("email")
    
    return StreamingResponse(
        generate_answer_stream(request.question, session_id=session_id, email=email),
        media_type="text/event-stream"
    )

@router.get("/sessions")
def get_sessions(current_user: dict = Depends(get_current_user)):
    """Fetch all unique chat threads for the logged-in user from MongoDB."""
    email = current_user.get("email")
    return get_user_sessions(email)

@router.get("/sessions/{session_id}/history")
def get_session_history(session_id: str, current_user: dict = Depends(get_current_user)):
    """Fetch chronological message bubbles for a specific thread from MongoDB."""
    return get_history(session_id, limit=100)

@router.delete("/sessions/{session_id}")
def delete_session(session_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a chat session and all its message records from MongoDB."""
    delete_user_session(session_id)
    return {"message": "Session deleted successfully"}