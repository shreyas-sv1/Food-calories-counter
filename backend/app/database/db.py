from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime, timezone
from ..config import settings

engine = create_engine(settings.database_url, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class FoodPrediction(Base):
    __tablename__ = "food_predictions"

    id = Column(Integer, primary_key=True, index=True)
    food_name = Column(String(255), nullable=False)
    confidence = Column(Float, nullable=False)
    calories = Column(Float)
    protein = Column(Float)
    carbs = Column(Float)
    fat = Column(Float)
    image_url = Column(Text)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class BodyFatPrediction(Base):
    __tablename__ = "bodyfat_predictions"

    id = Column(Integer, primary_key=True, index=True)
    body_fat_percentage = Column(Float, nullable=False)
    category = Column(String(100))
    lean_mass = Column(Float)
    fat_mass = Column(Float)
    shoulder_width = Column(Float)
    waist_width = Column(Float)
    hip_width = Column(Float)
    waist_to_shoulder_ratio = Column(Float)
    hip_to_waist_ratio = Column(Float)
    image_urls = Column(Text)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


def init_db():
    Base.metadata.create_all(bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
