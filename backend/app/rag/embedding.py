# backend/app/rag/embedding.py
from sentence_transformers import SentenceTransformer
from fastembed import SparseTextEmbedding


class EmbeddingManager:
    """A class to handle dense and sparse text embeddings for hybrid vector search."""

    def __init__(
        self,
        dense_model_name: str = "all-MiniLM-L6-v2",
        sparse_model_name: str = "prithivida/Splade_PP_en_v1",
    ):
        # Initialize the embedding models as class attributes
        self.dense_model = SentenceTransformer(dense_model_name)
        # SPLADE is a highly effective model for keyword / sparse embeddings
        self.sparse_model = SparseTextEmbedding(sparse_model_name)

    def get_dense_embedding(self, text: str) -> list:
        """Generates a 384-dimensional dense vector embedding for the input text."""
        if not text:
            return [0.0] * 384
        return self.dense_model.encode(text).tolist()

    def get_sparse_embedding(self, text: str) -> dict:
        """Generates a sparse vector embedding for the input text using SPLADE."""
        if not text:
            return {"indices": [], "values": []}
        # Fastembed returns a generator of SparseEmbedding objects
        embeddings = list(self.sparse_model.embed([text]))
        sparse_emb = embeddings[0]
        return {
            "indices": sparse_emb.indices.tolist(),
            "values": sparse_emb.values.tolist()
        }


# ==========================================================
# Compatibility Layer (Adapter) for Module-Level Imports
# ==========================================================
_manager = EmbeddingManager()
get_dense_embedding = _manager.get_dense_embedding
get_sparse_embedding = _manager.get_sparse_embedding