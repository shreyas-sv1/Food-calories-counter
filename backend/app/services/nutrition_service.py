import json
import os
from difflib import get_close_matches

NUTRITION_DB_PATH = os.path.join(
    os.path.dirname(os.path.abspath(__file__)), "..", "data", "nutrition_db.json"
)


class NutritionService:
    """Service to look up nutritional information for predicted food classes."""

    def __init__(self, db_path: str = None):
        self.db_path = db_path or NUTRITION_DB_PATH
        self.nutrition_data = self._load_database()

    def _load_database(self) -> dict:
        with open(self.db_path, "r") as f:
            return json.load(f)

    def _normalize_name(self, name: str) -> str:
        return name.lower().strip().replace(" ", "_").replace("-", "_")

    def _format_result(self, data: dict, matched_as: str = None) -> dict:
        result = {
            "calories": data["calories"],
            "protein": data["protein"],
            "carbs": data["carbs"],
            "fat": data["fat"],
            "fiber": data.get("fiber", 0),
            "serving": data.get("serving", "1 serving"),
            "matched": True,
        }
        if matched_as:
            result["matched_as"] = matched_as
        return result

    def lookup(self, food_class_id: str) -> dict:
        """
        Look up nutrition info by food class ID (e.g., 'chicken_curry').
        Uses exact match, substring match, fuzzy match, in that order.
        """
        normalized = self._normalize_name(food_class_id)
        all_keys = list(self.nutrition_data.keys())

        # 1. Exact match
        if normalized in self.nutrition_data:
            return self._format_result(self.nutrition_data[normalized])

        # 2. Check if any DB key is contained in the query or vice versa
        # e.g., "bbq_chicken_and_pineapple_pizza" contains "pizza"
        for key in all_keys:
            if key in normalized or normalized in key:
                return self._format_result(
                    self.nutrition_data[key],
                    matched_as=key.replace("_", " ").title(),
                )

        # 3. Check individual words from the query against DB keys
        words = normalized.split("_")
        for word in words:
            if len(word) < 3:
                continue
            for key in all_keys:
                if word in key or key in word:
                    return self._format_result(
                        self.nutrition_data[key],
                        matched_as=key.replace("_", " ").title(),
                    )

        # 4. Fuzzy match
        matches = get_close_matches(normalized, all_keys, n=1, cutoff=0.5)
        if matches:
            matched_key = matches[0]
            return self._format_result(
                self.nutrition_data[matched_key],
                matched_as=matched_key.replace("_", " ").title(),
            )

        # 5. Default fallback
        return {
            "calories": 250,
            "protein": 10,
            "carbs": 30,
            "fat": 10,
            "fiber": 2,
            "serving": "1 serving (estimated)",
            "matched": False,
            "note": "Nutrition data not found for this food. Values are estimated averages.",
        }
