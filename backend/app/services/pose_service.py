from PIL import Image
from ..models.bodyfat_model import BodyFatEstimator
from ..config import settings
import os


class PoseService:
    """Service to handle body pose detection and body fat estimation."""

    def __init__(self):
        model_path = os.path.join(settings.model_dir, "bodyfat_regression", "bodyfat_model.pkl")
        self.estimator = BodyFatEstimator(model_path=model_path)

    def analyze_body(
        self, 
        images: dict, 
        weight_kg: float = 70.0, 
        height_cm: float = 175.0,
        gender: str = "male",
        age: int = 25
    ) -> dict:
        """
        Analyze body images and return body fat estimation.

        Args:
            images: dict mapping view names ('front', 'back', 'left', 'right') to PIL Images
            weight_kg: user's weight in kg
            height_cm: user's height in cm
            gender: 'male' or 'female'
            age: user's age in years
        """
        return self.estimator.predict(
            images, 
            weight_kg=weight_kg, 
            height_cm=height_cm,
            gender=gender,
            age=age
        )
