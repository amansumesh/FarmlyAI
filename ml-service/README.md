# Farmly AI - ML Service

Disease detection microservice using FastAPI and PyTorch.

## Features

- **Disease Detection**: Identifies plant diseases from images
- **25 Disease Classes**: Covers 5 major crops (Tomato, Potato, Rice, Wheat, Cotton)
- **Treatment Recommendations**: Provides organic, chemical, and preventive treatments
- **Fast Inference**: <500ms response time
- **RESTful API**: Easy integration with backend services

## Installation

```bash
# Install dependencies
pip install -r requirements.txt
```

## Configuration

Create a `.env` file based on `.env.example`:

```env
PORT=8000
MODEL_PATH=./models/disease_model.pth
DEVICE=cpu
USE_MOCK_MODEL=true
```

## Running the Service

```bash
# Development mode
python -m app.main

# Or using uvicorn directly
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

## API Endpoints

### Health Check
```
GET /health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2026-02-07T...",
  "model_loaded": true,
  "inference_working": true,
  "model_version": "v1.0.0"
}
```

### Disease Detection
```
POST /ml/detect-disease
```

Request:
```json
{
  "image_base64": "<base64_encoded_image>",
  "top_k": 3
}
```

Response:
```json
{
  "success": true,
  "predictions": [
    {
      "disease": "Late Blight",
      "crop": "Tomato",
      "confidence": 0.96,
      "severity": "high",
      "treatments": {
        "organic": [...],
        "chemical": [...],
        "preventive": [...]
      }
    }
  ],
  "top_prediction": {...},
  "inference_time_ms": 420,
  "total_time_ms": 450,
  "model_version": "v1.0.0"
}
```

### Service Info
```
GET /ml/service-info
```

Response:
```json
{
  "service": "Disease Detection Service",
  "version": "v1.0.0",
  "model_info": {
    "num_classes": 25,
    "device": "cpu",
    "model_loaded": true,
    "model_type": "MobileNetV2"
  },
  "available_classes": 25,
  "treatments_loaded": 25
}
```

## Testing

```bash
# Run the test script
python test_api.py
```

## Supported Diseases

### Tomato (10 classes)
- Bacterial Spot
- Early Blight
- Late Blight
- Leaf Mold
- Septoria Leaf Spot
- Spider Mites
- Target Spot
- Yellow Leaf Curl Virus
- Mosaic Virus
- Healthy

### Potato (3 classes)
- Early Blight
- Late Blight
- Healthy

### Rice (5 classes)
- Bacterial Leaf Blight
- Blast
- Brown Spot
- Leaf Smut
- Healthy

### Wheat (3 classes)
- Brown Rust
- Yellow Rust
- Healthy

### Cotton (4 classes)
- Bacterial Blight
- Curl Virus
- Fusarium Wilt
- Healthy

## Model Information

### Current Setup
- **Architecture**: MobileNetV2 (pre-trained on ImageNet)
- **Mode**: Mock model for development (USE_MOCK_MODEL=true)
- **Input Size**: 224x224 RGB
- **Normalization**: ImageNet standard (mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])

### For Production
1. Train or fine-tune a model on PlantVillage dataset
2. Save model weights to `models/disease_model.pth`
3. Set `USE_MOCK_MODEL=false` in `.env`

## Deployment

### Railway.app
```bash
# The service includes railway.json configuration
# Simply connect your GitHub repo to Railway
```

### Render.com
```bash
# The service includes render.yaml configuration
# Deploy using Render's web interface
```

## Performance Targets

- **Inference Time**: <500ms
- **Total Response Time**: <2s
- **Model Accuracy**: >95% (with trained model)

## Architecture

```
ml-service/
├── app/
│   ├── models/
│   │   └── disease_detector.py    # Model wrapper
│   ├── services/
│   │   ├── preprocessing.py       # Image preprocessing
│   │   └── inference.py           # Inference service
│   ├── data/
│   │   ├── disease_classes.json   # Disease metadata
│   │   └── disease_treatments.json # Treatment recommendations
│   ├── config.py                  # Configuration
│   └── main.py                    # FastAPI application
├── models/                        # Trained model files
├── requirements.txt               # Python dependencies
├── .env.example                   # Environment template
└── README.md                      # This file
```

## Notes

- The mock model returns random predictions for development
- For production, replace with a trained PyTorch model
- Ensure proper error handling for invalid images
- Monitor inference latency in production
