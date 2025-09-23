import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { generatePDFReport, generateTextReport } from '../utils/pdfGenerator';

function Results() {
  const location = useLocation();
  const navigate = useNavigate();
  const [analysisData, setAnalysisData] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [selectedFrame, setSelectedFrame] = useState(0);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [loading, setLoading] = useState(true);
  const [videoUrl, setVideoUrl] = useState(null);
  const resultsRef = useRef(null);
  const videoRef = useRef(null);

  useEffect(() => {
    if (location.state?.analysisData && location.state?.uploadedFile) {
      setAnalysisData(location.state.analysisData);
      setUploadedFile(location.state.uploadedFile);
      
      // Create object URL for the uploaded video file
      const url = URL.createObjectURL(location.state.uploadedFile);
      setVideoUrl(url);
      
      setLoading(false);
    } else {
      fetchMockData();
    }

    // Clean up object URL when component unmounts
    return () => {
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
      }
    };
  }, [location]);

  const fetchMockData = async () => {
    try {
      const response = await axios.get('http://localhost:8000/');
      console.log('API is running:', response.data);
      
      setAnalysisData({
        prediction: 'FAKE',
        confidence: 0.96,
        frame_analysis: [],
        summary: 'Mock data loaded for demonstration',
        anomalies: ['Test anomaly 1', 'Test anomaly 2'],
        analysis_id: 'DEMO_12345',
        filename: 'demo_video.mp4',
        model_version: 'XceptionNet v3.2'
      });
    } catch (error) {
      console.error('API not available, using fallback data');
      setAnalysisData({
        prediction: 'FAKE',
        confidence: 0.96,
        frame_analysis: [],
        summary: 'Fallback data loaded',
        anomalies: ['Test anomaly 1', 'Test anomaly 2'],
        analysis_id: 'FALLBACK_123',
        filename: 'test_video.mp4'
      });
    }
    setLoading(false);
  };

  const handleAnalyzeAnother = () => {
    // Clean up video URL before navigating
    if (videoUrl) {
      URL.revokeObjectURL(videoUrl);
    }
    navigate('/detect');
  };

  const handleDownloadReport = async () => {
    try {
      await generatePDFReport(analysisData, 'results-container');
    } catch (error) {
      console.warn('PDF generation failed, using text fallback');
      const report = generateTextReport(analysisData);
      const blob = new Blob([report], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `verityx_report_${analysisData.analysis_id || 'unknown'}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  if (loading) {
    return (
      <div style={pageStyle}>
        <div style={loadingStyle}>
          <div style={spinnerStyle}></div>
          <p>Loading results...</p>
        </div>
      </div>
    );
  }

  if (!analysisData) {
    return (
      <div style={pageStyle}>
        <div style={errorStyle}>
          <h2>No analysis data found</h2>
          <button onClick={() => navigate('/detect')} style={ctaButtonStyle}>
            Analyze a Video
          </button>
        </div>
      </div>
    );
  }

  const isFake = analysisData.prediction === 'FAKE';
  const confidenceColor = isFake ? '#FF0606' : '#33B86E';
  const hasFrames = analysisData.frame_analysis && analysisData.frame_analysis.length > 0;

  return (
    <div id="results-container" ref={resultsRef} style={pageStyle}>
      <div style={headerStyle}>
        <h1 style={titleStyle}>Results</h1>
        
        <div style={{
          ...verdictBadgeStyle,
          backgroundColor: isFake ? '#FF0606' : '#33B86E'
        }}>
          {analysisData.prediction}
        </div>
        
        <p style={{...confidenceStyle, color: confidenceColor}}>
          Confidence: {Math.round(analysisData.confidence * 100)}%
        </p>
      </div>

      <div style={videoContainerStyle}>
        {videoUrl ? (
          <video
            ref={videoRef}
            controls
            style={videoPlayerStyle}
            src={videoUrl}
            onError={(e) => {
              console.error('Video playback error:', e);
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'block';
            }}
          >
            Your browser does not support the video tag.
          </video>
        ) : (
          <div style={videoPlaceholderStyle}>
            <p>Video Player Placeholder</p>
            <p style={videoPlaceholderSubtext}>(No video file available for playback)</p>
          </div>
        )}
      </div>

      {hasFrames && (
        <div style={sectionStyle}>
          <h2 style={subtitleStyle}>Frame-by-Frame Analysis</h2>
          
          <div style={thumbnailContainerStyle}>
            {analysisData.frame_analysis.map((frame, index) => (
              <div
                key={index}
                style={{
                  ...thumbnailStyle,
                  border: frame.suspicious_score > 0.7 ? '3px solid #FF3333' : '3px solid transparent'
                }}
                onClick={() => setSelectedFrame(index)}
              >
                <img
                  src={frame.original_frame}
                  alt={`Frame ${frame.frame_number}`}
                  style={thumbnailImageStyle}
                />
                <div style={thumbnailOverlayStyle}>
                  Frame {frame.frame_number}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {hasFrames && (
        <div style={heatmapContainerStyle}>
          <div style={heatmapHeaderStyle}>
            <h3 style={heatmapTitleStyle}>Selected Frame Analysis</h3>
            <button
              onClick={() => setShowHeatmap(!showHeatmap)}
              style={toggleButtonStyle}
            >
              {showHeatmap ? 'Hide Heatmap' : 'Show Heatmap'}
            </button>
          </div>

          <div style={selectedFrameContainerStyle}>
            <div style={imageWrapperStyle}>
              <img
                src={analysisData.frame_analysis[selectedFrame]?.original_frame}
                alt="Selected Frame"
                style={selectedImageStyle}
              />
              {showHeatmap && (
                <img
                  src={analysisData.frame_analysis[selectedFrame]?.heatmap}
                  alt="Heatmap Overlay"
                  style={heatmapOverlayStyle}
                />
              )}
            </div>
          </div>

          <div style={heatmapExplanationStyle}>
            <img
              src={process.env.PUBLIC_URL + "/warning.png"}
              alt="Warning"
              width="20"
              height="20"
              style={{ marginRight: '8px' }}
            />
            <span style={explanationTextStyle}>
              The red areas indicate the highest probability of manipulation.
            </span>
          </div>
        </div>
      )}

      <div style={summaryContainerStyle}>
        <h3 style={summaryTitleStyle}>Detailed Analysis Summary</h3>
        <p style={summaryTextStyle}>{analysisData.summary}</p>
        
        {isFake && analysisData.anomalies && analysisData.anomalies.length > 0 && (
          <ul style={anomaliesListStyle}>
            {analysisData.anomalies.map((anomaly, index) => (
              <li key={index} style={anomalyItemStyle}>
                <span style={anomalyBulletStyle}>•</span>
                <span style={anomalyTextStyle}>{anomaly}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div style={ctaContainerStyle}>
        <button onClick={handleAnalyzeAnother} style={analyzeAnotherButtonStyle}>
          Analyze Another Video
        </button>
        <button onClick={handleDownloadReport} style={downloadReportButtonStyle}>
          Download Full Report
        </button>
      </div>
    </div>
  );
}

// ===== STYLES =====

const pageStyle = {
  backgroundColor: '#E5E3E3',
  minHeight: '100vh',
  padding: '2rem 1rem',
};

const loadingStyle = {
  textAlign: 'center',
  padding: '4rem 2rem',
};

const spinnerStyle = {
  width: '50px',
  height: '50px',
  border: '5px solid #f3f3f3',
  borderTop: '5px solid #013D83',
  borderRadius: '50%',
  animation: 'spin 1s linear infinite',
  margin: '0 auto 1.5rem',
};

const errorStyle = {
  textAlign: 'center',
  padding: '4rem 2rem',
};

const headerStyle = {
  textAlign: 'center',
  marginBottom: '2rem',
};

const titleStyle = {
  color: '#013D83',
  fontSize: '2.5rem',
  fontWeight: '700',
  marginBottom: '1.5rem',
};

const verdictBadgeStyle = {
  color: 'white',
  fontSize: '2rem',
  fontWeight: '700',
  padding: '1rem 2rem',
  borderRadius: '10px',
  display: 'inline-block',
  marginBottom: '1rem',
};

const confidenceStyle = {
  fontSize: '1.5rem',
  fontWeight: '600',
  margin: '0',
};

const videoContainerStyle = {
  display: 'flex',
  justifyContent: 'center',
  marginBottom: '3rem',
  width: '100%',
  maxWidth: '800px',
  marginLeft: 'auto',
  marginRight: 'auto',
};

const videoPlayerStyle = {
  width: '100%',
  maxWidth: '640px',
  height: '360px',
  borderRadius: '10px',
  backgroundColor: '#000',
};

const videoPlaceholderStyle = {
  backgroundColor: '#F8F8F8',
  border: '2px dashed #ccc',
  borderRadius: '10px',
  padding: '3rem',
  textAlign: 'center',
  width: '100%',
  maxWidth: '640px',
};

const videoPlaceholderSubtext = {
  color: '#766F6F',
  fontSize: '0.9rem',
  marginTop: '0.5rem',
};

const sectionStyle = {
  marginBottom: '3rem',
  width: '100%',
};

const subtitleStyle = {
  color: '#013D83',
  fontSize: '1.8rem',
  fontWeight: '600',
  textAlign: 'center',
  marginBottom: '1.5rem',
};

const thumbnailContainerStyle = {
  display: 'flex',
  overflowX: 'auto',
  gap: '1rem',
  padding: '1rem',
  backgroundColor: '#E5E3E3',
  borderRadius: '10px',
  marginLeft: '23px',
};

const thumbnailStyle = {
  flex: '0 0 auto',
  width: '120px',
  height: '120px',
  borderRadius: '8px',
  overflow: 'hidden',
  position: 'relative',
  cursor: 'pointer',
  transition: 'transform 0.2s ease',
};

const thumbnailImageStyle = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
};

const thumbnailOverlayStyle = {
  position: 'absolute',
  bottom: '0',
  left: '0',
  right: '0',
  backgroundColor: 'rgba(0, 0, 0, 0.7)',
  color: 'white',
  padding: '4px',
  fontSize: '0.8rem',
  textAlign: 'center',
};

const heatmapContainerStyle = {
  backgroundColor: '#F8F8F8',
  borderRadius: '15px',
  padding: '2rem',
  marginBottom: '3rem',
  width: '100%',
  maxWidth: '900px',
  marginLeft: 'auto',
  marginRight: 'auto',
};

const heatmapHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '1.5rem',
  flexWrap: 'wrap',
  gap: '1rem',
};

const heatmapTitleStyle = {
  color: '#013D83',
  fontSize: '1.5rem',
  fontWeight: '600',
  margin: '0',
};

const toggleButtonStyle = {
  backgroundColor: '#A9D6E5',
  color: '#013D83',
  border: 'none',
  padding: '10px 20px',
  borderRadius: '8px',
  fontWeight: '500',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
};

toggleButtonStyle[':hover'] = {
  backgroundColor: '#8BC3D9',
};

const selectedFrameContainerStyle = {
  display: 'flex',
  justifyContent: 'center',
  marginBottom: '1rem',
};

const imageWrapperStyle = {
  position: 'relative',
  width: '800px', 
  height: '400px',
};

const selectedImageStyle = {
  width: '100%', 
  height: '100%', 
  objectFit: 'cover',
  borderRadius: '8px',
  border: '2px solid #ddd',
};

const heatmapOverlayStyle = {
  position: 'absolute',
  top: '0',
  left: '0',
  width: '100%',
  height: '100%',
  opacity: '0.7',
  pointerEvents: 'none',
  borderRadius: '8px',
};

const heatmapExplanationStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#6D6D6D',
  fontSize: '0.9rem',
  marginTop: '1rem',
};

const explanationTextStyle = {
  margin: '0',
};

const summaryContainerStyle = {
  backgroundColor: '#F8F8F8',
  borderRadius: '15px',
  padding: '2rem',
  marginBottom: '3rem',
  width: '70%',
  marginLeft: 'auto',
  marginRight: 'auto',
};

const summaryTitleStyle = {
  color: '#013D83',
  fontSize: '1.5rem',
  fontWeight: '600',
  marginBottom: '1rem',
};

const summaryTextStyle = {
  color: '#000',
  lineHeight: '1.6',
  marginBottom: '1rem',
  fontSize: '1.1rem',
};

const anomaliesListStyle = {
  margin: '0',
  paddingLeft: '1.5rem',
};

const anomalyItemStyle = {
  marginBottom: '0.5rem',
  display: 'flex',
  alignItems: 'flex-start',
};

const anomalyBulletStyle = {
  color: '#FF0606',
  fontWeight: 'bold',
  marginRight: '0.5rem',
  fontSize: '1.2rem',
};

const anomalyTextStyle = {
  color: '#000',
  lineHeight: '1.5',
};

const ctaContainerStyle = {
  display: 'flex',
  justifyContent: 'center',
  gap: '1rem',
  flexWrap: 'wrap',
  marginTop: '2rem',
};

const analyzeAnotherButtonStyle = {
  backgroundColor: '#A9D6E5',
  color: '#013D83',
  border: 'none',
  padding: '12px 30px',
  borderRadius: '8px',
  fontWeight: '600',
  cursor: 'pointer',
  fontSize: '1rem',
  transition: 'all 0.3s ease',
};

analyzeAnotherButtonStyle[':hover'] = {
  backgroundColor: '#8BC3D9',
  transform: 'translateY(-2px)',
};

const downloadReportButtonStyle = {
  backgroundColor: '#E5E3E3',
  color: '#013D83',
  border: '2px solid #013D83',
  padding: '12px 30px',
  borderRadius: '8px',
  fontWeight: '600',
  cursor: 'pointer',
  fontSize: '1rem',
  transition: 'all 0.3s ease',
};

downloadReportButtonStyle[':hover'] = {
  backgroundColor: '#D5D3D3',
  transform: 'translateY(-2px)',
};

const ctaButtonStyle = {
  backgroundColor: '#013D83',
  color: 'white',
  border: 'none',
  padding: '12px 30px',
  borderRadius: '8px',
  fontWeight: '600',
  cursor: 'pointer',
  fontSize: '1rem',
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

export default Results;