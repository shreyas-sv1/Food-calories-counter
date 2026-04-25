import torch
import torch.nn as nn
import torch.optim as optim
import torchvision.datasets as datasets
import torchvision.transforms as transforms
from torch.utils.data import DataLoader
from torchvision.models import efficientnet_b0, EfficientNet_B0_Weights
import os

# 1. Transform
# Matches EfficientNet-B0 requirements (224x224 and ImageNet normalization)
transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], 
                         [0.229, 0.224, 0.225])
])

# 2. Download & load dataset
print("Loading Food-101 dataset...")
train_data = datasets.Food101(root='./data', split='train', 
                               download=True, transform=transform)
test_data = datasets.Food101(root='./data', split='test', 
                              download=True, transform=transform)

# 3. DataLoader
train_loader = DataLoader(train_data, batch_size=32, shuffle=True)
test_loader = DataLoader(test_data, batch_size=32, shuffle=False)

print(f"Training samples: {len(train_data)}")
print(f"Classes: {len(train_data.classes)}")

# ──────────────────────────────────────────────────────────────────────
#  Training Logic (Built for EfficientNet-B0)
# ──────────────────────────────────────────────────────────────────────

device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
num_classes = len(train_data.classes)

print(f"Building EfficientNet-B0 model for {num_classes} classes...")
model = efficientnet_b0(weights=EfficientNet_B0_Weights.IMAGENET1K_V1)

# Replace classifier head to match our classes
num_ftrs = model.classifier[1].in_features
model.classifier = nn.Sequential(
    nn.Dropout(p=0.3, inplace=True),
    nn.Linear(num_ftrs, num_classes)
)
model = model.to(device)

# Loss and Optimizer
criterion = nn.CrossEntropyLoss()
optimizer = optim.Adam(model.parameters(), lr=0.001)

# Training Loop
epochs = 10
print(f"Starting training on {device} for {epochs} epochs...")

for epoch in range(epochs):
    model.train()
    running_loss = 0.0
    correct = 0
    total = 0
    
    for i, (inputs, labels) in enumerate(train_loader):
        inputs, labels = inputs.to(device), labels.to(device)
        
        optimizer.zero_grad()
        outputs = model(inputs)
        loss = criterion(outputs, labels)
        loss.backward()
        optimizer.step()
        
        running_loss += loss.item()
        _, predicted = outputs.max(1)
        total += labels.size(0)
        correct += predicted.eq(labels).sum().item()
        
        if i % 100 == 99:
            print(f'Epoch {epoch+1}/{epochs} | Batch {i+1} | Loss: {running_loss/100:.4f} | Acc: {100.*correct/total:.2f}%')
            running_loss = 0.0

    # Validation
    model.eval()
    val_correct = 0
    val_total = 0
    with torch.no_grad():
        for inputs, labels in test_loader:
            inputs, labels = inputs.to(device), labels.to(device)
            outputs = model(inputs)
            _, predicted = outputs.max(1)
            val_total += labels.size(0)
            val_correct += predicted.eq(labels).sum().item()
    
    val_acc = 100. * val_correct / val_total
    print(f'--- Epoch {epoch+1} Summary: Val Acc: {val_acc:.2f}% ---')

# Save Weights to the location expected by app.py/food_model.py
save_path = 'ml_models/food_classifier/food_classifier.pth'
os.makedirs(os.path.dirname(save_path), exist_ok=True)

torch.save({
    'model_state_dict': model.state_dict(),
    'class_names': train_data.classes,
    'num_classes': num_classes,
    'architecture': 'efficientnet_b0',
    'val_accuracy': val_acc
}, save_path)

print(f"Training complete. Weights saved to: {save_path}")
