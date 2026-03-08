import numpy as np
import mediapipe as mp
import joblib
import os
from PIL import Image
from sklearn.ensemble import RandomForestRegressor

from ..config import settings

# Landmark indices (same as PoseLandmark enum values)
LEFT_SHOULDER = 11
RIGHT_SHOULDER = 12
LEFT_ELBOW = 13
RIGHT_ELBOW = 14
LEFT_HIP = 23
RIGHT_HIP = 24
LEFT_KNEE = 25
RIGHT_KNEE = 26
LEFT_ANKLE = 27
RIGHT_ANKLE = 28


class BodyFatEstimator:
    """Body fat estimation using MediaPipe PoseLandmarker and a regression model."""

    def __init__(self, model_path: str = None):
        # Use consistent model_dir from settings
        pose_model_path = os.path.join(settings.model_dir, "pose_landmarker_heavy.task")

        if not os.path.exists(pose_model_path):
            raise FileNotFoundError(
                f"Pose landmarker model not found at {pose_model_path}. "
                "Download it with: curl -L -o ml_models/pose_landmarker_heavy.task "
                "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_heavy/float16/latest/pose_landmarker_heavy.task"
            )

        BaseOptions = mp.tasks.BaseOptions
        PoseLandmarker = mp.tasks.vision.PoseLandmarker
        PoseLandmarkerOptions = mp.tasks.vision.PoseLandmarkerOptions

        self.pose_options = PoseLandmarkerOptions(
            base_options=BaseOptions(model_asset_path=pose_model_path),
            num_poses=1,
            min_pose_detection_confidence=0.5,
            min_pose_presence_confidence=0.5,
        )

        self.regressor = None
        if model_path and os.path.exists(model_path):
            loaded_model = joblib.load(model_path)
            if isinstance(loaded_model, dict) and "model" in loaded_model:
                self.regressor = loaded_model["model"]
            else:
                self.regressor = loaded_model
            print(f"Loaded body fat regression model from {model_path}")
        else:
            print("No trained body fat model found. Using heuristic estimation.")

    def _extract_landmarks(self, image: Image.Image) -> dict:
        rgb_array = np.array(image.convert("RGB"))
        h, w, _ = rgb_array.shape

        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_array)

        PoseLandmarker = mp.tasks.vision.PoseLandmarker
        with PoseLandmarker.create_from_options(self.pose_options) as landmarker:
            result = landmarker.detect(mp_image)

        if not result.pose_landmarks or len(result.pose_landmarks) == 0:
            return None

        landmarks = result.pose_landmarks[0]

        def pixel_coords(landmark_id):
            lm = landmarks[landmark_id]
            return np.array([lm.x * w, lm.y * h])

        def distance(p1, p2):
            return np.linalg.norm(p1 - p2)

        left_shoulder = pixel_coords(LEFT_SHOULDER)
        right_shoulder = pixel_coords(RIGHT_SHOULDER)
        left_hip = pixel_coords(LEFT_HIP)
        right_hip = pixel_coords(RIGHT_HIP)
        left_elbow = pixel_coords(LEFT_ELBOW)
        right_elbow = pixel_coords(RIGHT_ELBOW)
        left_knee = pixel_coords(LEFT_KNEE)
        right_knee = pixel_coords(RIGHT_KNEE)
        left_ankle = pixel_coords(LEFT_ANKLE)
        right_ankle = pixel_coords(RIGHT_ANKLE)

        shoulder_width = distance(left_shoulder, right_shoulder)
        hip_width = distance(left_hip, right_hip)
        torso_length = distance(
            (left_shoulder + right_shoulder) / 2,
            (left_hip + right_hip) / 2,
        )

        # Estimate waist width from the midpoint of the torso silhouette
        # Weighted closer to hip width but scaled down to reflect the natural
        # narrowing at the waist relative to both shoulders and hips.
        waist_width = shoulder_width * 0.35 + hip_width * 0.45

        # Estimate chest width (slightly narrower than shoulders)
        chest_width = shoulder_width * 0.88

        # Thigh length
        left_thigh = distance(left_hip, left_knee)
        right_thigh = distance(right_hip, right_knee)
        avg_thigh_length = (left_thigh + right_thigh) / 2

        # Upper arm length
        left_upper_arm = distance(left_shoulder, left_elbow)
        right_upper_arm = distance(right_shoulder, right_elbow)
        avg_upper_arm = (left_upper_arm + right_upper_arm) / 2

        # Lower leg length
        left_lower_leg = distance(left_knee, left_ankle)
        right_lower_leg = distance(right_knee, right_ankle)
        avg_lower_leg = (left_lower_leg + right_lower_leg) / 2

        body_height = torso_length + avg_thigh_length + avg_lower_leg

        return {
            "shoulder_width": shoulder_width,
            "waist_width": waist_width,
            "hip_width": hip_width,
            "chest_width": chest_width,
            "torso_length": torso_length,
            "thigh_length": avg_thigh_length,
            "upper_arm_length": avg_upper_arm,
            "body_height": body_height,
            "waist_to_shoulder_ratio": waist_width / shoulder_width if shoulder_width > 0 else 0,
            "hip_to_waist_ratio": hip_width / waist_width if waist_width > 0 else 0,
            "hip_to_shoulder_ratio": hip_width / shoulder_width if shoulder_width > 0 else 0,
            "torso_to_height_ratio": torso_length / body_height if body_height > 0 else 0,
        }


    def _compute_features(
        self, 
        all_landmarks: list, 
        scale_factor: float = 1.0,
        gender: int = 0,
        age: int = 25,
        bmi: float = 22.0
    ) -> tuple[np.ndarray, dict]:
        """Aggregate features from multiple views into a single feature vector."""
        # Must match training script order
        feature_keys = [
            "shoulder_width", "waist_width", "hip_width", "chest_width",
            "torso_length", "thigh_length", "upper_arm_length", "body_height"
        ]
        
        ratio_keys = [
            "waist_to_shoulder_ratio", "hip_to_waist_ratio",
            "hip_to_shoulder_ratio", "torso_to_height_ratio",
        ]

        aggregated = {}
        valid_landmarks = [lm for lm in all_landmarks if lm is not None]

        if not valid_landmarks:
            return None, None

        # 1. Aggregate fundamental measurements (pixels -> meters)
        for key in feature_keys:
            values = [lm[key] for lm in valid_landmarks if key in lm]
            if values:
                # Average pixels first, then scale
                avg_pixels = np.mean(values)
                aggregated[key] = avg_pixels * scale_factor
            else:
                aggregated[key] = 0.0

        # Custom override: body_height should match input height (meters) exactly if provided
        # The training data has body_height in meters. 
        # The aggregated['body_height'] is (pixel_height * scale_factor) which should be close to height_m.
        
        # 2. Aggregate ratios (scale-invariant, so just average them)
        for key in ratio_keys:
            values = [lm[key] for lm in valid_landmarks if key in lm]
            if values:
                aggregated[key] = np.mean(values)
            else:
                aggregated[key] = 0.0

        # 3. Add demographic features
        aggregated["gender"] = float(gender)
        aggregated["age"] = float(age)
        aggregated["bmi"] = float(bmi)

        # 4. Construct feature vector in correct order
        # Feature names from training script:
        ordered_names = feature_keys + ratio_keys + ["gender", "age", "bmi"]
        
        features = np.array([aggregated[key] for key in ordered_names]).reshape(1, -1)
        return features, aggregated

    def _heuristic_estimate(self, features: dict) -> float:
        """Heuristic body fat estimation based on body ratios."""
        wsr = features.get("waist_to_shoulder_ratio", 0.5)
        hwr = features.get("hip_to_waist_ratio", 0.85)
        # ... (rest of heuristic remains similar, maybe adjusted for gender/age if we wanted)
        
        base = (wsr - 0.42) * 50 + 15
        
        # Simple adjustment for gender if model is not used
        if features.get("gender", 0) == 1: # Female
            base += 7.0
            
        estimate = base 
        return max(5.0, min(45.0, estimate))

    def _categorize_body_fat(self, body_fat: float, gender: int) -> str:
        # Different categories for men (0) and women (1)
        if gender == 1: # Female
            if body_fat < 12: return "Essential Fat"
            elif body_fat < 21: return "Athletic"
            elif body_fat < 25: return "Fitness"
            elif body_fat < 32: return "Average"
            elif body_fat < 40: return "Above Average"
            else: return "Obese"
        else: # Male
            if body_fat < 6: return "Essential Fat"
            elif body_fat < 14: return "Athletic"
            elif body_fat < 18: return "Fitness"
            elif body_fat < 25: return "Average"
            elif body_fat < 32: return "Above Average"
            else: return "Obese"

    def predict(
        self, 
        images: dict, 
        weight_kg: float = 70.0, 
        height_cm: float = 175.0,
        gender: str = "male", 
        age: int = 25
    ) -> dict:
        """
        Predict body fat from multiple body images.

        Args:
            images: dict with keys 'front', 'back', 'left', 'right' mapping to PIL Images
            weight_kg: user's weight in kg
            height_cm: user's height in cm
            gender: 'male' or 'female'
            age: user's age in years

        Returns:
            dict with body_fat, category, lean_mass, fat_mass, and extracted measurements
        """
        all_landmarks = []
        views_processed = []

        # Convert gender to model format (0: Male, 1: Female)
        gender_code = 1 if gender and gender.lower() == "female" else 0
        height_m = height_cm / 100.0
        bmi = weight_kg / (height_m * height_m)

        for view_name in ["front", "back", "left", "right"]:
            if view_name in images and images[view_name] is not None:
                landmarks = self._extract_landmarks(images[view_name])
                all_landmarks.append(landmarks)
                if landmarks is not None:
                    views_processed.append(view_name)

        if not views_processed:
            return {
                "error": "Could not detect body pose in any of the uploaded images. "
                         "Please upload clear, full-body images with good lighting.",
                "views_processed": [],
            }

        # Calculate Scale Factor
        # Average pixel height from all views
        pixel_heights = [lm["body_height"] for lm in all_landmarks if lm and "body_height" in lm]
        if pixel_heights:
            avg_pixel_height = np.mean(pixel_heights)
            # scale_factor * pixel_height = real_height_meters
            scale_factor = height_m / avg_pixel_height if avg_pixel_height > 0 else 0.002
        else:
            scale_factor = 0.002 # Fallback

        features, aggregated = self._compute_features(
            all_landmarks, 
            scale_factor=scale_factor,
            gender=gender_code,
            age=age,
            bmi=bmi
        )
        
        if features is None:
            return {
                "error": "Failed to extract body measurements.",
                "views_processed": views_processed,
            }

        if self.regressor is not None:
            body_fat = float(self.regressor.predict(features)[0])
            body_fat = max(4.0, min(55.0, body_fat))
        else:
            body_fat = self._heuristic_estimate(aggregated)

        body_fat = round(body_fat, 1)
        category = self._categorize_body_fat(body_fat, gender_code)
        fat_mass = round(weight_kg * (body_fat / 100), 1)
        lean_mass = round(weight_kg - fat_mass, 1)

        return {
            "body_fat": body_fat,
            "category": category,
            "lean_mass": lean_mass,
            "fat_mass": fat_mass,
            "weight_kg": weight_kg,
            "views_processed": views_processed,
            "measurements": {
                "shoulder_width": round(aggregated.get("shoulder_width", 0) * 100, 1), # cm
                "waist_width": round(aggregated.get("waist_width", 0) * 100, 1), # cm
                "hip_width": round(aggregated.get("hip_width", 0) * 100, 1), # cm
                "waist_to_shoulder_ratio": round(aggregated.get("waist_to_shoulder_ratio", 0), 4),
                "hip_to_waist_ratio": round(aggregated.get("hip_to_waist_ratio", 0), 4),
            },
        }
