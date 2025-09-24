import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

function Detection() {
  const [file, setFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [status, setStatus] = useState('idle');
  const [showLimitModal, setShowLimitModal] = useState(false);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const { currentUser, uploadCount, incrementUploadCount, canUpload, getUploadLimit } = useAuth();

  const maxUploads = getUploadLimit();
  const remaining = maxUploads - uploadCount;

  const handleFileChange = async (selectedFile) => {
    // Check upload limit before proceeding
    if (!canUpload()) {
      setShowLimitModal(true);
      return;
    }

    // Validate file type
    const allowedFormats = ['.mp4', '.mov', '.avi'];
    const fileExtension = selectedFile.name.substring(selectedFile.name.lastIndexOf('.')).toLowerCase();
    
    if (!allowedFormats.includes(fileExtension)) {
      setStatus('formatError');
      return;
    }

    // Validate file size (200MB)
    const maxSize = 200 * 1024 * 1024;
    if (selectedFile.size > maxSize) {
      setStatus('sizeError');
      return;
    }

    setFile(selectedFile);
    setStatus('uploading');

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await axios.post('http://localhost:8000/analyze', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(percentCompleted);
        },
        timeout: 300000,
      });

      // Increment upload count on successful upload
      await incrementUploadCount();
      
      setStatus('processing');
      
      setTimeout(() => {
        navigate('/results', { 
          state: { 
            analysisData: response.data,
            uploadedFile: selectedFile 
          } 
        });
      }, 3000);

    } catch (error) {
      console.error('Upload error:', error);
      if (error.response?.status === 400) {
        if (error.response.data.detail.includes('format')) {
          setStatus('formatError');
        } else if (error.response.data.detail.includes('size')) {
          setStatus('sizeError');
        }
      } else {
        setStatus('sizeError');
      }
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleFileInputClick = () => {
    fileInputRef.current.click();
  };

  const handleTryAgain = () => {
    setFile(null);
    setUploadProgress(0);
    setStatus('idle');
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div style={pageStyle}>
      <div style={headerStyle}>
        <h1 style={titleStyle}>Upload Your Video for Analysis</h1>
        <p style={subtitleStyle}>Upload your video file and let our AI detect deepfake content</p>
      </div>

      {/* Upload Limit Info */}
      <div style={uploadLimitInfoStyle}>
        <strong>Upload Status:</strong> {uploadCount}/{maxUploads} videos analyzed
        <br />
        <strong>Remaining:</strong> {remaining} upload{remaining !== 1 ? 's' : ''}
        
        {!currentUser && (
          <div style={{ marginTop: '10px' }}>
            <small>
              Unregistered users are limited to 3 uploads. 
              <button 
                onClick={() => navigate('/login')}
                style={loginPromptStyle}
              >
                Login to Analyze More Files
              </button>
            </small>
          </div>
        )}
      </div>

      <div style={containerStyle}>
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          accept=".mp4,.mov,.avi"
          onChange={(e) => e.target.files[0] && handleFileChange(e.target.files[0])}
        />

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
            
            <div style={progressBarContainerStyle}>
              <div style={progressBarStyle}>
                <div style={{...progressFillStyle, width: `${uploadProgress}%`}}></div>
              </div>
              <p style={progressTextStyle}>Uploading: {uploadProgress}%</p>
            </div>
          </div>
        )}

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

        {(status === 'formatError' || status === 'sizeError') && (
          <div style={errorContainerStyle}>
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

        {status === 'idle' && (
          <p style={supportedTextStyle}>
            Supported Formats: .mp4, .mov, .avi | Max File Size: 200MB
          </p>
        )}
      </div>

      {/* Upload Limit Modal */}
      {showLimitModal && (
        <div style={modalOverlayStyle}>
          <div style={modalStyle}>
            <h3>Upload Limit Reached</h3>
            <p>You have reached the maximum of {maxUploads} uploads.</p>
            {!currentUser ? (
              <>
                <p>Please login or register to continue using Verity-X.</p>
                <button 
                  onClick={() => navigate('/login')}
                  style={modalButtonStyle}
                >
                  Login Now
                </button>
              </>
            ) : (
              <p>Please contact support if you need more uploads.</p>
            )}
            <button 
              onClick={() => setShowLimitModal(false)}
              style={cancelButtonStyle}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
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

// New styles for upload limit info
const uploadLimitInfoStyle = {
  backgroundColor: '#f8f9fa',
  padding: '15px',
  borderRadius: '8px',
  margin: '0 0 20px 0',
  borderLeft: '4px solid #013D83',
  width: '100%',
  maxWidth: '900px',
  textAlign: 'center'
};

const loginPromptStyle = {
  backgroundColor: '#013D83',
  color: 'white',
  border: 'none',
  padding: '5px 10px',
  borderRadius: '3px',
  marginLeft: '10px',
  cursor: 'pointer',
  fontSize: '0.8rem'
};

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
  transition: 'all 0.3s ease',
};

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

const errorContainerStyle = {
  backgroundColor: '#F6EBEB',
  padding: '2rem',
  borderRadius: '15px',
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

const supportedTextStyle = {
  color: '#766F6F',
  fontWeight: '600',
  textAlign: 'center',
  marginTop: '2rem',
  fontSize: '0.9rem',
};

// Modal styles
const modalOverlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000
};

const modalStyle = {
  backgroundColor: 'white',
  padding: '2rem',
  borderRadius: '10px',
  maxWidth: '400px',
  width: '90%',
  textAlign: 'center'
};

const modalButtonStyle = {
  backgroundColor: '#013D83',
  color: 'white',
  border: 'none',
  padding: '10px 20px',
  borderRadius: '5px',
  margin: '5px',
  cursor: 'pointer'
};

const cancelButtonStyle = {
  backgroundColor: '#6c757d',
  color: 'white',
  border: 'none',
  padding: '10px 20px',
  borderRadius: '5px',
  margin: '5px',
  cursor: 'pointer'
};

const styles = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const styleSheet = document.createElement('style');
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);

export default Detection;