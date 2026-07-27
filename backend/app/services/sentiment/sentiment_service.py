from typing import List, Dict

import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification


class SentimentService:
    """
    GPU-based sentiment analysis over YouTube comments using a Hugging Face model.
    """

    def __init__(self, model_name: str) -> None:
        device = "cuda" if torch.cuda.is_available() else "cpu"
        self.device = device
        self.tokenizer = AutoTokenizer.from_pretrained(model_name)
        self.model = AutoModelForSequenceClassification.from_pretrained(model_name).to(device)

    def analyze_comments(self, comments: List[str]) -> Dict[str, float]:
        """
        Returns sentiment distribution: positive, neutral, negative.
        """
        if not comments:
            return {"positive": 0.0, "neutral": 0.0, "negative": 0.0}

        inputs = self.tokenizer(
            comments,
            padding=True,
            truncation=True,
            max_length=256,
            return_tensors="pt",
        ).to(self.device)

        with torch.no_grad():
            outputs = self.model(**inputs)
            scores = torch.softmax(outputs.logits, dim=-1).cpu().numpy()

        # Assume label order [negative, neutral, positive]; adjust as per your model card.
        neg = float(scores[:, 0].mean())
        neu = float(scores[:, 1].mean())
        pos = float(scores[:, 2].mean())

        return {"positive": pos, "neutral": neu, "negative": neg}