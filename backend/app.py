from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from werkzeug.utils import secure_filename
import os
import sys
from model_utils import WasteClassifier

app = Flask(__name__, static_folder='../frontend')
CORS(app)

# Configuration
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}
MAX_FILE_SIZE = 20 * 1024 * 1024  # 20MB

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = MAX_FILE_SIZE

# Create upload folder if it doesn't exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Initialize model (Original EfficientNetB0 - Testing)
MODEL_PATH = '../models/EfficientNetB0_Optimized.weights.h5'
LABELS_PATH = '../models/class_labels.json'

classifier = WasteClassifier(MODEL_PATH, LABELS_PATH)
classifier.load_model()

def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/')
def index():
    """Serve the main HTML page"""
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    """Serve static files (CSS, JS)"""
    return send_from_directory(app.static_folder, path)

@app.route('/predict', methods=['POST'])
def predict():
    """Handle waste classification prediction"""
    try:
        # Check if file is present
        if 'file' not in request.files:
            return jsonify({'error': 'No file uploaded'}), 400
        
        file = request.files['file']
        
        # Check if file is selected
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        # Validate file type
        if not allowed_file(file.filename):
            return jsonify({'error': 'Invalid file type. Please upload JPG, JPEG, or PNG'}), 400
        
        # Save file temporarily
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        # Make prediction
        result = classifier.predict(filepath)
        
        # Clean up temporary file
        os.remove(filepath)
        
        return jsonify(result), 200
    
    except Exception as e:
        print(f"Error during prediction: {str(e)}", file=sys.stderr)
        return jsonify({'error': f'Prediction failed: {str(e)}'}), 500

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'model_loaded': classifier.model is not None}), 200

if __name__ == '__main__':
    print("\n" + "="*70)
    print("🚀 EcoClassify Vision - Waste Segregation System")
    print("="*70)
    print("✓ Server starting on http://localhost:5000")
    print("✓ EfficientNetB0 model loaded (76.14% accuracy)")
    print("✓ Ready for predictions!")
    print("="*70 + "\n")
    
    app.run(debug=True, host='0.0.0.0', port=5000)
