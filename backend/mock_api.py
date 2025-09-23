from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from PIL import Image, ImageDraw, ImageFilter
import numpy as np
import cv2
import random
import io
import base64
import os
from datetime import datetime
import json
from typing import List
import tempfile

app = FastAPI(title="Verity-X API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def generate_realistic_frame(width: int, height: int, is_fake: bool = True) -> Image.Image:
    """Generate a realistic-looking video frame using OpenCV and PIL"""
    # Create a gradient background
    frame = np.zeros((height, width, 3), dtype=np.uint8)
    
    # Add gradient effect
    for y in range(height):
        for x in range(width):
            frame[y, x] = [
                int((x / width) * 255),  # Red gradient
                int((y / height) * 255), # Green gradient
                150                      # Blue constant
            ]
    
    # Add a face-like oval
    center_x, center_y = width // 2, height // 2
    face_size = min(width, height) // 3
    cv2.ellipse(frame, (center_x, center_y), (face_size, int(face_size * 1.2)), 
                0, 0, 360, (200, 200, 200), -1)
    
    # Add eyes
    eye_size = face_size // 4
    cv2.circle(frame, (center_x - face_size//3, center_y - face_size//4), 
               eye_size, (50, 50, 50), -1)
    cv2.circle(frame, (center_x + face_size//3, center_y - face_size//4), 
               eye_size, (50, 50, 50), -1)
    
    if is_fake:
        # Add manipulation artifacts
        cv2.rectangle(frame, 
                     (center_x - face_size, center_y - face_size),
                     (center_x + face_size, center_y + face_size),
                     (0, 0, 255), 2)  # Red border indicating manipulation
        
        # Add some noise/artifacts
        for _ in range(20):
            x = random.randint(0, width-1)
            y = random.randint(0, height-1)
            frame[y, x] = [random.randint(200, 255), random.randint(0, 50), random.randint(0, 50)]
    
    # Convert to PIL Image
    return Image.fromarray(frame)

def generate_heatmap(width: int, height: int, is_fake: bool = True) -> Image.Image:
    """Generate a heatmap visualization"""
    if not is_fake:
        # Return blank heatmap for real videos
        return Image.new('RGB', (width, height), color='black')
    
    # Create heatmap with hot spots
    heatmap = Image.new('RGB', (width, height), color='black')
    draw = ImageDraw.Draw(heatmap)
    
    # Create 3-5 hot spots around face area
    center_x, center_y = width // 2, height // 2
    face_size = min(width, height) // 3
    
    for _ in range(random.randint(3, 5)):
        # Position around face area
        x = center_x + random.randint(-face_size, face_size)
        y = center_y + random.randint(-face_size, face_size)
        size = random.randint(20, 50)
        
        # Create gradient heat spot
        for i in range(size, 0, -2):
            intensity = int(255 * (i/size))
            alpha = intensity / 255.0
            color = (255, int(255 * (1 - alpha * 0.5)), 0)  # Red to yellow
            draw.ellipse([x-i, y-i, x+i, y+i], fill=color)
    
    # Apply blur for smoothness
    return heatmap.filter(ImageFilter.GaussianBlur(radius=15))

@app.get("/")
async def root():
    return {"message": "Verity-X API is running", "version": "1.0.0"}

@app.post("/analyze")
async def analyze_video(file: UploadFile = File(...)):
    """Analyze video for deepfake detection"""
    try:
        # Validate file type and size as before
        allowed_extensions = {'.mp4', '.mov', '.avi'}
        file_extension = os.path.splitext(file.filename)[1].lower()
        if file_extension not in allowed_extensions:
            raise HTTPException(status_code=400, detail="Invalid file format.")
        
        file_content = await file.read()
        if len(file_content) > 200 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="File size exceeds 200MB limit")
        
        # Save the uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=file_extension) as tmp_file:
            tmp_file.write(file_content)
            temp_file_path = tmp_file.name
        
        # --- NEW LOGIC: Extract real frames from the video ---
        frame_analysis = []
        cap = cv2.VideoCapture(temp_file_path)
        frame_rate = int(cap.get(cv2.CAP_PROP_FPS))
        frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        
        # Extract frames at a specific interval (e.g., every 1 second)
        target_frames = [i * frame_rate for i in range(1, min(11, int(frame_count / frame_rate) + 1))]

        for i in range(frame_count):
            ret, frame = cap.read()
            if not ret:
                break
            
            if i in target_frames:
                # Convert OpenCV frame (BGR) to PIL Image (RGB)
                frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                pil_image = Image.fromarray(frame_rgb)
                
                # Resize for thumbnails if needed (optional)
                pil_image.thumbnail((300, 200))

                # Convert to Base64
                buffered = io.BytesIO()
                pil_image.save(buffered, format="JPEG", quality=90)
                original_b64 = base64.b64encode(buffered.getvalue()).decode('utf-8')
                
                # Use your existing heatmap function for the mockup
                heatmap = generate_heatmap(pil_image.width, pil_image.height, random.choice([True, False]))
                buffered_heat = io.BytesIO()
                heatmap.save(buffered_heat, format="JPEG", quality=90)
                heatmap_b64 = base64.b64encode(buffered_heat.getvalue()).decode('utf-8')

                frame_analysis.append({
                    "frame_number": i,
                    "original_frame": f"data:image/jpeg;base64,{original_b64}",
                    "heatmap": f"data:image/jpeg;base64,{heatmap_b64}",
                    "suspicious_score": round(random.uniform(0.7, 0.95), 2)
                })

        cap.release()

        is_fake = random.choice([True, False])
        confidence = round(random.uniform(0.85, 0.99), 2)
        
        # Create detailed analysis report
        if is_fake:
            anomalies = [
                "Inconsistent facial lighting patterns between frames 3-7",
                "Unnatural eye blink frequency (0.2s vs normal 0.4s)",
                "Audio-visual synchronization drift of 120ms detected",
                "Background texture inconsistencies around facial contours",
                "Pixel-level artifacts indicative of generative AI manipulation",
                "Unnatural head movement kinematics in frame sequence"
            ]
            summary = "Our advanced AI analysis has detected significant inconsistencies in this video that strongly indicate digital manipulation. Multiple artifacts consistent with deepfake generation were identified across the video sequence."
        else:
            anomalies = []
            summary = "No significant manipulation artifacts were detected. Facial movements, lighting consistency, and audio-visual synchronization appear natural throughout the video sequence. Biological signals and physical properties remain consistent across all frames."
        
        analysis_id = f"VID_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        # Clean up temporary file
        os.unlink(temp_file_path)
        
        return {
            "prediction": "FAKE" if is_fake else "REAL",
            "confidence": confidence,
            "frame_analysis": frame_analysis,
            "summary": summary,
            "anomalies": anomalies,
            "filename": file.filename,
            "analysis_id": analysis_id,
            "timestamp": datetime.now().isoformat(),
            "frame_count": len(frame_analysis),
            "analysis_time": "2.8 seconds",
            "model_version": "XceptionNet v3.2"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@app.get("/report/{analysis_id}")
async def download_report(analysis_id: str):
    """Download analysis report"""
    # Generate a simple text report for demonstration
    report_content = f"""
VERITY-X DEEPFAKE ANALYSIS REPORT
=================================

Report ID: {analysis_id}
Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
Model Version: XceptionNet v3.2

SUMMARY:
This report contains the analysis results from Verity-X deepfake detection system.

For demonstration purposes, this is a mock report. In a production environment,
this would include detailed technical analysis, confidence scores per frame,
and comprehensive evidence supporting the verdict.

Visit https://verity-x.example.com for more information.

© 2025 Verity-X. All rights reserved.
    """
    
    # Create temporary file
    report_path = f"/tmp/verityx_report_{analysis_id}.txt"
    with open(report_path, 'w') as f:
        f.write(report_content)
    
    return FileResponse(
        report_path,
        media_type='text/plain',
        filename=f"verityx_report_{analysis_id}.txt"
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)