from google import genai
from google.genai import types

from app.core.config import settings
from app.core.logging_config import get_logger

logger = get_logger("app.services.ai.gemini_client")


class GeminiClient:
    def __init__(self) -> None:
        if not settings.gemini_api_key:
            raise RuntimeError("Gemini API key is not configured")

        self.model_name = settings.gemini_model or "gemini-3.5-flash-lite"
        self.client = genai.Client(
            api_key=settings.gemini_api_key,
            http_options={"timeout": 60_000},
        )

    def _recommendation_schema(self) -> dict:
        return {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "title": {"type": "string"},
                    "summary": {"type": "string"},
                    "hook": {"type": "string"},
                    "why_it_should_work": {"type": "string"},
                    "virality_score": {"type": "number"},
                    "confidence_score": {"type": "number"},
                },
                "required": ["title", "summary"],
            },
        }

    def generate_recommendations(
        self,
        prompt: str,
        context_chunks: list[str],
        max_ideas: int = 10,
    ) -> str:
        trimmed_context = context_chunks[:12]
        context = "\n\n".join(trimmed_context) if trimmed_context else ""

        full_prompt = (
            "Return only a valid JSON array.\n"
            "No markdown, no explanation, no code fences.\n\n"
            f"Context:\n{context if context else 'No context available.'}\n\n"
            f"Task:\n{prompt}\n\n"
            f"Return at most {max_ideas} items."
        )

        response = self.client.models.generate_content(
            model=self.model_name,
            contents=full_prompt,
            config=types.GenerateContentConfig(
                temperature=0.4,
                response_mime_type="application/json",
                response_schema=self._recommendation_schema(),
                automatic_function_calling=types.AutomaticFunctionCallingConfig(
                    disable=True
                ),
            ),
        )

        return response.text or "[]"