import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

function Detection() {
  const [file,           setFile]           = useState(null);
  const [videoUrl,       setVideoUrl]       = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [status,         setStatus]         = useState('idle');
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [uploadMethod,   setUploadMethod]   = useState('file');
  const fileInputRef = useRef(null);
  const navigate     = useNavigate();
  const { currentUser, uploadCount, incrementUploadCount, canUpload } = useAuth();

  // ── Get Firebase auth token ──────────────────────────────────────────────
  // FIX: sends Bearer token so backend receives real uid instead of "guest"
  const getAuthHeader = async () => {
    if (!currentUser) return {};
    try {
      const token = await currentUser.getIdToken();
      return { Authorization: `Bearer ${token}` };
    } catch (e) {
      console.error('Failed to get auth token:', e);
      return {};
    }
  };

  // ── File upload ──────────────────────────────────────────────────────────
  const handleFileChange = async (selectedFile) => {
    if (!canUpload()) { setShowLimitModal(true); return; }

    const allowedFormats = ['.mp4', '.mov', '.avi'];
    const ext = selectedFile.name.substring(selectedFile.name.lastIndexOf('.')).toLowerCase();
    if (!allowedFormats.includes(ext)) { setStatus('formatError'); return; }

    const maxSize = 200 * 1024 * 1024;
    if (selectedFile.size > maxSize) { setStatus('sizeError'); return; }

    setFile(selectedFile);
    setStatus('uploading');

    try {
      const authHeaders = await getAuthHeader();
      const formData    = new FormData();
      formData.append('file', selectedFile);

      const response = await axios.post(`${process.env.REACT_APP_API_URL}/analyze`, formData, {
        headers: { 'Content-Type': 'multipart/form-data', ...authHeaders },
        onUploadProgress: (e) => setUploadProgress(Math.round((e.loaded * 100) / e.total)),
        timeout: 300000,
      });

      await incrementUploadCount();
      setStatus('processing');
      setTimeout(() => navigate('/results', {
        state: { analysisData: response.data, uploadedFile: selectedFile }
      }), 2500);
    } catch (error) {
      console.error('Upload error:', error);
      if (error.response?.status === 400) {
        const detail = error.response.data?.detail || '';
        setStatus(detail.includes('format') ? 'formatError' : detail.includes('size') ? 'sizeError' : 'analysisError');
      } else {
        setStatus('analysisError');
      }
    }
  };

  // ── URL upload ───────────────────────────────────────────────────────────
  const handleUrlUpload = async () => {
    if (!canUpload()) { setShowLimitModal(true); return; }
    if (!videoUrl.trim()) { setStatus('urlError'); return; }
    try { new URL(videoUrl); } catch { setStatus('urlError'); return; }

    setStatus('uploading');

    try {
      const authHeaders = await getAuthHeader();

      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/analyze-url`,
        { video_url: videoUrl },
        {
          headers: { 'Content-Type': 'application/json', ...authHeaders },
          timeout: 300000,
          onUploadProgress: (e) => setUploadProgress(Math.round((e.loaded * 100) / (e.total || 100))),
        }
      );

      await incrementUploadCount();
      setStatus('processing');
      setTimeout(() => navigate('/results', {
        state: { analysisData: response.data, uploadedFile: null, videoUrl }
      }), 2500);
    } catch (error) {
      console.error('URL upload error:', error);
      setStatus(error.response?.status === 400 ? 'urlError' : 'analysisError');
    }
  };

  const handleDrop     = (e) => { e.preventDefault(); if (e.dataTransfer.files?.[0]) handleFileChange(e.dataTransfer.files[0]); };
  const handleDragOver = (e) => e.preventDefault();
  const handleTryAgain = () => { setFile(null); setVideoUrl(''); setUploadProgress(0); setStatus('idle'); };
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024, sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  const getUrlDomain = (url) => { try { return new URL(url).hostname.replace('www.', ''); } catch { return 'unknown'; } };

  return (
    <div style={pageStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <h1 style={titleStyle}>Upload Your Video for Analysis</h1>
        <p style={subtitleStyle}>Upload your video file or provide a URL and let our AI detect deepfake content</p>
        {!currentUser && (
          <p style={guestNoteStyle}>
            Guest users are limited to 3 analyses.{' '}
            <button onClick={() => navigate('/login')} style={loginPromptStyle}>
              Login for unlimited access
            </button>
          </p>
        )}
      </div>

      {/* Upload Method Selector */}
      <div style={methodSelectorStyle}>
        <button
          style={uploadMethod === 'file' ? activeMethodButtonStyle : methodButtonStyle}
          onClick={() => setUploadMethod('file')}
        >
          Upload File
        </button>
        <button
          style={uploadMethod === 'url' ? activeMethodButtonStyle : methodButtonStyle}
          onClick={() => setUploadMethod('url')}
        >
          Insert URL
        </button>
      </div>

      <div style={containerStyle}>
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          accept=".mp4,.mov,.avi"
          onChange={(e) => e.target.files[0] && handleFileChange(e.target.files[0])}
        />

        {/* IDLE — file drop zone */}
        {status === 'idle' && uploadMethod === 'file' && (
          <div
            style={dropZoneStyle}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => fileInputRef.current.click()}
          >
            <img
              src={process.env.PUBLIC_URL + '/video-camera.png'}
              alt="Upload video"
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

        {/* IDLE — URL input */}
        {status === 'idle' && uploadMethod === 'url' && (
          <div style={urlContainerStyle}>
            <img
              src={process.env.PUBLIC_URL + '/link.png'}
              alt="Insert URL"
              width="80"
              height="80"
              style={iconStyle}
            />
            <p style={dragTextStyle}>Insert Video URL</p>
            <div style={urlInputContainerStyle}>
              <input
                type="url"
                placeholder="https://youtube.com/watch?v=..."
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                style={urlInputStyle}
              />
              <button
                style={urlUploadButtonStyle}
                onClick={handleUrlUpload}
                disabled={!videoUrl.trim()}
              >
                Analyze URL
              </button>
            </div>
          </div>
        )}

        {/* UPLOADING — file */}
        {status === 'uploading' && file && uploadMethod === 'file' && (
          <div style={uploadingStyle}>
            <img
              src={process.env.PUBLIC_URL + '/video-file.png'}
              alt="Video File"
              width="80"
              height="80"
              style={iconStyle}
            />
            <p style={fileNameStyle}>{file.name}</p>
            <p style={fileSizeStyle}>{formatFileSize(file.size)}</p>
            <div style={progressBarContainerStyle}>
              <div style={progressBarStyle}>
                <div style={{ ...progressFillStyle, width: `${uploadProgress}%` }} />
              </div>
              <p style={progressTextStyle}>Uploading: {uploadProgress}%</p>
            </div>
          </div>
        )}

        {/* UPLOADING — URL */}
        {status === 'uploading' && uploadMethod === 'url' && (
          <div style={uploadingStyle}>
            <img
              src={process.env.PUBLIC_URL + '/link.png'}
              alt="Video URL"
              width="80"
              height="80"
              style={iconStyle}
            />
            <p style={fileNameStyle}>Video from {getUrlDomain(videoUrl)}</p>
            <p style={{ ...fileSizeStyle, fontSize: '0.8rem', wordBreak: 'break-all' }}>
              {videoUrl}
            </p>
            <div style={progressBarContainerStyle}>
              <div style={progressBarStyle}>
                <div style={{ ...progressFillStyle, width: `${uploadProgress}%` }} />
              </div>
              <p style={progressTextStyle}>
                {uploadProgress < 50 ? 'Downloading video...' : 'Processing video...'} {uploadProgress}%
              </p>
            </div>
          </div>
        )}

        {/* PROCESSING */}
        {status === 'processing' && (
          <div style={processingStyle}>
            <div style={spinnerStyle} />
            <p style={processingTitleStyle}>Processing Your Video...</p>
            <p style={processingTextStyle}>
              Our AI is analyzing your video for deepfake detection. This may take a few minutes.
            </p>
            <div style={warningBoxStyle}>
              <p style={warningTextStyle}>Please do not close this page during processing</p>
            </div>
          </div>
        )}

        {/* ERRORS */}
        {['formatError', 'sizeError', 'urlError', 'analysisError'].includes(status) && (
          <div style={errorContainerStyle}>
            <img
              src={process.env.PUBLIC_URL + '/warning.png'}
              alt="Warning"
              width="80"
              height="80"
              style={iconStyle}
            />
            <p style={errorTitleStyle}>Upload Error</p>
            <p style={errorTextStyle}>
              {status === 'formatError'
                ? 'The file format should be .mp4, .mov, .avi. Please upload the correct format video.'
                : status === 'sizeError'
                ? 'The file exceeds the 200MB limit. Please upload a smaller file.'
                : status === 'urlError'
                ? 'Unable to process this video URL. Please check the link and try again.'
                : 'The analysis failed. Please try again with a different video.'}
            </p>
            <button style={tryAgainButtonStyle} onClick={handleTryAgain}>
              Try Again
            </button>
          </div>
        )}

        {status === 'idle' && (
          <p style={supportedTextStyle}>
            {uploadMethod === 'file'
              ? 'Supported Formats: .mp4, .mov, .avi | Max File Size: 200MB'
              : 'Supports video URLs from YouTube, TikTok, Instagram, Facebook, Twitter/X, and direct links'}
          </p>
        )}
      </div>

      {/* Guest limit modal */}
      {showLimitModal && (
        <div style={modalOverlayStyle}>
          <div style={modalStyle}>
            <h3>Upload Limit Reached</h3>
            <p>You have reached the maximum of 3 guest analyses.</p>
            <p>Please login or register to continue using Verity-X with unlimited analyses.</p>
            <button onClick={() => navigate('/login')} style={modalButtonStyle}>
              Login Now
            </button>
            <button onClick={() => setShowLimitModal(false)} style={cancelButtonStyle}>
              Cancel
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          0%   { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

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

const guestNoteStyle = {
  color: '#6b7280',
  fontSize: '0.85rem',
  marginTop: '0.5rem',
};

const loginPromptStyle = {
  backgroundColor: '#013D83',
  color: 'white',
  border: 'none',
  padding: '5px 10px',
  borderRadius: '3px',
  marginLeft: '8px',
  cursor: 'pointer',
  fontSize: '0.8rem',
};

const methodSelectorStyle = {
  display: 'flex',
  gap: '1rem',
  marginBottom: '2rem',
  width: '100%',
  maxWidth: '900px',
  justifyContent: 'center',
};

const methodButtonStyle = {
  backgroundColor: '#f8f9fa',
  color: '#013D83',
  border: '2px solid #013D83',
  padding: '10px 20px',
  borderRadius: '8px',
  fontWeight: '600',
  cursor: 'pointer',
  fontSize: '1rem',
  transition: 'all 0.3s ease',
  flex: 1,
  maxWidth: '200px',
};

const activeMethodButtonStyle = {
  ...methodButtonStyle,
  backgroundColor: '#013D83',
  color: 'white',
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

const urlContainerStyle = {
  border: '2px dashed #ccc',
  borderRadius: '10px',
  padding: '3rem 2rem',
  textAlign: 'center',
  width: '100%',
  transition: 'all 0.3s ease',
};

const urlInputContainerStyle = {
  display: 'flex',
  gap: '1rem',
  width: '100%',
  maxWidth: '600px',
  margin: '2rem auto',
  alignItems: 'center',
};

const urlInputStyle = {
  flex: 1,
  padding: '12px 15px',
  border: '1px solid #ddd',
  borderRadius: '8px',
  fontSize: '1rem',
  backgroundColor: 'white',
  minWidth: '300px',
};

const urlUploadButtonStyle = {
  backgroundColor: '#013D83',
  color: 'white',
  border: 'none',
  padding: '12px 25px',
  borderRadius: '8px',
  fontWeight: '700',
  fontSize: '1rem',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  whiteSpace: 'nowrap',
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
  color: '#747474',
  fontWeight: '600',
  marginBottom: '2rem',
  fontSize: '0.9rem',
  wordBreak: 'break-all',
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

const modalOverlayStyle = {
  position: 'fixed',
  top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
};

const modalStyle = {
  backgroundColor: 'white',
  padding: '2rem',
  borderRadius: '10px',
  maxWidth: '400px',
  width: '90%',
  textAlign: 'center',
};

const modalButtonStyle = {
  backgroundColor: '#013D83',
  color: 'white',
  border: 'none',
  padding: '10px 20px',
  borderRadius: '5px',
  margin: '5px',
  cursor: 'pointer',
};

const cancelButtonStyle = {
  backgroundColor: '#6c757d',
  color: 'white',
  border: 'none',
  padding: '10px 20px',
  borderRadius: '5px',
  margin: '5px',
  cursor: 'pointer',
};

export default Detection;