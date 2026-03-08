from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from .config import settings
from .routes import food_routes, bodyfat_routes


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: initialize database tables (optional, requires PostgreSQL running)
    try:
        from .database.db import init_db
        init_db()
        print("Database tables initialized.")
    except Exception as e:
        print(f"Database initialization skipped: {e}")
        print("App will run without database persistence.")
    yield
    # Shutdown
    print("Shutting down AI Fitness Analyzer.")


app = FastAPI(
    title="AI Fitness Analyzer",
    description="Upload food images for calorie estimation or body images for body fat analysis.",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
app.include_router(food_routes.router)
app.include_router(bodyfat_routes.router)


@app.get("/")
async def root():
    return {
        "app": "AI Fitness Analyzer",
        "version": "1.0.0",
        "endpoints": {
            "food_prediction": "/api/predict-food",
            "food_prediction_top_k": "/api/predict-food/top-k",
            "body_fat_prediction": "/api/predict-bodyfat",
            "docs": "/docs",
        },
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
