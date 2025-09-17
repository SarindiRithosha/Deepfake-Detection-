import React, { useState, useRef } from 'react';

function Detection() {
  // State management
  const [file, setFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [status, setStatus] = useState('idle'); // 'idle', 'uploading', 'processing', 'success', 'formatError', 'sizeError'
  const fileInputRef = useRef(null);

  // Handle file selection
  const handleFileChange = (selectedFile) => {
    // Check file format
    const allowedFormats = ['.mp4', '.mov', '.avi'];
    const fileExtension = selectedFile.name.substring(selectedFile.name.lastIndexOf('.')).toLowerCase();
    
    if (!allowedFormats.includes(fileExtension)) {
      setStatus('formatError');
      return;
    }

    // Check file size (200MB in bytes)
    const maxSize = 200 * 1024 * 1024; // 200MB in bytes
    if (selectedFile.size > maxSize) {
      setStatus('sizeError');
      return;
    }

    // File is valid
    setFile(selectedFile);
    setStatus('uploading');
    
    // Simulate upload progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += 5;
      setUploadProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        setStatus('processing');
        
        // Simulate processing and then redirect to success
        setTimeout(() => {
          setStatus('success');
          // Simulate redirect to results page after 3 seconds
          setTimeout(() => {
            // In a real app, you would use: navigate('/results');
            console.log('Redirecting to results page...');
          }, 3000);
        }, 3000);
      }
    }, 100);
  };

  // Handle drag and drop
  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  // Handle drag over
  const handleDragOver = (e) => {
    e.preventDefault();
  };

  // Handle file input click
  const handleFileInputClick = () => {
    fileInputRef.current.click();
  };

  // Handle try again
  const handleTryAgain = () => {
    setFile(null);
    setUploadProgress(0);
    setStatus('idle');
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Get container style based on status
  const getContainerStyle = () => {
    switch (status) {
      case 'formatError':
      case 'sizeError':
        return { ...containerStyle, ...errorContainerStyle };
      case 'success':
        return { ...containerStyle, ...successContainerStyle };
      default:
        return containerStyle;
    }
  };

  return (
    <div style={pageStyle}>
      {/* Header Section */}
      <div style={headerStyle}>
        <h1 style={titleStyle}>Upload Your Video for Analysis</h1>
        <p style={subtitleStyle}>Upload your video file and let our AI detect deepfake content</p>
      </div>

      {/* Main Detection Container - Style changes based on status */}
      <div style={getContainerStyle()}>
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          accept=".mp4,.mov,.avi"
          onChange={(e) => handleFileChange(e.target.files[0])}
        />

        {/* IDLE STATE - Drag & Drop */}
        {status === 'idle' && (
          <div
            style={dropZoneStyle}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={handleFileInputClick}
          >
            <img
              src={process.env.PUBLIC_URL + "/video-camera.png"}
              alt="Camera"
              width="80"
              height="80"
              style={iconStyle}
            />
            <p style={dragTextStyle}>Drag & Drop a video file here</p>
            <p style={browseTextStyle}>or click to browse</p>
            <button style={chooseFileButtonStyle} onClick={(e) => e.stopPropagation()}>
              Choose File
            </button>
          </div>
        )}

        {/* UPLOADING STATE */}
        {status === 'uploading' && file && (
          <div style={uploadingStyle}>
            <img
              src={process.env.PUBLIC_URL + "/video-file.png"}
              alt="Video File"
              width="80"
              height="80"
              style={iconStyle}
            />
            <p style={fileNameStyle}>{file.name}</p>
            <p style={fileSizeStyle}>{formatFileSize(file.size)}</p>
            
            {/* Progress Bar */}
            <div style={progressBarContainerStyle}>
              <div style={progressBarStyle}>
                <div style={{...progressFillStyle, width: `${uploadProgress}%`}}></div>
              </div>
              <p style={progressTextStyle}>Uploading: {uploadProgress}%</p>
            </div>
          </div>
        )}

        {/* PROCESSING STATE */}
        {status === 'processing' && (
          <div style={processingStyle}>
            <div style={spinnerStyle}></div>
            <p style={processingTitleStyle}>Processing Your Video...</p>
            <p style={processingTextStyle}>
              Our AI is analyzing your video for deepfake detection. This may take a few minutes.
            </p>
            <div style={warningBoxStyle}>
              <p style={warningTextStyle}>Please do not close this page during processing</p>
            </div>
          </div>
        )}

        {/* SUCCESS STATE */}
        {status === 'success' && (
          <div style={successStyle}>
            <img
              src={process.env.PUBLIC_URL + "/check.png"}
              alt="Success"
              width="80"
              height="80"
              style={iconStyle}
            />
            <p style={successTitleStyle}>Analysis Complete!</p>
            <p style={successTextStyle}>Redirecting you to the results page...</p>
            <div style={successSpinnerStyle}></div>
          </div>
        )}

        {/* ERROR STATES */}
        {(status === 'formatError' || status === 'sizeError') && (
          <div style={errorStyle}>
            <img
              src={process.env.PUBLIC_URL + "/warning.png"}
              alt="Warning"
              width="80"
              height="80"
              style={iconStyle}
            />
            <p style={errorTitleStyle}>Upload Error</p>
            <p style={errorTextStyle}>
              {status === 'formatError' 
                ? 'The file format should be .mp4, .mov, .avi. Please upload the correct format video.'
                : 'The file exceeds the 200MB limit. Please upload a smaller file.'
              }
            </p>
            <button style={tryAgainButtonStyle} onClick={handleTryAgain}>
              Try Again
            </button>
          </div>
        )}

        {/* Supported formats text (only shown in idle state) */}
        {status === 'idle' && (
          <p style={supportedTextStyle}>
            Supported Formats: .mp4, .mov, .avi | Max File Size: 200MB
          </p>
        )}
      </div>
    </div>
  );
}

// ===== STYLES =====

const pageStyle = {
  padding: '2rem 1rem',
  minHeight: '70vh',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  backgroundColor: '#E5E3E3',

};

const headerStyle = {
  textAlign: 'center',
  marginBottom: '2rem',
  maxWidth: '600px',
};

const titleStyle = {
  color: '#013D83',
  fontSize: '2.5rem',
  fontWeight: '700',
  marginBottom: '1rem',
};

const subtitleStyle = {
  color: '#000',
  fontSize: '1.1rem',
  opacity: '0.8',
};

// Base container style
const containerStyle = {
  backgroundColor: '#F8F8F8',
  borderRadius: '15px',
  padding: '3rem 2rem',
  width: '100%',
  maxWidth: '900px',
  minHeight: '300px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  position: 'relative',
};

// Container styles for different states
const errorContainerStyle = {
  backgroundColor: '#F6EBEB',
};

const successContainerStyle = {
  backgroundColor: 'rgba(231, 253, 226, 0.71)',
};

// Drag & Drop Zone
const dropZoneStyle = {
  border: '2px dashed #ccc',
  borderRadius: '10px',
  padding: '3rem 2rem',
  textAlign: 'center',
  cursor: 'pointer',
  width: '100%',
  transition: 'all 0.3s ease',
};

const iconStyle = {
  marginBottom: '1.5rem',
};

const dragTextStyle = {
  color: '#000',
  fontWeight: '600',
  fontSize: '1.2rem',
  marginBottom: '0.5rem',
};

const browseTextStyle = {
  color: '#747474',
  fontWeight: '600',
  fontSize: '1rem',
  marginBottom: '1.5rem',
};

const chooseFileButtonStyle = {
  backgroundColor: '#013D83',
  color: 'white',
  border: 'none',
  padding: '12px 30px',
  borderRadius: '10px',
  fontWeight: '700',
  fontSize: '1rem',
  cursor: 'pointer',
};

// Uploading State
const uploadingStyle = {
  textAlign: 'center',
  width: '100%',
};

const fileNameStyle = {
  color: '#000',
  fontWeight: '700',
  fontSize: '1.1rem',
  marginBottom: '0.5rem',
};

const fileSizeStyle = {
  color: '#E5E3E3',
  fontWeight: '600',
  marginBottom: '2rem',
};

const progressBarContainerStyle = {
  width: '100%',
  maxWidth: '300px',
  margin: '0 auto',
};

const progressBarStyle = {
  backgroundColor: '#ddd',
  borderRadius: '10px',
  height: '8px',
  overflow: 'hidden',
  marginBottom: '0.5rem',
};

const progressFillStyle = {
  backgroundColor: '#A9D6E5',
  height: '100%',
  borderRadius: '10px',
  transition: 'width 0.3s ease',
};

const progressTextStyle = {
  color: '#000',
  fontSize: '0.9rem',
};

// Processing State
const processingStyle = {
  textAlign: 'center',
  width: '100%',
};

const spinnerStyle = {
  width: '50px',
  height: '50px',
  border: '5px solid #f3f3f3',
  borderTop: '5px solid #A9D6E5',
  borderRadius: '50%',
  animation: 'spin 1s linear infinite',
  margin: '0 auto 1.5rem',
};

const processingTitleStyle = {
  color: '#013D83',
  fontWeight: '700',
  fontSize: '1.3rem',
  marginBottom: '1rem',
};

const processingTextStyle = {
  color: '#000',
  marginBottom: '1.5rem',
  lineHeight: '1.5',
};

const warningBoxStyle = {
  backgroundColor: '#E5E3E3',
  padding: '1rem',
  borderRadius: '8px',
  marginTop: '1rem',
};

const warningTextStyle = {
  color: '#000',
  margin: '0',
};

// Success State
const successStyle = {
  textAlign: 'center',
  width: '100%',
};

const successTitleStyle = {
  color: '#04570D',
  fontWeight: '700',
  fontSize: '1.3rem',
  marginBottom: '0.5rem',
};

const successTextStyle = {
  color: '#007206',
  fontSize: '0.9rem',
  marginBottom: '1.5rem',
};

const successSpinnerStyle = {
  width: '30px',
  height: '30px',
  border: '3px solid #f3f3f3',
  borderTop: '3px solid #007206',
  borderRadius: '50%',
  animation: 'spin 1s linear infinite',
  margin: '0 auto',
};

// Error State
const errorStyle = {
  textAlign: 'center',
  width: '100%',
};

const errorTitleStyle = {
  color: '#720404',
  fontWeight: '700',
  fontSize: '1.3rem',
  marginBottom: '1rem',
};

const errorTextStyle = {
  color: '#932525',
  marginBottom: '1.5rem',
  lineHeight: '1.5',
};

const tryAgainButtonStyle = {
  backgroundColor: '#013D83',
  color: 'white',
  border: 'none',
  padding: '10px 25px',
  borderRadius: '8px',
  fontWeight: '600',
  cursor: 'pointer',
};

// Supported formats text
const supportedTextStyle = {
  color: '#766F6F',
  fontWeight: '600',
  textAlign: 'center',
  marginTop: '2rem',
  fontSize: '0.9rem',
};

// CSS Animation for spinners
const styles = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

// Add the animation styles to the document
const styleSheet = document.createElement('style');
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);

export default Detection;