# C:\Users\sajja\vscode\health\backend\app\rag\chat_history.py
import os
import time
import certifi
from pymongo import MongoClient


class MongoChatHistoryManager:
    """A data access layer class to handle chat session persistence, indexing,
    and chronological retrieval within a MongoDB database.
    """

    def __init__(
        self,
        mongo_uri: str = None,
        db_name: str = "chat",
        collection_name: str = "chat_history",
    ):
        self.mongo_uri = (
            mongo_uri or os.getenv("MONGO_URI") or "mongodb://localhost:27017"
        )

        try:
            self.client = MongoClient(
                self.mongo_uri, tlsCAFile=certifi.where()
            )
        except TypeError:
            self.client = MongoClient(
                self.mongo_uri, ssl_ca_certs=certifi.where()
            )

        self.db = self.client[db_name]
        self.collection = self.db[collection_name]
        self._init_db()

    def _init_db(self) -> None:
        """Initializes internal compound indexes for fast session query optimizations."""
        try:
            self.collection.create_index([("session_id", 1), ("timestamp", 1)])
            self.collection.create_index([("email", 1)])
        except Exception as e:
            print(f"Error creating indexes inside MongoDB: {e}")

    def save_message(self, session_id: str, role: str, content: str, email: str = None) -> None:
        """Persists a single conversational turn linked to the user's email."""
        try:
            self.collection.insert_one({
                "session_id": session_id,
                "role": role,
                "content": content,
                "timestamp": time.time(),
                "email": email
            })
        except Exception as e:
            print(f"Error saving message to MongoDB: {e}")

    def get_history(self, session_id: str, limit: int = 10) -> list[dict]:
        """Retrieves a chronological list of messages for a session."""
        try:
            cursor = (
                self.collection.find({"session_id": session_id})
                .sort("timestamp", -1)
                .limit(limit)
            )
            recent_docs = reversed(list(cursor))
            return [
                {"role": doc["role"], "content": doc["content"]}
                for doc in recent_docs
            ]
        except Exception as e:
            print(f"Error fetching history from MongoDB: {e}")
            return []

    def get_user_sessions(self, email: str) -> list[dict]:
        """Retrieves all unique session IDs and their titles/last updated times for a user."""
        try:
            pipeline = [
                {"$match": {"email": email}},
                {"$sort": {"timestamp": 1}},
                {
                    "$group": {
                        "_id": "$session_id",
                        "last_updated": {"$last": "$timestamp"},
                        "title": {"$first": "$content"} # Use first message content as thread title
                    }
                },
                {"$sort": {"last_updated": -1}}
            ]
            cursor = self.collection.aggregate(pipeline)
            return [
                {
                    "id": doc["_id"],
                    "title": doc["title"][:25] + "..." if len(doc["title"]) > 25 else doc["title"],
                    "date": time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(doc["last_updated"])),
                    "domain": "medical"
                }
                for doc in cursor
            ]
        except Exception as e:
            print(f"Error fetching user sessions from MongoDB: {e}")
            return []

    def delete_user_session(self, session_id: str) -> None:
        """Deletes all message history records matching the session_id."""
        try:
            self.collection.delete_many({"session_id": session_id})
        except Exception as e:
            print(f"Error deleting session {session_id}: {e}")


# ==========================================================
# Compatibility Layer (Adapter) for Module-Level Imports
# ==========================================================
_manager = MongoChatHistoryManager()
def init_db():
    pass
save_message = _manager.save_message
get_history = _manager.get_history
get_user_sessions = _manager.get_user_sessions
delete_user_session = _manager.delete_user_session