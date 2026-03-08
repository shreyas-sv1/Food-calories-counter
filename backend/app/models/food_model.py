from google import genai
from google.genai import errors as genai_errors
from PIL import Image
import json
import re
import io
import time

from ..config import settings


class FoodClassifier:
    """Food classifier using Google Gemini Vision API for accurate food identification."""

    def __init__(self):
        api_key = settings.gemini_api_key
        if not api_key:
            raise ValueError(
                "GEMINI_API_KEY not set. Get a free key at https://aistudio.google.com/apikey "
                "and add it to your .env file."
            )
        self.client = genai.Client(api_key=api_key)
        self.model_name = "gemini-2.5-flash"
        print("Gemini food classifier initialized.")

    def _parse_json(self, text: str):
        """Strip markdown fences and parse JSON from Gemini response."""
        text = text.strip()
        text = re.sub(r'^```(?:json)?\s*', '', text)
        text = re.sub(r'\s*```$', '', text)
        return json.loads(text.strip())

    def _pil_to_bytes(self, image: Image.Image) -> bytes:
        buf = io.BytesIO()
        image.save(buf, format="JPEG")
        return buf.getvalue()

    def _call_gemini(self, contents: list, retries: int = 2) -> str:
        """Call Gemini API with retry on rate limit."""
        for attempt in range(retries + 1):
            try:
                response = self.client.models.generate_content(
                    model=self.model_name,
                    contents=contents,
                )
                return response.text
            except genai_errors.ClientError as e:
                if "429" in str(e) and attempt < retries:
                    wait = 5 * (attempt + 1)
                    print(f"Gemini rate limited, retrying in {wait}s...")
                    time.sleep(wait)
                    continue
                raise

    def predict(self, image: Image.Image) -> dict:
        """Identify food in image and return name + confidence."""
        image = image.convert("RGB")
        image_bytes = self._pil_to_bytes(image)

        prompt = (
            "You are a food identification expert. Analyze this image and identify the food item(s) shown. "
            "Respond ONLY with a JSON object in this exact format, no markdown, no code fences:\n"
            '{"food": "Name of the food", "confidence": 0.95}\n'
            "Rules:\n"
            "- food: The specific name of the dish (e.g., 'Chicken Biryani', 'Masala Dosa', 'Caesar Salad')\n"
            "- confidence: A float between 0 and 1 indicating how confident you are\n"
            "- If multiple foods are visible, identify the main/primary dish\n"
            "- If the image does not contain food, set food to 'Not Food' and confidence to 0.0\n"
            "- Use the common English name for the food"
        )

        try:
            text = self._call_gemini([
                prompt,
                genai.types.Part.from_bytes(data=image_bytes, mime_type="image/jpeg"),
            ])
            result = self._parse_json(text)
            return {
                "food": result.get("food", "Unknown Food"),
                "class_id": result.get("food", "unknown").lower().replace(" ", "_"),
                "confidence": float(result.get("confidence", 0.5)),
            }
        except genai_errors.ClientError as e:
            if "429" in str(e):
                raise RuntimeError("Gemini API rate limit exceeded. Please wait a minute and try again.")
            raise
        except (json.JSONDecodeError, KeyError, ValueError):
            return {
                "food": "Unknown Food",
                "class_id": "unknown",
                "confidence": 0.0,
            }

    def predict_top_k(self, image: Image.Image, k: int = 5) -> list:
        """Identify top-K possible foods in the image."""
        image = image.convert("RGB")
        image_bytes = self._pil_to_bytes(image)

        prompt = (
            f"You are a food identification expert. Analyze this image and identify the top {k} most likely food items. "
            "Respond ONLY with a JSON array in this exact format, no markdown, no code fences:\n"
            '[{"food": "Food Name", "confidence": 0.95}, {"food": "Alt Name", "confidence": 0.8}]\n'
            "Rules:\n"
            f"- List up to {k} possible food identifications, ordered by confidence (highest first)\n"
            "- Each entry needs food (string) and confidence (float 0-1)\n"
            '- If the image does not contain food, return [{"food": "Not Food", "confidence": 0.0}]'
        )

        try:
            text = self._call_gemini([
                prompt,
                genai.types.Part.from_bytes(data=image_bytes, mime_type="image/jpeg"),
            ])
            results = self._parse_json(text)
            return [
                {
                    "food": r.get("food", "Unknown"),
                    "class_id": r.get("food", "unknown").lower().replace(" ", "_"),
                    "confidence": float(r.get("confidence", 0.5)),
                }
                for r in results[:k]
            ]
        except genai_errors.ClientError as e:
            if "429" in str(e):
                raise RuntimeError("Gemini API rate limit exceeded. Please wait a minute and try again.")
            raise
        except (json.JSONDecodeError, KeyError, ValueError):
            return [{"food": "Unknown Food", "class_id": "unknown", "confidence": 0.0}]
