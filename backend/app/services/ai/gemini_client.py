from typing import List

from google import genai

from app.core.config import settings


class GeminiClient:
    """
    Minimal wrapper around Google GenAI SDK for text reasoning.
    """

    def __init__(self) -> None:
        self.client = genai.Client(api_key=settings.gemini_api_key)
        self.model_name = settings.gemini_model

    def generate_recommendations(
        self,
        prompt: str,
        context_chunks: List[str],
        max_ideas: int = 10,
    ) -> str:
        """
        Calls Gemini with a structured prompt and RAG context.
        """
        context = "\n\n".join(context_chunks[:50])
        full_input = (
            "You are an AI strategist for YouTube creators.\n"
            "You must read the following evidence and then propose high-probability viral video ideas.\n\n"
            "EVIDENCE:\n"
            f"{context}\n\n"
            "TASK:\n"
            f"{prompt}\n\n"
            f"Return up to {max_ideas} ideas as JSON with fields: "
            "title, hook, thumbnail_idea, summary, target_audience, why_it_should_work, "
            "supporting_evidence, trend_explanation, risk_factors, estimated_effort, "
            "expected_ctr, search_potential, virality_score, confidence_score, "
            "hit_probability, publishing_window."
        )

        interaction = self.client.interactions.create(
            model=self.model_name,
            input=full_input,
        )
        return interaction.output_text