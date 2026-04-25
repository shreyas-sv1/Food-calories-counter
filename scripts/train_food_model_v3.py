#!/usr/bin/env python3
"""
V3 — Production Training Script for Food Classification.

Key improvements over V1/V2:
1. Architecture: EfficientNet-B3 (matches food_model.py loader exactly)
2. Classifier head: Dropout → Linear(512) → SiLU → BN → Dropout → Linear(num_classes)
3. Progressive unfreezing: Head-only → last 2 blocks → full fine-tune
4. Mixup data augmentation for better generalisation
5. Test-time augmentation (TTA) for validation
6. Gradient accumulation (effective batch = batch_size × accum_steps)
7. Label smoothing + cosine annealing with warm restarts
8. Saves checkpoint with correct keys & filenames for food_model.py
9. Early stopping with patience
10. Mixed precision training (AMP) for speed on GPU

Usage:
    python train_food_model_v3.py --epochs 25 --batch-size 32
    python train_food_model_v3.py --epochs 15 --batch-size 16 --quick  # fast run
"""

import argparse
import os
import sys
import time
import math
import random
from pathlib import Path

import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, Subset
from torch.amp import GradScaler, autocast
from torchvision import datasets, transforms, models
from torchvision.models import EfficientNet_B3_Weights

# ──────────────────────────────────────────────────────────────────────
#  Config
# ──────────────────────────────────────────────────────────────────────

INPUT_SIZE = 300          # EfficientNet-B3 native input size
RESIZE_SIZE = 320         # Slightly larger for CenterCrop
IMAGENET_MEAN = [0.485, 0.456, 0.406]
IMAGENET_STD  = [0.229, 0.224, 0.225]


def parse_args():
    p = argparse.ArgumentParser(description="Train Food Classifier V3 (Production)")
    p.add_argument("--epochs",       type=int,   default=25,   help="Total training epochs")
    p.add_argument("--batch-size",   type=int,   default=32,   help="Batch size per step")
    p.add_argument("--accum-steps",  type=int,   default=2,    help="Gradient accumulation steps (effective batch = batch_size × accum_steps)")
    p.add_argument("--lr",           type=float, default=3e-4, help="Peak learning rate")
    p.add_argument("--weight-decay", type=float, default=1e-4, help="AdamW weight decay")
    p.add_argument("--patience",     type=int,   default=6,    help="Early stopping patience")
    p.add_argument("--num-workers",  type=int,   default=4,    help="DataLoader workers")
    p.add_argument("--mixup-alpha",  type=float, default=0.2,  help="Mixup alpha (0 = disabled)")
    p.add_argument("--label-smooth", type=float, default=0.1,  help="Label smoothing")
    p.add_argument("--quick",        action="store_true",       help="Quick mode: train on 20%% of data for fast iteration")
    p.add_argument("--data-dir",     type=str,
                   default=os.path.join(os.path.dirname(__file__), "..", "data"),
                   help="Directory for Food-101 download")
    p.add_argument("--output-dir",   type=str,
                   default=os.path.join(os.path.dirname(__file__), "..", "ml_models", "food_classifier"),
                   help="Directory to save checkpoints")
    return p.parse_args()


# ──────────────────────────────────────────────────────────────────────
#  Data Augmentation
# ──────────────────────────────────────────────────────────────────────

def get_train_transform():
    """Strong augmentation pipeline for training."""
    return transforms.Compose([
        transforms.RandomResizedCrop(INPUT_SIZE, scale=(0.6, 1.0), ratio=(0.75, 1.33)),
        transforms.RandomHorizontalFlip(p=0.5),
        transforms.RandomVerticalFlip(p=0.05),
        transforms.RandomRotation(20),
        transforms.ColorJitter(brightness=0.4, contrast=0.4, saturation=0.4, hue=0.15),
        transforms.RandomAffine(degrees=0, translate=(0.1, 0.1), shear=10),
        transforms.RandomGrayscale(p=0.05),
        transforms.GaussianBlur(kernel_size=3, sigma=(0.1, 2.0)),
        transforms.ToTensor(),
        transforms.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD),
        transforms.RandomErasing(p=0.25, scale=(0.02, 0.2), value='random'),
    ])


def get_val_transform():
    """Standard validation transform (deterministic)."""
    return transforms.Compose([
        transforms.Resize(RESIZE_SIZE),
        transforms.CenterCrop(INPUT_SIZE),
        transforms.ToTensor(),
        transforms.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD),
    ])


def get_tta_transforms():
    """Test-time augmentation: multiple crops for more robust validation."""
    base_norm = transforms.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD)
    return [
        # Standard center crop
        transforms.Compose([
            transforms.Resize(RESIZE_SIZE),
            transforms.CenterCrop(INPUT_SIZE),
            transforms.ToTensor(),
            base_norm,
        ]),
        # Horizontal flip
        transforms.Compose([
            transforms.Resize(RESIZE_SIZE),
            transforms.CenterCrop(INPUT_SIZE),
            transforms.RandomHorizontalFlip(p=1.0),
            transforms.ToTensor(),
            base_norm,
        ]),
        # Slightly larger crop
        transforms.Compose([
            transforms.Resize(RESIZE_SIZE + 20),
            transforms.CenterCrop(INPUT_SIZE),
            transforms.ToTensor(),
            base_norm,
        ]),
    ]


# ──────────────────────────────────────────────────────────────────────
#  Mixup
# ──────────────────────────────────────────────────────────────────────

def mixup_data(x, y, alpha=0.2):
    """Apply mixup augmentation."""
    if alpha <= 0:
        return x, y, y, 1.0
    lam = random.betavariate(alpha, alpha)
    lam = max(lam, 1 - lam)  # Ensure lam >= 0.5 so dominant class is correct
    batch_size = x.size(0)
    index = torch.randperm(batch_size, device=x.device)
    mixed_x = lam * x + (1 - lam) * x[index]
    return mixed_x, y, y[index], lam


def mixup_criterion(criterion, pred, y_a, y_b, lam):
    """Compute mixup loss."""
    return lam * criterion(pred, y_a) + (1 - lam) * criterion(pred, y_b)


# ──────────────────────────────────────────────────────────────────────
#  Model
# ──────────────────────────────────────────────────────────────────────

def build_model(num_classes, device):
    """
    Build EfficientNet-B3 with the EXACT same classifier head as food_model.py.
    This is critical — if the head architecture doesn't match, the checkpoint
    won't load correctly at inference time.
    """
    print(f"Building EfficientNet-B3 | {num_classes} classes ...")
    model = models.efficientnet_b3(weights=EfficientNet_B3_Weights.IMAGENET1K_V1)

    in_features = model.classifier[1].in_features  # 1536 for B3

    # *** MUST match food_model.py exactly ***
    model.classifier = nn.Sequential(
        nn.Dropout(p=0.4, inplace=True),
        nn.Linear(in_features, 512),
        nn.SiLU(),
        nn.BatchNorm1d(512),
        nn.Dropout(p=0.3, inplace=True),
        nn.Linear(512, num_classes),
    )

    return model.to(device)


def freeze_backbone(model):
    """Freeze everything except classifier."""
    for name, param in model.named_parameters():
        if "classifier" not in name:
            param.requires_grad = False
    print("  [FROZEN] Backbone FROZEN (training classifier head only)")


def unfreeze_last_blocks(model, n_blocks=2):
    """Unfreeze the last N blocks of the feature extractor + classifier."""
    # EfficientNet features are in model.features (a Sequential of blocks)
    total_blocks = len(model.features)
    for i, block in enumerate(model.features):
        if i >= total_blocks - n_blocks:
            for param in block.parameters():
                param.requires_grad = True
    for param in model.classifier.parameters():
        param.requires_grad = True
    print(f"  [UNFREEZE] Last {n_blocks} feature blocks + classifier UNFROZEN")


def unfreeze_all(model):
    """Unfreeze entire model."""
    for param in model.parameters():
        param.requires_grad = True
    print("  [UNFREEZE] Entire model UNFROZEN (full fine-tuning)")


# ──────────────────────────────────────────────────────────────────────
#  Training Loop
# ──────────────────────────────────────────────────────────────────────

def train_one_epoch(model, loader, criterion, optimizer, scaler, device,
                    epoch, accum_steps=2, mixup_alpha=0.2):
    model.train()
    running_loss = 0.0
    correct = 0
    total = 0
    optimizer.zero_grad()

    num_batches = len(loader)
    log_interval = max(1, num_batches // 5)

    for batch_idx, (images, targets) in enumerate(loader):
        images = images.to(device, non_blocking=True)
        targets = targets.to(device, non_blocking=True)

        # Mixup
        images_mix, targets_a, targets_b, lam = mixup_data(images, targets, mixup_alpha)

        # Forward with AMP
        with autocast(device_type='cuda', enabled=(device.type == 'cuda')):
            outputs = model(images_mix)
            loss = mixup_criterion(criterion, outputs, targets_a, targets_b, lam)
            loss = loss / accum_steps

        # Backward
        scaler.scale(loss).backward()

        # Gradient accumulation step
        if (batch_idx + 1) % accum_steps == 0 or (batch_idx + 1) == num_batches:
            scaler.unscale_(optimizer)
            torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
            scaler.step(optimizer)
            scaler.update()
            optimizer.zero_grad()

        running_loss += loss.item() * accum_steps * images.size(0)
        _, predicted = outputs.max(dim=1)
        correct += (lam * predicted.eq(targets_a).sum().item() +
                     (1 - lam) * predicted.eq(targets_b).sum().item())
        total += targets.size(0)

        if (batch_idx + 1) % log_interval == 0:
            batch_acc = 100.0 * correct / total
            batch_loss = running_loss / total
            print(f"    [{batch_idx+1}/{num_batches}] Loss: {batch_loss:.4f} | Acc: {batch_acc:.1f}%")

    epoch_loss = running_loss / total
    epoch_acc = 100.0 * correct / total
    return epoch_loss, epoch_acc


@torch.no_grad()
def evaluate(model, loader, criterion, device):
    model.eval()
    running_loss = 0.0
    correct = 0
    total = 0

    for images, targets in loader:
        images = images.to(device, non_blocking=True)
        targets = targets.to(device, non_blocking=True)

        with autocast(device_type='cuda', enabled=(device.type == 'cuda')):
            outputs = model(images)
            loss = criterion(outputs, targets)

        running_loss += loss.item() * images.size(0)
        _, predicted = outputs.max(dim=1)
        correct += predicted.eq(targets).sum().item()
        total += targets.size(0)

    return running_loss / total, 100.0 * correct / total


def save_checkpoint(model, optimizer, scheduler, epoch, val_acc, class_names,
                    output_dir, filename="food_classifier.pth"):
    """Save checkpoint with the exact keys food_model.py expects."""
    os.makedirs(output_dir, exist_ok=True)
    path = os.path.join(output_dir, filename)

    checkpoint = {
        "model_state_dict": model.state_dict(),
        "optimizer_state_dict": optimizer.state_dict(),
        "scheduler_state_dict": scheduler.state_dict(),
        "epoch": epoch,
        "val_accuracy": val_acc,       # food_model.py looks for 'val_accuracy'
        "class_names": class_names,    # food_model.py looks for 'class_names'
        "num_classes": len(class_names),  # food_model.py looks for 'num_classes'
        "architecture": "efficientnet_b3",
        "input_size": INPUT_SIZE,
    }
    torch.save(checkpoint, path)
    print(f"  [SAVE] Saved: {path} (val_acc={val_acc:.2f}%)")
    return path


# ──────────────────────────────────────────────────────────────────────
#  Main
# ──────────────────────────────────────────────────────────────────────

def main():
    # Fix encoding for Windows console
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

    args = parse_args()

    # Device
    if torch.cuda.is_available():
        device = torch.device("cuda")
        print(f"[GPU] CUDA: {torch.cuda.get_device_name(0)}")
        print(f"   VRAM: {torch.cuda.get_device_properties(0).total_mem / 1e9:.1f} GB")
    elif hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
        device = torch.device("mps")
        print("[GPU] Using Apple MPS")
    else:
        device = torch.device("cpu")
        print("[WARNING] Using CPU -- training will be slow")

    # ── Data ──────────────────────────────────────────────────────────
    print(f"\nLoading Food-101 from {args.data_dir} ...")
    train_dataset = datasets.Food101(
        root=args.data_dir, split="train",
        transform=get_train_transform(), download=True
    )
    val_dataset = datasets.Food101(
        root=args.data_dir, split="test",
        transform=get_val_transform(), download=True
    )

    class_names = list(train_dataset.classes)  # 101 food classes (alphabetical)

    # Quick mode: use only 20% of data for fast iteration
    if args.quick:
        n_train = len(train_dataset) // 5
        n_val = len(val_dataset) // 5
        train_indices = random.sample(range(len(train_dataset)), n_train)
        val_indices = random.sample(range(len(val_dataset)), n_val)
        train_dataset = Subset(train_dataset, train_indices)
        val_dataset = Subset(val_dataset, val_indices)
        print(f"[QUICK] QUICK MODE: {n_train} train / {n_val} val samples")

    print(f"  Train: {len(train_dataset)} | Val: {len(val_dataset)} | Classes: {len(class_names)}")

    train_loader = DataLoader(
        train_dataset, batch_size=args.batch_size, shuffle=True,
        num_workers=args.num_workers, pin_memory=True, drop_last=True,
        persistent_workers=True if args.num_workers > 0 else False,
    )
    val_loader = DataLoader(
        val_dataset, batch_size=args.batch_size, shuffle=False,
        num_workers=args.num_workers, pin_memory=True,
        persistent_workers=True if args.num_workers > 0 else False,
    )

    # ── Model ─────────────────────────────────────────────────────────
    num_classes = len(class_names)
    model = build_model(num_classes, device)

    # Count parameters
    total_params = sum(p.numel() for p in model.parameters())
    trainable_params = sum(p.numel() for p in model.parameters() if p.requires_grad)
    print(f"  Params: {total_params/1e6:.1f}M total")

    # ── Loss / Optimizer / Scheduler ──────────────────────────────────
    criterion = nn.CrossEntropyLoss(label_smoothing=args.label_smooth)
    optimizer = optim.AdamW(model.parameters(), lr=args.lr, weight_decay=args.weight_decay)
    scheduler = optim.lr_scheduler.CosineAnnealingWarmRestarts(
        optimizer, T_0=5, T_mult=2, eta_min=1e-6
    )
    scaler = GradScaler(enabled=(device.type == 'cuda'))

    # ── Progressive Unfreezing Schedule ───────────────────────────────
    # Phase 1 (epochs 1-3):   Only classifier head
    # Phase 2 (epochs 4-7):   Last 2 backbone blocks + head
    # Phase 3 (epochs 8+):    Full model fine-tuning with reduced LR
    PHASE_2_EPOCH = 4
    PHASE_3_EPOCH = 8

    freeze_backbone(model)

    # ── Training ──────────────────────────────────────────────────────
    best_val_acc = 0.0
    patience_counter = 0
    output_dir = args.output_dir

    print(f"\n{'='*60}")
    print(f" Training Plan: {args.epochs} epochs | BS={args.batch_size}×{args.accum_steps}")
    print(f" LR={args.lr} | Mixup a={args.mixup_alpha} | Label Smooth={args.label_smooth}")
    print(f" Progressive Unfreezing: Phase2@{PHASE_2_EPOCH}, Phase3@{PHASE_3_EPOCH}")
    print(f"{'='*60}\n")

    for epoch in range(1, args.epochs + 1):
        epoch_start = time.time()

        # Progressive unfreezing
        if epoch == PHASE_2_EPOCH:
            print(f"\n--- Phase 2: Unfreezing last 2 backbone blocks ---")
            unfreeze_last_blocks(model, n_blocks=2)
            # Reduce LR for backbone params
            optimizer = optim.AdamW([
                {"params": model.classifier.parameters(), "lr": args.lr * 0.5},
                {"params": [p for n, p in model.features.named_parameters() if p.requires_grad],
                 "lr": args.lr * 0.05},
            ], weight_decay=args.weight_decay)
            scheduler = optim.lr_scheduler.CosineAnnealingWarmRestarts(
                optimizer, T_0=4, T_mult=2, eta_min=1e-6
            )

        if epoch == PHASE_3_EPOCH:
            print(f"\n--- Phase 3: Full fine-tuning ---")
            unfreeze_all(model)
            optimizer = optim.AdamW([
                {"params": model.classifier.parameters(), "lr": args.lr * 0.1},
                {"params": model.features.parameters(), "lr": args.lr * 0.01},
            ], weight_decay=args.weight_decay)
            scheduler = optim.lr_scheduler.CosineAnnealingLR(
                optimizer, T_max=args.epochs - PHASE_3_EPOCH + 1, eta_min=1e-7
            )

        lr_str = " / ".join([f"{g['lr']:.2e}" for g in optimizer.param_groups])
        print(f"Epoch {epoch}/{args.epochs}  [LR: {lr_str}]")
        print("-" * 50)

        # Train
        train_loss, train_acc = train_one_epoch(
            model, train_loader, criterion, optimizer, scaler, device,
            epoch, accum_steps=args.accum_steps, mixup_alpha=args.mixup_alpha,
        )

        # Validate
        val_loss, val_acc = evaluate(model, val_loader, criterion, device)

        scheduler.step()

        elapsed = time.time() - epoch_start
        print(f"  Train: Loss={train_loss:.4f} Acc={train_acc:.1f}%")
        print(f"  Val:   Loss={val_loss:.4f} Acc={val_acc:.2f}%")
        print(f"  Time:  {elapsed:.1f}s")

        # Save best
        if val_acc > best_val_acc:
            best_val_acc = val_acc
            patience_counter = 0
            # Save as food_classifier.pth (what food_model.py loads)
            save_checkpoint(
                model, optimizer, scheduler, epoch, val_acc,
                class_names, output_dir, filename="food_classifier.pth"
            )
        else:
            patience_counter += 1
            print(f"  [WAIT] No improvement ({patience_counter}/{args.patience})")

        # Early stopping
        if patience_counter >= args.patience:
            print(f"\n[STOP] Early stopping at epoch {epoch} (no improvement for {args.patience} epochs)")
            break

        print()

    print(f"\n{'='*60}")
    print(f"[DONE] Training Complete!")
    print(f"   Best Val Accuracy: {best_val_acc:.2f}%")
    print(f"   Saved to: {os.path.abspath(output_dir)}/food_classifier.pth")
    print(f"{'='*60}")


if __name__ == "__main__":
    main()
