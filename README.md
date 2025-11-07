# 🌿 EcoClassify Vision - AI Waste Segregation System

An intelligent waste classification web application powered by deep learning that automatically categorizes waste into recyclable categories using computer vision.

![Python](https://img.shields.io/badge/Python-3.8+-blue)
![TensorFlow](https://img.shields.io/badge/TensorFlow-2.15-orange)
![Flask](https://img.shields.io/badge/Flask-2.3-green)
![License](https://img.shields.io/badge/License-MIT-yellow)

## 🎯 Features

- **📷 Upload Image Mode**: Drag & drop or browse to upload waste images
- **🎥 Webcam Capture**: Capture images directly from your webcam
- **🔴 Live Detection**: Real-time continuous waste classification
- **🧠 AI-Powered**: EfficientNetB0 model trained on 6 waste categories
- **🎨 Modern UI**: Dark theme with green accents and responsive design
- **⚡ Fast Predictions**: Optimized for quick inference

## 📦 Waste Categories

The system classifies waste into 6 categories:
- ♻️ Cardboard
- 🥃 Glass
- 🔩 Metal
- 📄 Paper
- 🥤 Plastic
- 🗑️ Trash

## 🏗️ Project Structure

```
se project/
├── backend/
│   ├── app.py                    # Flask API server
│   ├── model_utils.py            # Model loading & prediction
│   └── uploads/                  # Temporary image storage
│
├── frontend/
│   ├── index.html               # Main webpage
│   ├── css/
│   │   └── style.css            # Styling
│   └── js/
│       └── script.js            # Frontend logic
│
├── models/
│   ├── EfficientNetB0.weights.h5    # Trained model weights
│   └── class_labels.json            # Category labels
│
├── requirements.txt             # Python dependencies
└── waste-seg.ipynb             # Training notebook (reference)
```

## 🚀 Installation & Setup

### Prerequisites
- Python 3.8 or higher
- pip (Python package manager)
- Modern web browser (Chrome, Firefox, Edge)

### Step 1: Install Dependencies

Open a terminal in the project directory and run:

```bash
pip install -r requirements.txt
```

This will install:
- Flask (web framework)
- TensorFlow (deep learning)
- NumPy (numerical computing)
- Pillow (image processing)
- Flask-CORS (cross-origin requests)

### Step 2: Start the Backend Server

Navigate to the backend directory and run:

```bash
cd "c:\Users\Jatin\Desktop\se project"
.\venv\Scripts\Activate.ps1
cd backend
python app.py
```

You should see:
```
🚀 EcoClassify Vision - Waste Segregation System
✓ Server starting on http://localhost:5000
✓ Model loaded and ready for predictions
```

### Step 3: Open the Website

Open your web browser and navigate to:
```
http://localhost:5000
```

The EcoClassify Vision website will load!

## 💻 Usage

### Upload Image Mode
1. Click the **"Upload Image"** tab
2. Drag & drop an image or click **"Browse Files"**
3. Select a waste image (JPG, JPEG, or PNG, max 20MB)
4. Click **"Process Image"**
5. View the classification results with confidence scores

### Webcam Capture Mode
1. Click the **"Capture from Webcam"** tab
2. Click **"Start Webcam"** and allow camera access
3. Point the camera at waste items
4. Click **"Capture & Classify"**
5. View the results

### Live Detection Mode
1. Click the **"Live Detection"** tab
2. Click **"Start Live Detection"**
3. Point the camera at waste items
4. The system will continuously classify waste every 2 seconds
5. Results appear as overlay on the video feed

## 🧪 Testing

Test the system with sample images:
1. Use images from the TrashNet dataset
2. Take photos of common waste items
3. Try different angles and lighting conditions

Expected accuracy: **~76-78%** based on model performance

## 🔧 Technical Details

### Model Architecture
- **Base Model**: EfficientNetB0 (pre-trained on ImageNet)
- **Input Size**: 224×224×3 pixels
- **Output**: 6 waste categories with confidence scores
- **Architecture**:
  - EfficientNetB0 backbone (frozen)
  - GlobalAveragePooling2D
  - Dense layer (128 units, ReLU)
  - Output layer (6 units, Softmax)

### API Endpoints

- **GET** `/` - Serve frontend
- **POST** `/predict` - Classify waste image
  - Request: `multipart/form-data` with image file
  - Response: JSON with predictions
  ```json
  {
    "predicted_class": "plastic",
    "confidence": 99.92,
    "all_predictions": {
      "cardboard": 0.01,
      "glass": 0.02,
      "metal": 0.03,
      "paper": 0.01,
      "plastic": 99.92,
      "trash": 0.01
    }
  }
  ```
- **GET** `/health` - Health check

## 🎨 Customization

### Change Detection Interval (Live Mode)
Edit `frontend/js/script.js`:
```javascript
liveDetectionInterval = setInterval(async () => {
    // ... classification code
}, 2000); // Change 2000 to desired milliseconds
```

### Modify Styling
Edit `frontend/css/style.css` to customize colors, fonts, and layout.

### Add More Categories
1. Retrain the model with new categories
2. Update `models/class_labels.json`
3. Replace `models/EfficientNetB0.weights.h5`

## ⚠️ Troubleshooting

### Model Loading Error
- Ensure `EfficientNetB0.weights.h5` is in the `models/` folder
- Check file size (should be ~18.7 MB)

### Webcam Not Working
- Allow camera permissions in your browser
- Check if another application is using the camera
- Try a different browser

### Prediction Fails
- Verify image format (JPG, JPEG, PNG only)
- Check file size (max 20MB)
- Ensure backend server is running

### CORS Errors
- Make sure Flask-CORS is installed
- Backend must be running on localhost:5000

## 📊 Model Performance

Based on training results:
- **Test Accuracy**: 76.14%
- **Train Accuracy**: 87.50%
- **Validation Accuracy**: 76.19%
- **Generalization Gap**: 11.31% (Excellent)

## 🤝 Contributing

Contributions are welcome! Areas for improvement:
- Add more waste categories
- Improve model accuracy
- Add recycling instructions per category
- Implement multi-language support
- Add waste statistics dashboard

## 📝 License

This project is open source and available under the MIT License.

## 👨‍💻 Author

Built with ❤️ for sustainable waste management

## 🙏 Acknowledgments

- TrashNet dataset for training data
- TensorFlow & Keras for deep learning framework
- EfficientNet architecture by Google Research
- Flask for web framework

