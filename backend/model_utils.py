import tensorflow as tf
from tensorflow.keras.applications import EfficientNetB0
from tensorflow.keras.layers import (
    GlobalAveragePooling2D,
    Dense,
    Lambda,
    Input,
    Dropout,
    BatchNormalization,
)
from tensorflow.keras.models import Model
from tensorflow.keras.applications.efficientnet import preprocess_input as efficientnet_preprocess
from tensorflow.keras.preprocessing import image
import numpy as np
import json
import os

class WasteClassifier:
    def __init__(self, weights_path, labels_path):
        """Initialize the waste classifier with model weights and labels"""
        self.img_size = (224, 224)
        self.model = None
        self.class_labels = None
        self.weights_path = weights_path
        self.labels_path = labels_path
        
        # Disposal instructions for each waste category
        self.disposal_instructions = {
            'cardboard': {
                'bin': 'Blue Recycling Bin',
                'preparation': ['Flatten boxes to save space', 'Remove any tape or labels', 'Keep dry and clean'],
                'tips': ['Cardboard is 100% recyclable', 'Wet or greasy cardboard goes to trash', 'Pizza boxes with grease should be composted or trashed']
            },
            'glass': {
                'bin': 'Green Recycling Bin',
                'preparation': ['Rinse containers', 'Remove lids and caps', 'No need to remove labels'],
                'tips': ['Glass can be recycled endlessly', 'Broken glass should be wrapped in newspaper', 'Window glass and mirrors are NOT recyclable with bottles']
            },
            'metal': {
                'bin': 'Blue Recycling Bin',
                'preparation': ['Rinse food containers', 'Remove labels if possible', 'Aluminum foil can be recycled if clean'],
                'tips': ['Metal recycling saves 95% energy vs new production', 'Steel cans are magnetic', 'Aerosol cans should be empty']
            },
            'paper': {
                'bin': 'Blue Recycling Bin',
                'preparation': ['Remove plastic windows from envelopes', 'Keep paper dry', 'Staples are OK to leave in'],
                'tips': ['Shredded paper should be bagged', 'Tissues and paper towels go to compost', 'One ton of recycled paper saves 17 trees']
            },
            'plastic': {
                'bin': 'Blue Recycling Bin',
                'preparation': ['Check recycling number (1-7)', 'Rinse containers thoroughly', 'Remove caps and lids'],
                'tips': ['#1 PET and #2 HDPE are most recyclable', 'Plastic bags go to special collection points', 'Only 9% of plastic ever made has been recycled']
            },
            'trash': {
                'bin': 'Black/Gray Trash Bin',
                'preparation': ['Bag securely', 'Consider if any parts are recyclable', 'Dispose of hazardous waste separately'],
                'tips': ['Look for recycling opportunities first', 'Donate items in good condition', 'Reduce, reuse, then recycle']
            }
        }
        
        # Educational facts about waste and recycling
        self.educational_facts = [
            "♻️ Recycling one aluminum can saves enough energy to power a TV for 3 hours!",
            "🌍 Americans throw away 25 trillion Styrofoam cups every year.",
            "📄 Recycling one ton of paper can save 17 trees, 7,000 gallons of water, and 463 gallons of oil.",
            "🥤 A plastic bottle can take up to 450 years to decompose in a landfill.",
            "♻️ Glass is 100% recyclable and can be recycled endlessly without loss of quality.",
            "🌱 Composting food waste can reduce your household waste by up to 30%.",
            "🔋 E-waste contains valuable materials like gold, silver, and copper that can be recovered.",
            "🌊 8 million tons of plastic enter our oceans every year - that's one garbage truck per minute.",
            "♻️ Recycling steel saves 60% of the energy needed to make it from raw materials.",
            "🌍 If everyone in the US recycled their newspaper, we could save 250 million trees annually.",
            "🥫 Aluminum can be recycled and back on the shelf as a new can in just 60 days.",
            "💡 LED bulbs use 75% less energy and last 25 times longer than incandescent bulbs.",
            "🌱 Americans generate 254 million tons of trash per year.",
            "♻️ Recycling creates 6 times more jobs than landfilling waste.",
            "🌍 The average person generates 4.5 pounds of trash per day in the United States."
        ]
        
    def load_model(self):
        """Build and load the EfficientNetB0 model architecture"""
        print("Loading EfficientNetB0 model...")
        
        # Load class labels
        with open(self.labels_path, 'r') as f:
            self.class_labels = json.load(f)
        
        self.model = self._build_model()
        
        # Load trained weights
        try:
            self.model.load_weights(self.weights_path)
            print("✓ Model loaded successfully!")
            print(f"✓ Model accuracy: 76.14% (EfficientNetB0)")
        except Exception as e:
            print(f"Error loading weights: {e}")
            print("Building model with weights from scratch...")
            # If loading fails, compile the model
            self.model.compile(optimizer='adam', loss='categorical_crossentropy', metrics=['accuracy'])

    def _build_model(self):
        """Build EfficientNetB0 architecture matching the weights file."""
        # Determine which head architecture to use based on weights naming convention
        weights_name = os.path.basename(self.weights_path)
        use_improved_head = 'Improved' in weights_name or weights_name.endswith('.keras')

        input_layer = Input(shape=(*self.img_size, 3))

        # CRITICAL: Lambda layer for preprocessing (matches training!)
        x = Lambda(
            lambda x: efficientnet_preprocess(x * 255.),
            output_shape=(*self.img_size, 3)
        )(input_layer)

        base_model = EfficientNetB0(
            weights='imagenet',
            include_top=False,
            input_shape=(*self.img_size, 3)
        )
        base_model.trainable = False

        x = base_model(x)
        x = GlobalAveragePooling2D()(x)

        if use_improved_head:
            x = Dense(256, activation='relu')(x)
            x = BatchNormalization(name='bn_head_1')(x)
            x = Dropout(0.3)(x)
            x = Dense(128, activation='relu')(x)
            x = BatchNormalization(name='bn_head_2')(x)
            x = Dropout(0.2)(x)
        else:
            x = Dense(128, activation='relu')(x)

        outputs = Dense(len(self.class_labels), activation='softmax')(x)

        return Model(input_layer, outputs)
        
    def preprocess_image(self, img_path):
        """Preprocess image for model prediction"""
        img = image.load_img(img_path, target_size=self.img_size)
        img_array = image.img_to_array(img)
        # IMPORTANT: Normalize to [0, 1] range only
        # The Lambda layer in the model will handle efficientnet_preprocess
        img_array = img_array / 255.0
        img_array = np.expand_dims(img_array, axis=0)  # Add batch dimension
        return img_array
    
    def predict(self, img_path):
        """
        Classify waste image and return predictions
        
        Returns:
            dict: {
                'predicted_class': str,
                'confidence': float,
                'all_predictions': dict
            }
        """
        # Preprocess image
        img_array = self.preprocess_image(img_path)
        
        # Make prediction
        predictions = self.model.predict(img_array, verbose=0)
        
        # Get predicted class
        predicted_idx = np.argmax(predictions[0])
        predicted_class = self.class_labels[predicted_idx]
        confidence = float(predictions[0][predicted_idx] * 100)
        
        # Get all predictions
        all_predictions = {
            self.class_labels[i]: float(predictions[0][i] * 100)
            for i in range(len(self.class_labels))
        }
        
        # Check confidence threshold
        is_uncertain = confidence < 60.0
        
        # Get disposal instructions
        disposal_info = self.disposal_instructions.get(predicted_class, {})
        
        # Get a random educational fact
        import random
        educational_fact = random.choice(self.educational_facts)
        
        return {
            'predicted_class': predicted_class,
            'confidence': round(confidence, 2),
            'all_predictions': all_predictions,
            'is_uncertain': is_uncertain,
            'disposal_instructions': disposal_info,
            'educational_fact': educational_fact
        }
