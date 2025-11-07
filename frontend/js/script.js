// ===== Global Variables =====
const API_URL = 'http://localhost:5000';
let currentFile = null;
let webcamStream = null;
let liveStream = null;
let liveDetectionInterval = null;
let classificationHistory = [];

// ===== Theme Management =====
const themeToggle = document.getElementById('themeToggle');
const body = document.body;

// Load theme from localStorage
const savedTheme = localStorage.getItem('theme') || 'dark';
if (savedTheme === 'light') {
    body.classList.add('light-theme');
    themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
}

themeToggle.addEventListener('click', () => {
    body.classList.toggle('light-theme');
    const isLight = body.classList.contains('light-theme');
    themeToggle.innerHTML = isLight ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
});

// ===== DOM Elements =====
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
const uploadZone = document.getElementById('uploadZone');
const fileInput = document.getElementById('fileInput');
const browseBtn = document.getElementById('browseBtn');
const processBtn = document.getElementById('processBtn');
const resetBtn = document.getElementById('resetBtn');
const imagePreview = document.getElementById('imagePreview');
const resultContent = document.getElementById('resultContent');
const loadingOverlay = document.getElementById('loadingOverlay');
const disposalPanel = document.getElementById('disposalPanel');
const disposalContent = document.getElementById('disposalContent');
const factPanel = document.getElementById('factPanel');
const factContent = document.getElementById('factContent');
const historyContent = document.getElementById('historyContent');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');

// Webcam elements
const startWebcamBtn = document.getElementById('startWebcamBtn');
const captureBtn = document.getElementById('captureBtn');
const stopWebcamBtn = document.getElementById('stopWebcamBtn');
const webcamVideo = document.getElementById('webcamVideo');
const webcamCanvas = document.getElementById('webcamCanvas');
const webcamOverlay = document.getElementById('webcamOverlay');
const webcamResults = document.getElementById('webcamResults');
const webcamImagePreview = document.getElementById('webcamImagePreview');
const webcamResultContent = document.getElementById('webcamResultContent');

// Live detection elements
const startLiveBtn = document.getElementById('startLiveBtn');
const stopLiveBtn = document.getElementById('stopLiveBtn');
const liveVideo = document.getElementById('liveVideo');
const liveCanvas = document.getElementById('liveCanvas');
const liveOverlay = document.getElementById('liveOverlay');
const liveResultOverlay = document.getElementById('liveResultOverlay');
const livePredictionLabel = document.getElementById('livePredictionLabel');

// ===== History Management =====
// Load history from localStorage
function loadHistory() {
    const saved = localStorage.getItem('classificationHistory');
    if (saved) {
        classificationHistory = JSON.parse(saved);
        updateHistoryDisplay();
    }
}

// Save history to localStorage
function saveHistory() {
    localStorage.setItem('classificationHistory', JSON.stringify(classificationHistory));
}

// Add item to history
function addToHistory(result) {
    const historyItem = {
        id: Date.now(),
        timestamp: new Date().toLocaleString(),
        predicted_class: result.predicted_class,
        confidence: result.confidence,
        is_uncertain: result.is_uncertain
    };
    
    classificationHistory.unshift(historyItem); // Add to beginning
    if (classificationHistory.length > 10) {
        classificationHistory = classificationHistory.slice(0, 10); // Keep only last 10
    }
    
    saveHistory();
    updateHistoryDisplay();
}

// Update history display
function updateHistoryDisplay() {
    if (classificationHistory.length === 0) {
        historyContent.innerHTML = '<p class="no-history">No classifications yet. Start by uploading an image!</p>';
        return;
    }
    
    let html = '<div class="history-items">';
    classificationHistory.forEach(item => {
        const uncertainBadge = item.is_uncertain ? '<span class="uncertain-badge">Uncertain</span>' : '';
        html += `
            <div class="history-item">
                <div class="history-item-header">
                    <span class="history-class">${item.predicted_class.toUpperCase()}</span>
                    ${uncertainBadge}
                </div>
                <div class="history-timestamp">${item.timestamp}</div>
            </div>
        `;
    });
    html += '</div>';
    
    historyContent.innerHTML = html;
}

// Clear history
clearHistoryBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to clear all classification history?')) {
        classificationHistory = [];
        saveHistory();
        updateHistoryDisplay();
    }
});

// Load history on page load
loadHistory();

// ===== Tab Switching =====
tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const tabName = btn.dataset.tab;
        
        // Remove active class from all tabs
        tabBtns.forEach(b => b.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));
        
        // Add active class to clicked tab
        btn.classList.add('active');
        document.getElementById(`${tabName}-tab`).classList.add('active');
        
        // Stop any running streams when switching tabs
        stopWebcam();
        stopLiveDetection();
    });
});

// ===== Upload Image Tab =====
browseBtn.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) handleFileSelect(file);
});

// Drag and drop
uploadZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadZone.classList.add('drag-over');
});

uploadZone.addEventListener('dragleave', () => {
    uploadZone.classList.remove('drag-over');
});

uploadZone.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadZone.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
});

uploadZone.addEventListener('click', (e) => {
    if (e.target === uploadZone || e.target.closest('.upload-zone')) {
        fileInput.click();
    }
});

function handleFileSelect(file) {
    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(file.type)) {
        alert('Please upload a valid image file (JPG, JPEG, or PNG)');
        return;
    }
    
    // Validate file size (20MB)
    if (file.size > 20 * 1024 * 1024) {
        alert('File size must be less than 20MB');
        return;
    }
    
    currentFile = file;
    displayImagePreview(file);
    processBtn.disabled = false;
}

function displayImagePreview(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        imagePreview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
    };
    reader.readAsDataURL(file);
}

// Process Image
processBtn.addEventListener('click', async () => {
    if (!currentFile) return;
    
    loadingOverlay.classList.add('active');
    
    try {
        const formData = new FormData();
        formData.append('file', currentFile);
        
        const response = await fetch(`${API_URL}/predict`, {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            throw new Error('Prediction failed');
        }
        
        const result = await response.json();
        displayResults(result);
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to classify image. Please try again.');
    } finally {
        loadingOverlay.classList.remove('active');
    }
});

// Reset
resetBtn.addEventListener('click', () => {
    currentFile = null;
    fileInput.value = '';
    imagePreview.innerHTML = `
        <div class="empty-state">
            <i class="fas fa-image"></i>
            <p>No image uploaded</p>
        </div>
    `;
    resultContent.innerHTML = `
        <div class="empty-state">
            <i class="fas fa-file-alt"></i>
            <p>Results will appear here</p>
        </div>
    `;
    disposalPanel.style.display = 'none';
    factPanel.style.display = 'none';
    processBtn.disabled = true;
});

function displayResults(result) {
    const { predicted_class, disposal_instructions, educational_fact } = result;
    
    // Display only the classification result
    let html = `
        <div class="prediction-result">
            <div class="predicted-class">${predicted_class.toUpperCase()}</div>
        </div>
    `;
    
    resultContent.innerHTML = html;
    
    // Display disposal instructions
    if (disposal_instructions) {
        displayDisposalInstructions(disposal_instructions);
    }
    
    // Display educational fact
    if (educational_fact) {
        displayEducationalFact(educational_fact);
    }
    
    // Add to history
    addToHistory(result);
}

// Display disposal instructions
function displayDisposalInstructions(instructions) {
    if (!instructions.bin) {
        disposalPanel.style.display = 'none';
        return;
    }
    
    let html = `
        <div class="disposal-info">
            <div class="disposal-bin">
                <i class="fas fa-trash-alt"></i>
                <strong>Dispose in:</strong> ${instructions.bin}
            </div>
            
            <div class="disposal-section">
                <h4><i class="fas fa-check-circle"></i> Preparation Steps:</h4>
                <ul>
                    ${instructions.preparation.map(step => `<li>${step}</li>`).join('')}
                </ul>
            </div>
            
            <div class="disposal-section">
                <h4><i class="fas fa-info-circle"></i> Helpful Tips:</h4>
                <ul>
                    ${instructions.tips.map(tip => `<li>${tip}</li>`).join('')}
                </ul>
            </div>
        </div>
    `;
    
    disposalContent.innerHTML = html;
    disposalPanel.style.display = 'block';
}

// Display educational fact
function displayEducationalFact(fact) {
    factContent.innerHTML = `
        <div class="educational-fact">
            <p>${fact}</p>
        </div>
    `;
    factPanel.style.display = 'block';
}

// ===== Webcam Tab =====
startWebcamBtn.addEventListener('click', async () => {
    try {
        webcamStream = await navigator.mediaDevices.getUserMedia({ 
            video: { width: 640, height: 480 } 
        });
        webcamVideo.srcObject = webcamStream;
        webcamOverlay.style.display = 'none';
        
        startWebcamBtn.disabled = true;
        captureBtn.disabled = false;
        stopWebcamBtn.disabled = false;
    } catch (error) {
        console.error('Error accessing webcam:', error);
        alert('Failed to access webcam. Please check permissions.');
    }
});

captureBtn.addEventListener('click', async () => {
    // Capture frame from webcam
    webcamCanvas.width = webcamVideo.videoWidth;
    webcamCanvas.height = webcamVideo.videoHeight;
    const ctx = webcamCanvas.getContext('2d');
    ctx.drawImage(webcamVideo, 0, 0);
    
    // Convert to blob and display
    webcamCanvas.toBlob(async (blob) => {
        const file = new File([blob], 'webcam-capture.jpg', { type: 'image/jpeg' });
        
        // Display captured image
        const imageUrl = URL.createObjectURL(blob);
        webcamImagePreview.innerHTML = `<img src="${imageUrl}" alt="Captured">`;
        webcamResults.style.display = 'grid';
        
        // Classify
        loadingOverlay.classList.add('active');
        
        try {
            const formData = new FormData();
            formData.append('file', file);
            
            const response = await fetch(`${API_URL}/predict`, {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                throw new Error('Prediction failed');
            }
            
            const result = await response.json();
            displayWebcamResults(result);
        } catch (error) {
            console.error('Error:', error);
            alert('Failed to classify image. Please try again.');
        } finally {
            loadingOverlay.classList.remove('active');
        }
    }, 'image/jpeg');
});

stopWebcamBtn.addEventListener('click', stopWebcam);

function stopWebcam() {
    if (webcamStream) {
        webcamStream.getTracks().forEach(track => track.stop());
        webcamStream = null;
        webcamVideo.srcObject = null;
        webcamOverlay.style.display = 'flex';
        webcamResults.style.display = 'none';
        
        startWebcamBtn.disabled = false;
        captureBtn.disabled = true;
        stopWebcamBtn.disabled = true;
    }
}

function displayWebcamResults(result) {
    const { predicted_class } = result;
    
    let html = `
        <div class="prediction-result">
            <div class="predicted-class">${predicted_class.toUpperCase()}</div>
        </div>
    `;
    
    webcamResultContent.innerHTML = html;
    
    // Add to history
    addToHistory(result);
}

// ===== Live Detection Tab =====
startLiveBtn.addEventListener('click', async () => {
    try {
        liveStream = await navigator.mediaDevices.getUserMedia({ 
            video: { width: 640, height: 480 } 
        });
        liveVideo.srcObject = liveStream;
        liveOverlay.style.display = 'none';
        liveResultOverlay.style.display = 'block';
        
        startLiveBtn.disabled = true;
        stopLiveBtn.disabled = false;
        
        // Start continuous detection
        startLiveDetection();
    } catch (error) {
        console.error('Error accessing webcam:', error);
        alert('Failed to access webcam. Please check permissions.');
    }
});

stopLiveBtn.addEventListener('click', stopLiveDetection);

function startLiveDetection() {
    liveDetectionInterval = setInterval(async () => {
        if (!liveStream) return;
        
        // Capture frame
        liveCanvas.width = liveVideo.videoWidth;
        liveCanvas.height = liveVideo.videoHeight;
        const ctx = liveCanvas.getContext('2d');
        ctx.drawImage(liveVideo, 0, 0);
        
        // Convert to blob and classify
        liveCanvas.toBlob(async (blob) => {
            const file = new File([blob], 'live-frame.jpg', { type: 'image/jpeg' });
            
            try {
                const formData = new FormData();
                formData.append('file', file);
                
                const response = await fetch(`${API_URL}/predict`, {
                    method: 'POST',
                    body: formData
                });
                
                if (response.ok) {
                    const result = await response.json();
                    updateLiveResult(result);
                }
            } catch (error) {
                console.error('Live detection error:', error);
            }
        }, 'image/jpeg');
    }, 2000); // Classify every 2 seconds
}

function stopLiveDetection() {
    if (liveDetectionInterval) {
        clearInterval(liveDetectionInterval);
        liveDetectionInterval = null;
    }
    
    if (liveStream) {
        liveStream.getTracks().forEach(track => track.stop());
        liveStream = null;
        liveVideo.srcObject = null;
        liveOverlay.style.display = 'flex';
        liveResultOverlay.style.display = 'none';
        
        startLiveBtn.disabled = false;
        stopLiveBtn.disabled = true;
        
        livePredictionLabel.textContent = '-';
    }
}

function updateLiveResult(result) {
    const { predicted_class, confidence } = result;
    livePredictionLabel.textContent = `${predicted_class.toUpperCase()}`;
}

// ===== Cleanup on page unload =====
window.addEventListener('beforeunload', () => {
    stopWebcam();
    stopLiveDetection();
});
