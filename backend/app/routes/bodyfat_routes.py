from fastapi import APIRouter, UploadFile, File, HTTPException, Form
from PIL import Image
import io
from typing import Optional

from ..services.pose_service import PoseService
from ..config import settings

router = APIRouter(prefix="/api", tags=["bodyfat"])

pose_service = PoseService()

MAX_SIZE_BYTES = settings.max_image_size_mb * 1024 * 1024
ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp", "image/jpg"}


async def validate_and_load_image(file: UploadFile) -> Image.Image:
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

    if len(contents) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    try:
        return Image.open(io.BytesIO(contents))
    except Exception:
        raise HTTPException(status_code=400, detail="Could not process the uploaded image.")


@router.post("/predict-bodyfat")
async def predict_bodyfat(
    front: UploadFile = File(...),
    back: UploadFile = File(...),
    left: UploadFile = File(...),
    right: UploadFile = File(...),
    weight_kg: Optional[float] = Form(70.0),
    height_cm: Optional[float] = Form(175.0),
    gender: Optional[str] = Form("male"),
    age: Optional[int] = Form(25),
):
    """
    Upload 4 body images (front, back, left, right) to estimate body fat percentage.

    Optionally provide weight (kg), height (cm), gender, and age.
    """
    images = {
        "front": await validate_and_load_image(front),
        "back": await validate_and_load_image(back),
        "left": await validate_and_load_image(left),
        "right": await validate_and_load_image(right),
    }

    result = pose_service.analyze_body(
        images, 
        weight_kg=weight_kg, 
        height_cm=height_cm, 
        gender=gender, 
        age=age
    )

    if "error" in result:
        raise HTTPException(status_code=422, detail=result["error"])

    return result
