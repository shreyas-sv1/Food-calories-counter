from fastapi import APIRouter, UploadFile, File, HTTPException
from PIL import Image
import io

from ..models.food_model import FoodClassifier
from ..services.nutrition_service import NutritionService
from ..config import settings

router = APIRouter(prefix="/api", tags=["food"])

# Initialize at module level (loaded once)
food_classifier = FoodClassifier()
nutrition_service = NutritionService()

MAX_SIZE_BYTES = settings.max_image_size_mb * 1024 * 1024
ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp", "image/jpg"}


async def validate_image(file: UploadFile) -> bytes:
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type '{file.content_type}'. Allowed: JPEG, PNG, WebP.",
        )

    contents = await file.read()

    if len(contents) > MAX_SIZE_BYTES:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum size is {settings.max_image_size_mb}MB.",
        )

    return contents


@router.post("/predict-food")
async def predict_food(image: UploadFile = File(...)):
    """
    Upload a food image and receive calorie/macro estimation.

    Returns predicted food type, confidence, and nutritional breakdown.
    """
    contents = await validate_image(image)

    try:
        pil_image = Image.open(io.BytesIO(contents))
    except Exception:
        raise HTTPException(status_code=400, detail="Could not process the uploaded image.")

    # Get food prediction via Gemini
    try:
        prediction = food_classifier.predict(pil_image)
    except RuntimeError as e:
        raise HTTPException(status_code=429, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Food analysis failed: {str(e)}")

    # Look up nutrition
    nutrition = nutrition_service.lookup(prediction["class_id"])

    return {
        "food": prediction["food"],
        "confidence": prediction["confidence"],
        "calories": nutrition["calories"],
        "protein": nutrition["protein"],
        "carbs": nutrition["carbs"],
        "fat": nutrition["fat"],
        "fiber": nutrition.get("fiber", 0),
        "serving": nutrition.get("serving", "1 serving"),
    }


@router.post("/predict-food/top-k")
async def predict_food_top_k(image: UploadFile = File(...), k: int = 5):
    """
    Upload a food image and receive top-K predictions with nutrition data.
    """
    contents = await validate_image(image)

    try:
        pil_image = Image.open(io.BytesIO(contents))
    except Exception:
        raise HTTPException(status_code=400, detail="Could not process the uploaded image.")

    try:
        predictions = food_classifier.predict_top_k(pil_image, k=k)
    except RuntimeError as e:
        raise HTTPException(status_code=429, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Food analysis failed: {str(e)}")

    results = []
    for pred in predictions:
        nutrition = nutrition_service.lookup(pred["class_id"])
        results.append({
            "food": pred["food"],
            "confidence": pred["confidence"],
            "calories": nutrition["calories"],
            "protein": nutrition["protein"],
            "carbs": nutrition["carbs"],
            "fat": nutrition["fat"],
            "fiber": nutrition.get("fiber", 0),
            "serving": nutrition.get("serving", "1 serving"),
        })

    return {"predictions": results}
