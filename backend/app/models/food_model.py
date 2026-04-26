import json
import torch
import torch.nn as nn
from PIL import Image
from torchvision import transforms, models
from torchvision.models import EfficientNet_B0_Weights
from pathlib import Path

# Full Food-101 class list (alphabetical order — matches torchvision.datasets.Food101)
FOOD101_CLASSES = [
    'apple_pie','baby_back_ribs','baklava','beef_carpaccio','beef_tartare',
    'beet_salad','beignets','bibimbap','bread_pudding','breakfast_burrito',
    'bruschetta','caesar_salad','cannoli','caprese_salad','carrot_cake',
    'ceviche','cheese_plate','cheesecake','chicken_curry','chicken_quesadilla',
    'chicken_wings','chocolate_cake','chocolate_mousse','churros','clam_chowder',
    'club_sandwich','crab_cakes','creme_brulee','croque_madame','cup_cakes',
    'deviled_eggs','donuts','dumplings','edamame','eggs_benedict',
    'escargots','falafel','filet_mignon','fish_and_chips','foie_gras',
    'french_fries','french_onion_soup','french_toast','fried_calamari','fried_rice',
    'frozen_yogurt','garlic_bread','gnocchi','greek_salad','grilled_cheese_sandwich',
    'grilled_salmon','guacamole','gyoza','hamburger','hot_and_sour_soup',
    'hot_dog','huevos_rancheros','hummus','ice_cream','lasagna',
    'lobster_bisque','lobster_roll_sandwich','macaroni_and_cheese','macarons','miso_soup',
    'mussels','nachos','omelette','onion_rings','oysters',
    'pad_thai','paella','pancakes','panna_cotta','peking_duck',
    'pho','pizza','pork_chop','poutine','prime_rib',
    'pulled_pork_sandwich','ramen','ravioli','red_velvet_cake','risotto',
    'samosa','sashimi','scallops','seaweed_salad','shrimp_and_grits',
    'spaghetti_bolognese','spaghetti_carbonara','spring_rolls','steak','strawberry_shortcake',
    'sushi','tacos','takoyaki','tiramisu','tuna_tartare','waffles',
    'aloo_gobi', 'aloo_paratha', 'biryani', 'butter_chicken', 'chai',
    'chaat', 'chole_bhature', 'dal_makhani', 'dal_tadka', 'dhokla',
    'dosa', 'gulab_jamun', 'halwa', 'idli', 'jalebi',
    'kadai_paneer', 'kheer', 'lassi', 'matar_paneer', 'medu_vada',
    'naan', 'palak_paneer', 'paneer_tikka', 'pani_puri', 'paratha',
    'pav_bhaji', 'poha', 'rasgulla', 'rava_dosa', 'rava_idli',
    'rasmalai', 'roti', 'shahi_paneer', 'tandoori_chicken', 'upma',
    'uttapam', 'vada_pav', 'vindaloo', 'malai_kofta', 'korma',
]

# Minimum confidence threshold — predictions below this are flagged as unreliable
LOW_CONFIDENCE_THRESHOLD = 0.40


class FoodClassifier:
    """
    CNN Food Classifier using EfficientNet-B3.

    Modes:
      - Trained mode: loads fine-tuned Food-101 checkpoint (.pth file).
      - Demo mode: uses ImageNet-pretrained weights with a Food-101 class
        mapping. Predictions are rough but the server starts immediately
        without needing to train first.
    """

    def __init__(self):
        # ml_models is at project root: fitness-ai-app/ml_models/
        project_root = Path(__file__).parent.parent.parent.parent
        model_path = project_root / 'ml_models/model.pth'
        
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.class_names = FOOD101_CLASSES[:101] # Ensure only the 101 standard classes
        
        # 1. Initialize EfficientNet-B0
        self.model = models.efficientnet_b0(weights=None)
        num_ftrs = self.model.classifier[1].in_features # 1280
        
        # 2. Load trained weights
        if model_path.exists():
            try:
                checkpoint = torch.load(model_path, map_location='cpu')
                
                # Extract state dict (handle if it's the whole checkpoint or just weights)
                state_dict = checkpoint if 'model_state_dict' not in checkpoint else checkpoint['model_state_dict']
                
                # Check num_classes from weights
                weight_key = 'classifier.1.weight'
                if weight_key in state_dict:
                    num_classes = state_dict[weight_key].shape[0]
                else:
                    num_classes = 101
                
                # Rebuild classifier head to match the training script: Sequential(Dropout, Linear)
                self.model.classifier = nn.Sequential(
                    nn.Dropout(p=0.3, inplace=True),
                    nn.Linear(num_ftrs, num_classes)
                )

                self.model.load_state_dict(state_dict)
                print(f"[FoodClassifier] Loaded model.pth successfully ({num_classes} classes)")
            except Exception as e:
                print(f"[FoodClassifier] Error loading model.pth: {e}. Using ImageNet weights.")
                self.model = models.efficientnet_b0(weights=EfficientNet_B0_Weights.IMAGENET1K_V1)
                self.model.classifier = nn.Sequential(
                    nn.Dropout(p=0.3, inplace=True),
                    nn.Linear(num_ftrs, 101)
                )
        else:
            print(f"[FoodClassifier] model.pth not found at {model_path}. Using ImageNet weights.")
            self.model = models.efficientnet_b0(weights=EfficientNet_B0_Weights.IMAGENET1K_V1)
            self.model.classifier = nn.Sequential(
                nn.Dropout(p=0.3, inplace=True),
                nn.Linear(num_ftrs, 101)
            )
        
        self.model.eval()
        self.model.to(self.device)

        # 3. Preprocessing (224x224 for B0)
        self.transform = transforms.Compose([
            transforms.Resize(256),
            transforms.CenterCrop(224),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
        ])
        
        # Disable TTA for standard prediction to keep it fast and clean as requested
        self.tta_mode = False
        
        # Test-time augmentation transforms for better prediction accuracy
        self.tta_transforms = [
            self.transform,  # Standard
            transforms.Compose([  # Horizontal flip
                transforms.Resize(320),
                transforms.CenterCrop(300),
                transforms.RandomHorizontalFlip(p=1.0),
                transforms.ToTensor(),
                transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
            ]),
            transforms.Compose([  # Slightly different crop
                transforms.Resize(340),
                transforms.CenterCrop(300),
                transforms.ToTensor(),
                transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
            ]),
        ]
        
        # Training transform for future resilience
        self.train_transform = transforms.Compose([
            transforms.RandomResizedCrop(300, scale=(0.7, 1.0)),
            transforms.RandomHorizontalFlip(),
            transforms.ColorJitter(brightness=0.3, contrast=0.3, saturation=0.3, hue=0.1),
            transforms.RandomRotation(15),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
        ])

    def _preprocess(self, image: Image.Image) -> torch.Tensor:
        image = image.convert('RGB')
        return self.transform(image).unsqueeze(0).to(self.device)

    def _preprocess_tta(self, image: Image.Image) -> list:
        """Preprocess image with multiple TTA transforms."""
        image = image.convert('RGB')
        return [t(image).unsqueeze(0).to(self.device) for t in self.tta_transforms]

    def _format_class_name(self, class_id: str) -> str:
        """Convert snake_case class id to readable Title Case."""
        return ' '.join(w.capitalize() for w in class_id.replace('_', ' ').split())

    def predict(self, image: Image.Image) -> dict:
        """
        Predict food class. Uses TTA if tta_mode is True.
        Returns real confidence scores.
        """
        with torch.no_grad():
            if self.tta_mode:
                # TTA: average over augmented views
                tta_inputs = self._preprocess_tta(image)
                all_probs = []
                for inp in tta_inputs:
                    out = self.model(inp)
                    all_probs.append(torch.softmax(out, dim=1))
                probs = torch.mean(torch.stack(all_probs), dim=0)
            else:
                # Single forward pass
                input_tensor = self._preprocess(image)
                outputs = self.model(input_tensor)
                probs = torch.softmax(outputs, dim=1)

            confidence, pred_id = torch.max(probs, 1)
            confidence = confidence.item()
            class_id = self.class_names[pred_id.item()]

        result = {
            "food": self._format_class_name(class_id),
            "class_id": class_id,
            "confidence": confidence,
        }

        # Honest warnings based on real confidence
        if confidence < LOW_CONFIDENCE_THRESHOLD:
            result["warning"] = (
                f"Low confidence ({confidence:.0%}). "
                "Try uploading a clearer, well-lit photo of just the food."
            )

        return result

    def predict_top_k(self, image: Image.Image, k: int = 5) -> list:
        """
        Return top-K predictions with real confidence scores.
        Uses TTA if tta_mode is True.
        """
        with torch.no_grad():
            if self.tta_mode:
                # TTA: average over augmented views
                tta_inputs = self._preprocess_tta(image)
                all_probs = []
                for inp in tta_inputs:
                    out = self.model(inp)
                    all_probs.append(torch.softmax(out, dim=1))
                probs = torch.mean(torch.stack(all_probs), dim=0)
            else:
                input_tensor = self._preprocess(image)
                outputs = self.model(input_tensor)
                probs = torch.softmax(outputs, dim=1)

            topk_prob, topk_id = torch.topk(probs, k)

        results = []
        for i in range(k):
            conf = topk_prob[0, i].item()
            results.append({
                "food": self._format_class_name(self.class_names[topk_id[0, i].item()]),
                "class_id": self.class_names[topk_id[0, i].item()],
                "confidence": conf,
            })

        return results