# C:\Users\sajja\vscode\health\backend\app\rag\redis_cache.py
import os
import hashlib
import redis
from dotenv import load_dotenv

load_dotenv()


class RedisCacheManager:
    """A class to manage cache storage, hashing, and retrieval on a Redis instance."""

    def __init__(self, redis_url: str = None):
        self.redis_url = redis_url or os.getenv("REDIS_URL")
        # Connect to Cloud Redis instance
        try:
            self.redis_client = redis.from_url(self.redis_url, decode_responses=True)
        except Exception as e:
            print(f"Redis initialization failed: {e}")
            self.redis_client = None

    def get_question_hash(self, question: str) -> str:
        """Generates a clean SHA-256 hash of the question to use as a key."""
        clean_q = question.strip().lower()
        return hashlib.sha256(clean_q.encode("utf-8")).hexdigest()

    def get_cached_response(self, question: str) -> str:
        """Retrieves JSON payload containing answer and metadata from Redis."""
        if not self.redis_client:
            return None
        try:
            key = f"cache:{self.get_question_hash(question)}"
            return self.redis_client.get(key)
        except Exception as e:
            print(f"Redis cache lookup failed: {e}")
            return None

    def set_cached_response(self, question: str, payload_json: str, ttl: int = 3600):
        """Saves RAG results to Redis with a TTL (default: 3600 seconds/1 hour)."""
        if not self.redis_client or not payload_json:
            return
        try:
            key = f"cache:{self.get_question_hash(question)}"
            self.redis_client.setex(key, ttl, payload_json)
        except Exception as e:
            print(f"Redis cache set failed: {e}")


# ==========================================================
# Compatibility Layer (Adapter) for Module-Level Imports
# ==========================================================
_cache_manager = RedisCacheManager()
redis_client = _cache_manager.redis_client
get_question_hash = _cache_manager.get_question_hash
get_cached_response = _cache_manager.get_cached_response
set_cached_response = _cache_manager.set_cached_response