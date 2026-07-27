from typing import List, Tuple

import faiss
import numpy as np
from sentence_transformers import SentenceTransformer

from app.core.config import settings


class VectorStore:
    """
    Simple FAISS index per analysis/channel.
    """

    def __init__(self, index_name: str) -> None:
        self.index_name = index_name
        self.model = SentenceTransformer(settings.embeddings_model)
        self.index = None
        self.texts: List[str] = []

    def _ensure_index(self, dim: int) -> None:
        if self.index is None:
            self.index = faiss.IndexFlatL2(dim)

    def add_texts(self, texts: List[str]) -> None:
        if not texts:
            return
        embeddings = self.model.encode(texts, convert_to_numpy=True)
        dim = embeddings.shape[1]
        self._ensure_index(dim)
        self.index.add(embeddings)
        self.texts.extend(texts)

    def search(self, query: str, k: int = 10) -> List[Tuple[str, float]]:
        if self.index is None or len(self.texts) == 0:
            return []
        q_emb = self.model.encode([query], convert_to_numpy=True)
        distances, indices = self.index.search(q_emb, k)
        results = []
        for dist, idx in zip(distances[0], indices[0]):
            if idx == -1:
                continue
            results.append((self.texts[idx], float(dist)))
        return results