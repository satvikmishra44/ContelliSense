from typing import List, Tuple

import faiss
import numpy as np
from sentence_transformers import SentenceTransformer

from app.core.config import settings

import time
from app.core.logging_config import get_logger

logger = get_logger("app.services.rag.vectorstore")

class VectorStore:
    """
    Simple FAISS index per analysis/channel.
    """

    def __init__(self, index_name: str) -> None:
        self.index_name = index_name
        model_load_start = time.perf_counter()
        logger.info(
            "Loading embedding model | model=%s index_name=%s",
            settings.embeddings_model,
            index_name,
        )
        self.model = SentenceTransformer(settings.embeddings_model)
        logger.info(
            "Embedding model loaded | model=%s duration_ms=%s",
            settings.embeddings_model,
            round((time.perf_counter() - model_load_start) * 1000, 2),
        )
        self.index = None
        self.texts: List[str] = []

    def _ensure_index(self, dim: int) -> None:
        if self.index is None:
            self.index = faiss.IndexFlatL2(dim)

    def add_texts(self, texts: List[str]) -> None:
        logger.info("VectorStore add_texts started | count=%s index_name=%s", len(texts), self.index_name)
        if not texts:
            return
        embeddings = self.model.encode(texts, convert_to_numpy=True)
        logger.info(
            "Embeddings generated | count=%s dim=%s",
            len(texts),
            embeddings.shape[1],
        )
        dim = embeddings.shape[1]
        self._ensure_index(dim)
        self.index.add(embeddings)
        self.texts.extend(texts)
        logger.info("VectorStore add_texts completed | total_indexed=%s", len(self.texts))

    def search(self, query: str, k: int = 10) -> List[Tuple[str, float]]:
        logger.info("VectorStore search started | query=%s k=%s index_name=%s", query, k, self.index_name)
        if self.index is None or len(self.texts) == 0:
            return []
        q_emb = self.model.encode([query], convert_to_numpy=True)
        distances, indices = self.index.search(q_emb, k)
        results = []
        for dist, idx in zip(distances[0], indices[0]):
            if idx == -1:
                continue
            results.append((self.texts[idx], float(dist)))
        logger.info("VectorStore search completed | hits=%s", len(results))
        return results