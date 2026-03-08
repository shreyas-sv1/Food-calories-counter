#!/usr/bin/env python3
"""
Train an EfficientNetB0 model on the Food-101 dataset using transfer learning.

This script downloads the Food-101 dataset via torchvision, applies data
augmentation, and fine-tunes an EfficientNetB0 backbone pretrained on ImageNet.
The backbone is frozen for the first 3 epochs to warm up the new classifier
head, then unfrozen for end-to-end fine-tuning.

Usage:
    python train_food_model.py --epochs 10 --batch-size 32 --lr 1e-3
"""

import argparse
import os
import time
from pathlib import Path

import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader
from torchvision import datasets, transforms
from torchvision.models import efficientnet_b0, EfficientNet_B0_Weights


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Train EfficientNetB0 on Food-101 with transfer learning."
    )
    parser.add_argument(
        "--epochs",
        type=int,
        default=10,
        help="Total number of training epochs (default: 10).",
    )
    parser.add_argument(
        "--batch-size",
        type=int,
        default=32,
        help="Mini-batch size for training and validation (default: 32).",
    )
    parser.add_argument(
        "--lr",
        type=float,
        default=1e-3,
        help="Initial learning rate for AdamW optimizer (default: 1e-3).",
    )
    parser.add_argument(
        "--output-dir",
        type=str,
        default=os.path.join(os.path.dirname(__file__), "..", "ml_models", "food_classifier"),
        help="Directory to save the trained model checkpoint.",
    )
    parser.add_argument(
        "--data-dir",
        type=str,
        default=os.path.join(os.path.dirname(__file__), "..", "data"),
        help="Directory where Food-101 dataset will be downloaded.",
    )
    parser.add_argument(
        "--num-workers",
        type=int,
        default=4,
        help="Number of data-loading worker processes (default: 4).",
    )
    parser.add_argument(
        "--freeze-epochs",
        type=int,
        default=3,
        help="Number of initial epochs with frozen backbone (default: 3).",
    )
    return parser.parse_args()


def build_transforms() -> dict:
    """Build training and validation transforms.

    Training uses random resized crop, horizontal flip, and color jitter for
    augmentation.  Both pipelines normalise with ImageNet statistics.
    """
    imagenet_mean = [0.485, 0.456, 0.406]
    imagenet_std = [0.229, 0.224, 0.225]

    train_transform = transforms.Compose([
        transforms.RandomResizedCrop(224, scale=(0.8, 1.0)),
        transforms.RandomHorizontalFlip(p=0.5),
        transforms.ColorJitter(brightness=0.2, contrast=0.2, saturation=0.2, hue=0.1),
        transforms.ToTensor(),
        transforms.Normalize(mean=imagenet_mean, std=imagenet_std),
    ])

    val_transform = transforms.Compose([
        transforms.Resize(256),
        transforms.CenterCrop(224),
        transforms.ToTensor(),
        transforms.Normalize(mean=imagenet_mean, std=imagenet_std),
    ])

    return {"train": train_transform, "val": val_transform}


def build_dataloaders(
    data_dir: str, batch_size: int, num_workers: int, transforms_dict: dict
) -> tuple:
    """Download Food-101 and return train / val DataLoaders plus class names."""
    print(f"Loading Food-101 dataset from {data_dir} ...")

    train_dataset = datasets.Food101(
        root=data_dir,
        split="train",
        transform=transforms_dict["train"],
        download=True,
    )
    val_dataset = datasets.Food101(
        root=data_dir,
        split="test",
        transform=transforms_dict["val"],
        download=True,
    )

    class_names = train_dataset.classes

    train_loader = DataLoader(
        train_dataset,
        batch_size=batch_size,
        shuffle=True,
        num_workers=num_workers,
        pin_memory=True,
        drop_last=True,
    )
    val_loader = DataLoader(
        val_dataset,
        batch_size=batch_size,
        shuffle=False,
        num_workers=num_workers,
        pin_memory=True,
    )

    print(f"  Training samples : {len(train_dataset)}")
    print(f"  Validation samples: {len(val_dataset)}")
    print(f"  Number of classes : {len(class_names)}")

    return train_loader, val_loader, class_names


def build_model(num_classes: int, device: torch.device) -> nn.Module:
    """Load EfficientNetB0 with ImageNet weights and replace classifier head."""
    print("Building EfficientNetB0 model with pretrained ImageNet weights ...")

    model = efficientnet_b0(weights=EfficientNet_B0_Weights.IMAGENET1K_V1)

    # Replace the classifier head for Food-101 (101 classes)
    in_features = model.classifier[1].in_features
    model.classifier = nn.Sequential(
        nn.Dropout(p=0.3, inplace=True),
        nn.Linear(in_features, num_classes),
    )

    model = model.to(device)
    return model


def freeze_backbone(model: nn.Module) -> None:
    """Freeze all parameters except the classifier head."""
    for name, param in model.named_parameters():
        if "classifier" not in name:
            param.requires_grad = False


def unfreeze_backbone(model: nn.Module) -> None:
    """Unfreeze all parameters for end-to-end fine-tuning."""
    for param in model.parameters():
        param.requires_grad = True


def train_one_epoch(
    model: nn.Module,
    loader: DataLoader,
    criterion: nn.Module,
    optimizer: optim.Optimizer,
    device: torch.device,
    epoch: int,
) -> tuple:
    """Run one training epoch and return average loss and accuracy."""
    model.train()
    running_loss = 0.0
    correct = 0
    total = 0

    num_batches = len(loader)
    log_interval = max(1, num_batches // 5)

    for batch_idx, (images, targets) in enumerate(loader):
        images = images.to(device, non_blocking=True)
        targets = targets.to(device, non_blocking=True)

        optimizer.zero_grad()
        outputs = model(images)
        loss = criterion(outputs, targets)
        loss.backward()
        optimizer.step()

        running_loss += loss.item() * images.size(0)
        _, predicted = outputs.max(dim=1)
        correct += predicted.eq(targets).sum().item()
        total += targets.size(0)

        if (batch_idx + 1) % log_interval == 0:
            batch_acc = 100.0 * correct / total
            batch_loss = running_loss / total
            print(
                f"  Epoch {epoch} [{batch_idx + 1}/{num_batches}]  "
                f"Loss: {batch_loss:.4f}  Acc: {batch_acc:.2f}%"
            )

    epoch_loss = running_loss / total
    epoch_acc = 100.0 * correct / total
    return epoch_loss, epoch_acc


@torch.no_grad()
def evaluate(
    model: nn.Module,
    loader: DataLoader,
    criterion: nn.Module,
    device: torch.device,
) -> tuple:
    """Evaluate the model on the validation set and return loss and accuracy."""
    model.eval()
    running_loss = 0.0
    correct = 0
    total = 0

    for images, targets in loader:
        images = images.to(device, non_blocking=True)
        targets = targets.to(device, non_blocking=True)

        outputs = model(images)
        loss = criterion(outputs, targets)

        running_loss += loss.item() * images.size(0)
        _, predicted = outputs.max(dim=1)
        correct += predicted.eq(targets).sum().item()
        total += targets.size(0)

    epoch_loss = running_loss / total
    epoch_acc = 100.0 * correct / total
    return epoch_loss, epoch_acc


def save_checkpoint(
    model: nn.Module,
    optimizer: optim.Optimizer,
    epoch: int,
    accuracy: float,
    class_names: list,
    output_dir: str,
) -> str:
    """Save a training checkpoint to disk."""
    os.makedirs(output_dir, exist_ok=True)
    checkpoint_path = os.path.join(output_dir, "food_classifier_efficientnetb0.pth")

    checkpoint = {
        "model_state_dict": model.state_dict(),
        "optimizer_state_dict": optimizer.state_dict(),
        "epoch": epoch,
        "accuracy": accuracy,
        "class_names": class_names,
    }
    torch.save(checkpoint, checkpoint_path)
    print(f"  Checkpoint saved to {checkpoint_path}")
    return checkpoint_path


def main() -> None:
    args = parse_args()

    # Determine compute device
    if torch.cuda.is_available():
        device = torch.device("cuda")
        print(f"Using CUDA device: {torch.cuda.get_device_name(0)}")
    elif hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
        device = torch.device("mps")
        print("Using Apple MPS device")
    else:
        device = torch.device("cpu")
        print("Using CPU device")

    # Data
    transforms_dict = build_transforms()
    train_loader, val_loader, class_names = build_dataloaders(
        data_dir=args.data_dir,
        batch_size=args.batch_size,
        num_workers=args.num_workers,
        transforms_dict=transforms_dict,
    )

    # Model
    num_classes = len(class_names)
    model = build_model(num_classes=num_classes, device=device)

    # Loss, optimiser, scheduler
    criterion = nn.CrossEntropyLoss(label_smoothing=0.1)
    optimizer = optim.AdamW(model.parameters(), lr=args.lr, weight_decay=1e-4)
    scheduler = optim.lr_scheduler.CosineAnnealingLR(
        optimizer, T_max=args.epochs, eta_min=1e-6
    )

    # Freeze backbone for the first few epochs
    freeze_backbone(model)
    print(f"\nBackbone frozen for the first {args.freeze_epochs} epoch(s).\n")

    best_val_acc = 0.0

    for epoch in range(1, args.epochs + 1):
        # Unfreeze backbone after the warm-up phase
        if epoch == args.freeze_epochs + 1:
            unfreeze_backbone(model)
            # Reset optimiser so all parameters use the current LR
            optimizer = optim.AdamW(model.parameters(), lr=args.lr * 0.1, weight_decay=1e-4)
            scheduler = optim.lr_scheduler.CosineAnnealingLR(
                optimizer, T_max=args.epochs - args.freeze_epochs, eta_min=1e-6
            )
            print("Backbone unfrozen -- starting end-to-end fine-tuning.\n")

        epoch_start = time.time()
        current_lr = optimizer.param_groups[0]["lr"]
        print(f"Epoch {epoch}/{args.epochs}  (LR: {current_lr:.6f})")
        print("-" * 50)

        train_loss, train_acc = train_one_epoch(
            model, train_loader, criterion, optimizer, device, epoch
        )
        val_loss, val_acc = evaluate(model, val_loader, criterion, device)
        scheduler.step()

        elapsed = time.time() - epoch_start
        print(
            f"  Train Loss: {train_loss:.4f}  Train Acc: {train_acc:.2f}%\n"
            f"  Val   Loss: {val_loss:.4f}  Val   Acc: {val_acc:.2f}%\n"
            f"  Elapsed   : {elapsed:.1f}s"
        )

        # Save best checkpoint
        if val_acc > best_val_acc:
            best_val_acc = val_acc
            save_checkpoint(
                model=model,
                optimizer=optimizer,
                epoch=epoch,
                accuracy=val_acc,
                class_names=class_names,
                output_dir=args.output_dir,
            )
        print()

    print("=" * 50)
    print(f"Training complete.  Best validation accuracy: {best_val_acc:.2f}%")
    print(f"Model saved to: {os.path.abspath(args.output_dir)}")


if __name__ == "__main__":
    main()
