from pydantic_settings import BaseSettings
from typing import List
import os


class Settings(BaseSettings):
    database_url: str = "postgresql://postgres:password@localhost:5432/fitness_ai"
    gemini_api_key: str = ""
    cloudinary_cloud_name: str = ""
    cloudinary_api_key: str = ""
    cloudinary_api_secret: str = ""
    allowed_origins: str = "http://localhost:5173,http://localhost:3000"
    max_image_size_mb: int = 5
    model_dir: str = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "..", "ml_models")

    @property
    def origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.allowed_origins.split(",")]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
