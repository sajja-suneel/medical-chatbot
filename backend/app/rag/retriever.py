# C:\Users\sajja\vscode\health\backend\app\rag\retriever.py
from qdrant_client import QdrantClient
from qdrant_client.models import Prefetch, FusionQuery, Fusion, SparseVector
from app.rag.embedding import get_dense_embedding, get_sparse_embedding
from app.config.settings import (
    COLLECTION_NAME,
    QDRANT_URL,
    QDRANT_API_KEY,
    TOP_K,
)
from app.rag.log import logger


class DocumentRetriever:
    """A class to handle hybrid (dense and sparse) retrieval from Qdrant using RRF."""

    def __init__(
        self,
        url: str = QDRANT_URL,
        api_key: str = QDRANT_API_KEY,
        collection_name: str = COLLECTION_NAME,
        default_top_k: int = TOP_K,
    ):
        self.client = QdrantClient(url=url, api_key=api_key)
        self.collection_name = collection_name
        self.default_top_k = default_top_k

    def retrieve_context(self, question: str, top_k: int = None) -> list:
        """Retrieves relevant document chunks from Qdrant using Hybrid Search."""
        k = top_k or self.default_top_k
        logger.info(f"User Query: {question}")
        dense_embedding = get_dense_embedding(question)
        sparse_emb = get_sparse_embedding(question)

        logger.info("Searching Qdrant using Hybrid Search (RRF)...")
        try:
            search_result = self.client.query_points(
                collection_name=self.collection_name,
                prefetch=[
                    # Sub-query 1: Dense Semantic Search
                    Prefetch(
                        query=dense_embedding,
                        using="dense",
                        limit=k
                    ),
                    # Sub-query 2: Sparse Keyword Search
                    Prefetch(
                        query=SparseVector(
                            indices=sparse_emb["indices"],
                            values=sparse_emb["values"]
                        ),
                        using="sparse",
                        limit=k
                    )
                ],
                # Combine the rankings from both queries using Reciprocal Rank Fusion (RRF)
                query=FusionQuery(fusion=Fusion.RRF),
                limit=k
            )
            results = search_result.points
            logger.info(f"Retrieved {len(results)} hybrid search results")
        except Exception as e:
            logger.error(f"Search error: {e}")
            return []

        retrieved_docs = []
        for result in results:
            score = getattr(result, "score", 0.0)
            if result.payload:
                payload_metadata = result.payload.get("metadata", {})
                if not isinstance(payload_metadata, dict):
                    payload_metadata = {}

                page = result.payload.get("page") or payload_metadata.get("page") or "Unknown"
                source = result.payload.get("source") or payload_metadata.get("source") or "Unknown"

                retrieved_docs.append({
                    "text": result.payload.get("text", ""),
                    "page": page,
                    "source": source,
                    "score": round(score, 4)
                })

        logger.info(f"Retrieved {len(retrieved_docs)} chunks after RRF filtering")
        return retrieved_docs


# ==========================================================
# Compatibility Layer (Adapter) for Module-Level Imports
# ==========================================================
_retriever = DocumentRetriever()
client = _retriever.client
retrieve_context = _retriever.retrieve_context