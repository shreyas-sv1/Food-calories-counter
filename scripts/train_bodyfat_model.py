#!/usr/bin/env python3
"""
Train a RandomForestRegressor for body fat percentage prediction.

Because public body-composition datasets that pair images with ground-truth
body fat measurements are scarce, this script generates synthetic training
data whose feature distributions and target correlations mirror real-world
anthropometric relationships.

Usage:
    python train_bodyfat_model.py --n-samples 2000 --output-dir ../ml_models/bodyfat_regression
"""

import argparse
import os
from pathlib import Path

import joblib
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, r2_score
from sklearn.model_selection import train_test_split


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Train a RandomForestRegressor for body fat prediction."
    )
    parser.add_argument(
        "--n-samples",
        type=int,
        default=2000,
        help="Number of synthetic samples to generate (default: 2000).",
    )
    parser.add_argument(
        "--output-dir",
        type=str,
        default=os.path.join(
            os.path.dirname(__file__), "..", "ml_models", "bodyfat_regression"
        ),
        help="Directory to save the trained model (default: ../ml_models/bodyfat_regression).",
    )
    parser.add_argument(
        "--seed",
        type=int,
        default=42,
        help="Random seed for reproducibility (default: 42).",
    )
    parser.add_argument(
        "--test-size",
        type=float,
        default=0.2,
        help="Fraction of data reserved for testing (default: 0.2).",
    )
    return parser.parse_args()


# ---------------------------------------------------------------------------
# Feature names -- these correspond to measurements that can be extracted from
# a full-body photo using pose-estimation and segmentation models.
# ---------------------------------------------------------------------------
FEATURE_NAMES = [
    "shoulder_width",
    "waist_width",
    "hip_width",
    "chest_width",
    "torso_length",
    "thigh_length",
    "upper_arm_length",
    "body_height",
    "waist_to_shoulder_ratio",
    "hip_to_waist_ratio",
    "hip_to_shoulder_ratio",
    "torso_to_height_ratio",
    "gender",  # 0: Male, 1: Female
    "age",     # Years
    "bmi",     # Body Mass Index
]


def generate_synthetic_data(
    n_samples: int, seed: int
) -> tuple:
    """Generate synthetic anthropometric features with realistic body fat targets.

    The generator samples a latent "body fat factor" first, then derives
    correlated body measurements from it so that higher-fat samples have
    proportionally wider waists relative to shoulders, matching real
    anthropometric relationships.

    Returns:
        X : ndarray of shape (n_samples, 15)
        y : ndarray of shape (n_samples,)  -- body fat percentage [5, 40]
    """
    rng = np.random.default_rng(seed)

    # 1. Generate Demographics
    # -----------------------------------------------------------------------
    # Gender: 0 = Male, 1 = Female
    gender = rng.integers(0, 2, n_samples)
    
    # Age: 18 to 65
    age = rng.integers(18, 66, n_samples)

    # 2. Latent Body Fat Factor
    # -----------------------------------------------------------------------
    # 0 = very lean, 1 = high body fat.
    # Women typically carry more body fat for the same "leanness" level.
    fat_factor = rng.beta(2.5, 3.0, n_samples)

    # 3. Base Skeletal Structure (Height & Frame)
    # -----------------------------------------------------------------------
    # Height (m): Men ~ N(1.77, 0.07), Women ~ N(1.64, 0.06)
    # We'll vectorize this selection
    height_mean = np.where(gender == 0, 1.77, 1.64)
    height_std  = np.where(gender == 0, 0.07, 0.06)
    body_height = rng.normal(height_mean, height_std)

    # Torso length is roughly 47-53% of height
    torso_length = body_height * rng.uniform(0.47, 0.53, n_samples)
    
    # Leg/Arm lengths proportional to height
    thigh_length = body_height * rng.uniform(0.24, 0.29, n_samples)
    upper_arm_length = body_height * rng.uniform(0.17, 0.20, n_samples)

    # 4. Widths & Girths (Correlated with Fat Factor & Gender)
    # -----------------------------------------------------------------------
    # Shoulder Width: Men have broader shoulders
    # Men: ~0.45m base, Women: ~0.38m base (plus correlations with height)
    shoulder_base = np.where(gender == 0, 0.25, 0.23) * body_height
    # Add fat influence (fatter people get slightly wider due to soft tissue)
    shoulder_width = shoulder_base + (fat_factor * 0.05) + rng.normal(0, 0.01, n_samples)

    # Hip Width: Women have wider hips relative to height
    # Men: ~0.18*H, Women: ~0.22*H
    hip_base_ratio = np.where(gender == 0, 0.18, 0.22)
    hip_width = (body_height * hip_base_ratio) + (fat_factor * 0.15) + rng.normal(0, 0.01, n_samples)

    # Waist Width: Highly correlated with fat factor
    # Men accumulate visceral fat (waist expands more linearly)
    # Women accumulate subcutaneous (hips/thighs) but waist also expands
    waist_base = body_height * 0.15
    waist_fat_expansion = fat_factor * 0.25  # Significant expansion with fat
    waist_width = waist_base + waist_fat_expansion + rng.normal(0, 0.01, n_samples)

    # Chest Width: Correlated with shoulders and fat
    chest_width = (shoulder_width * 0.85) + (fat_factor * 0.05) + rng.normal(0, 0.01, n_samples)

    # 5. Ratios
    # -----------------------------------------------------------------------
    waist_to_shoulder_ratio = waist_width / shoulder_width
    hip_to_waist_ratio = hip_width / waist_width
    hip_to_shoulder_ratio = hip_width / shoulder_width
    torso_to_height_ratio = torso_length / body_height

    # 6. Target Variable: Body Fat %
    # -----------------------------------------------------------------------
    # Formula modeled after real world trends:
    # - Base fat for zero fat_factor (Essential fat): Men ~3-5%, Women ~10-13%
    base_fat = np.where(gender == 0, 5.0, 13.0)
    
    # - Fat from factor (Max added fat approx 35-40%)
    added_fat = fat_factor * 35.0
    
    # - Age factor: Metabolism slows, tendency to gain fat or store it differently
    age_contribution = (age - 20) * 0.1  # Slight increase with age

    # Noise
    target_body_fat = base_fat + added_fat + age_contribution + rng.normal(0, 1.5, n_samples)
    target_body_fat = np.clip(target_body_fat, 4.0, 55.0)

    # 7. Derived Metric: BMI (approximate for feature set)
    # We don't have weight directly, but we can approximate it from volume
    # Volume ~ height * width * depth. Let's approximate weight to get BMI.
    # This is just a feature for the model, checking coherence.
    # Weight ~ (Height * Waist * Shoulder) * Density
    approx_volume = body_height * waist_width * shoulder_width * 90  # arbitrary scaling
    approx_weight = approx_volume * (1.0 + fat_factor * 0.2)
    bmi = approx_weight / (body_height ** 2)

    # Pack interactions
    X_dict = {
        "shoulder_width": shoulder_width,
        "waist_width": waist_width,
        "hip_width": hip_width,
        "chest_width": chest_width,
        "torso_length": torso_length,
        "thigh_length": thigh_length,
        "upper_arm_length": upper_arm_length,
        "body_height": body_height,
        "waist_to_shoulder_ratio": waist_to_shoulder_ratio,
        "hip_to_waist_ratio": hip_to_waist_ratio,
        "hip_to_shoulder_ratio": hip_to_shoulder_ratio,
        "torso_to_height_ratio": torso_to_height_ratio,
        "gender": gender,
        "age": age,
        "bmi": bmi
    }

    X = np.column_stack([X_dict[k] for k in FEATURE_NAMES])
    
    return X, target_body_fat


def train_model(
    X_train: np.ndarray, y_train: np.ndarray
) -> RandomForestRegressor:
    """Instantiate and fit a RandomForestRegressor."""
    print("Training RandomForestRegressor ...")
    print(f"  n_estimators   : 200")
    print(f"  max_depth      : 15")
    print(f"  min_samples_split: 5")
    print(f"  Training samples : {X_train.shape[0]}")
    print(f"  Features         : {X_train.shape[1]}")

    model = RandomForestRegressor(
        n_estimators=200,
        max_depth=15,
        min_samples_split=5,
        random_state=42,
        n_jobs=-1,
        verbose=0,
    )
    model.fit(X_train, y_train)
    return model


def evaluate_model(
    model: RandomForestRegressor,
    X_test: np.ndarray,
    y_test: np.ndarray,
) -> tuple:
    """Evaluate the model on the test set and print metrics."""
    y_pred = model.predict(X_test)

    mae = mean_absolute_error(y_test, y_pred)
    r2 = r2_score(y_test, y_pred)

    print("\nTest Set Evaluation")
    print("-" * 40)
    print(f"  Mean Absolute Error (MAE): {mae:.3f}% body fat")
    print(f"  R-squared (R2)           : {r2:.4f}")
    print(f"  Test samples             : {X_test.shape[0]}")

    return mae, r2


def print_feature_importances(
    model: RandomForestRegressor,
    feature_names: list,
) -> None:
    """Print feature importances sorted in descending order."""
    importances = model.feature_importances_
    indices = np.argsort(importances)[::-1]

    print("\nFeature Importances")
    print("-" * 40)
    for rank, idx in enumerate(indices, start=1):
        print(f"  {rank:2d}. {feature_names[idx]:<25s}  {importances[idx]:.4f}")


def save_model(
    model: RandomForestRegressor,
    output_dir: str,
    mae: float,
    r2: float,
    feature_names: list,
) -> str:
    """Persist the trained model and metadata with joblib."""
    os.makedirs(output_dir, exist_ok=True)
    model_path = os.path.join(output_dir, "bodyfat_model.pkl")

    artifact = {
        "model": model,
        "feature_names": feature_names,
        "metrics": {"mae": mae, "r2": r2},
    }
    joblib.dump(artifact, model_path)
    print(f"\nModel saved to {os.path.abspath(model_path)}")
    return model_path


def main() -> None:
    args = parse_args()

    print("=" * 50)
    print("Body Fat Prediction Model Training")
    print("=" * 50)

    # --- Data generation ---------------------------------------------------
    print(f"\nGenerating {args.n_samples} synthetic samples (seed={args.seed}) ...")
    X, y = generate_synthetic_data(n_samples=args.n_samples, seed=args.seed)

    print(f"  Feature matrix shape: {X.shape}")
    print(f"  Target range        : {y.min():.1f}% -- {y.max():.1f}%")
    print(f"  Target mean         : {y.mean():.1f}%")
    print(f"  Target std          : {y.std():.1f}%")

    # --- Train / test split ------------------------------------------------
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=args.test_size, random_state=args.seed
    )
    print(f"\nTrain / test split ({1 - args.test_size:.0%} / {args.test_size:.0%}):")
    print(f"  Training samples  : {X_train.shape[0]}")
    print(f"  Test samples      : {X_test.shape[0]}")

    # --- Training ----------------------------------------------------------
    print()
    model = train_model(X_train, y_train)

    # --- Evaluation --------------------------------------------------------
    mae, r2 = evaluate_model(model, X_test, y_test)

    # --- Feature importances -----------------------------------------------
    print_feature_importances(model, FEATURE_NAMES)

    # --- Save model --------------------------------------------------------
    save_model(
        model=model,
        output_dir=args.output_dir,
        mae=mae,
        r2=r2,
        feature_names=FEATURE_NAMES,
    )

    print("\n" + "=" * 50)
    print("Training complete.")
    print("=" * 50)


if __name__ == "__main__":
    main()
