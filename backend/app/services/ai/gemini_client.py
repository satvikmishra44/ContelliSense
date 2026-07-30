import time
from typing import List

from google import genai
from google.genai import types

from app.core.config import settings
from app.core.logging_config import get_logger

logger = get_logger("app.services.ai.gemini_client")


class GeminiClient:
    """
    Wrapper around the current `google-genai` SDK (NOT the deprecated
    `google-generativeai` package). Produces structured JSON recommendations.
    """

    def __init__(self) -> None:
        if not settings.gemini_api_key:
            raise RuntimeError("Gemini API key is not configured")

        self.model_name = settings.gemini_model or "gemini-3.5-flash-lite"
        self.client = genai.Client(
            api_key=settings.gemini_api_key,
            http_options=types.HttpOptions(timeout=60_000),
        )
        logger.info("Initializing Gemini client | model=%s", self.model_name)

    def _recommendation_schema(self) -> dict:
        return {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "title": {"type": "string"},
                    "hook": {"type": "string"},
                    "thumbnail_idea": {"type": "string"},
                    "summary": {"type": "string"},
                    "target_audience": {"type": "string"},
                    "why_it_should_work": {"type": "string"},
                    "supporting_evidence": {"type": "string"},
                    "trend_explanation": {"type": "string"},
                    "risk_factors": {"type": "string"},
                    "estimated_effort": {"type": "string"},
                    "search_potential": {"type": "string"},
                    "publishing_window": {"type": "string"},
                    "virality_score": {"type": "number"},
                    "confidence_score": {"type": "number"},
                    "hit_probability": {"type": "number"},
                },
                "required": ["title", "summary", "hook", "why_it_should_work"],
            },
        }

    def generate_recommendations(
        self,
        prompt: str,
        context_chunks: List[str],
        trend_summary: str = "",
        max_ideas: int = 10,
    ) -> str:
        start = time.perf_counter()
        trimmed_context = context_chunks[:15]
        context_text = "\n\n".join(trimmed_context) if trimmed_context else "No channel context available."

        logger.info(
            "Gemini generation started | model=%s context_chunks=%s max_ideas=%s",
            self.model_name,
            len(trimmed_context),
            max_ideas,
        )

        full_prompt = (
            "You are a YouTube content strategist AI. Return ONLY a valid JSON array. "
            "No markdown, no commentary, no code fences.\n\n"
            f"CHANNEL CONTEXT (sample of past video titles/descriptions):\n{context_text}\n\n"
            f"CURRENT TREND SIGNALS:\n{trend_summary if trend_summary else 'No strong external trend data available; rely on niche and evergreen patterns.'}\n\n"
            f"TASK:\n{prompt}\n\n"
            f"Produce between 5 and {max_ideas} recommendation objects, each following the schema strictly. "
            "Every idea must include a compelling hook, a thumbnail concept, target audience, "
            "reasoning for why it should work, supporting evidence from the context or trends, "
            "risk factors if any, estimated production effort, search potential, ideal publishing window, "
            "and numeric scores between 0 and 1 for virality_score, confidence_score, hit_probability."
        )

        response = self.client.models.generate_content(
            model=self.model_name,
            contents=full_prompt,
            config=types.GenerateContentConfig(
                temperature=0.5,
                response_mime_type="application/json",
                response_schema=self._recommendation_schema(),
                automatic_function_calling=types.AutomaticFunctionCallingConfig(disable=True),
            ),
        )

        output_text = response.text or "[]"
        logger.info(
            "Gemini generation completed | chars=%s duration_ms=%s",
            len(output_text),
            round((time.perf_counter() - start) * 1000, 2),
        )
        return output_text