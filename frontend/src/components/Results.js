import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { generatePDFReport, generateTextReport } from '../utils/pdfGenerator';
import { FaComment, FaPaperPlane, FaTimes, FaStar } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';

function Results() {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, userProfile } = useAuth();
  const [analysisData, setAnalysisData] = useState(null);
  const [selectedFrame, setSelectedFrame] = useState(0);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [loading, setLoading] = useState(true);
  const [videoUrl, setVideoUrl] = useState(null);
  const [videoSource, setVideoSource] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [rating, setRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [isAtBottom, setIsAtBottom] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const resultsRef = useRef(null);
  const videoRef = useRef(null);
  const feedbackRef = useRef(null);
  const ctaContainerRef = useRef(null);

  const cleanupVideoUrl = useCallback(() => {
    if (videoUrl) {
      URL.revokeObjectURL(videoUrl);
    }
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (ctaContainerRef.current) {
        const ctaRect = ctaContainerRef.current.getBoundingClientRect();
        const isVisible = ctaRect.top <= window.innerHeight && ctaRect.bottom >= 0;
        setIsAtBottom(isVisible);
      }
    };
    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (feedbackRef.current && !feedbackRef.current.contains(event.target)) {
        if (!event.target.closest('.feedback-button')) {
          setShowFeedback(false);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchMockData = async () => {
    try {
      const response = await axios.get('http://localhost:8000/');
      setAnalysisData({
        prediction: 'FAKE',
        confidence: 0.96,
        prob_fake: 0.96,
        prob_real: 0.04,
        frame_analysis: [],
        summary: 'Mock data loaded for demonstration',
        anomalies: ['Test anomaly 1', 'Test anomaly 2'],
        analysis_id: 'DEMO_12345',
        filename: 'demo_video.mp4',
        model_version: 'EfficientNetB4-TemporalPooling-Exp6v3',
        gradcam_generated: true,
      });
      setVideoSource('none');
    } catch (error) {
      setAnalysisData({
        prediction: 'FAKE',
        confidence: 0.96,
        prob_fake: 0.96,
        prob_real: 0.04,
        frame_analysis: [],
        summary: 'Fallback data loaded',
        anomalies: ['Test anomaly 1'],
        analysis_id: 'FALLBACK_123',
        filename: 'test_video.mp4',
        model_version: 'EfficientNetB4-TemporalPooling-Exp6v3',
        gradcam_generated: false,
      });
      setVideoSource('none');
    }
    setLoading(false);
  };

  const handleAnalyzeAnother = () => {
    cleanupVideoUrl();
    navigate('/detect');
  };

  const handleDownloadReport = async () => {
    try {
      await generatePDFReport(analysisData, 'results-container');
    } catch (error) {
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

  const getUserInfo = () => {
    if (currentUser && userProfile) {
      return {
        user_name: userProfile.name || 'Registered User',
        user_email: currentUser.email || '',
        user_id: currentUser.uid,
        is_logged_in: true,
      };
    }
    return { user_name: 'Anonymous User', user_email: '', user_id: null, is_logged_in: false };
  };

  const handleFeedbackSubmit = async () => {
    if (!feedback.trim() && rating === 0) {
      setSubmitStatus('Please provide either a rating or feedback');
      return;
    }
    setIsSubmitting(true);
    setSubmitStatus(null);
    try {
      const userInfo = getUserInfo();
      const feedbackData = {
        feedback: feedback.trim(),
        rating,
        analysis_id: analysisData?.analysis_id || 'unknown',
        prediction: analysisData?.prediction || 'unknown',
        confidence: analysisData?.confidence || 0,
        source: videoSource,
        timestamp: new Date().toISOString(),
        user_name: userInfo.user_name,
        user_email: userInfo.user_email,
        user_id: userInfo.user_id,
        is_logged_in: userInfo.is_logged_in,
      };
      const response = await axios.post('http://localhost:8000/submit-feedback', feedbackData);
      if (response.status === 200) {
        setSubmitStatus('success');
        setFeedback('');
        setRating(0);
        setTimeout(() => { setShowFeedback(false); setSubmitStatus(null); }, 2000);
      }
    } catch (error) {
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStarClick = (starRating) => setRating(starRating);
  const handleVideoError  = () => setVideoError(true);
  const handleVideoLoad   = () => { setVideoLoaded(true); setVideoError(false); };

  // ── Video player ──────────────────────────────────────────────────────────
  const renderVideoPlayer = () => {
    if (videoSource === 'file' && videoUrl) {
      return (
        <div style={videoWrapperStyle}>
          <video
            ref={videoRef}
            controls
            style={videoPlayerStyle}
            src={videoUrl}
            onError={handleVideoError}
            onLoadedData={handleVideoLoad}
            preload="metadata"
            key={videoUrl}
          >
            Your browser does not support the video tag.
          </video>
          {videoError && (
            <div style={videoErrorStyle}>
              <p>Unable to play the uploaded video.</p>
              <p style={videoErrorSubtextStyle}>The video file may be in an unsupported format.</p>
            </div>
          )}
          {!videoError && !videoLoaded && (
            <div style={videoLoadingStyle}>
              <div style={spinnerStyle}></div>
              <p>Loading video...</p>
            </div>
          )}
        </div>
      );
    }

    if (videoSource === 'url' && analysisData?.original_url) {
      const videoDownloadUrl = `http://localhost:8000/video/${analysisData.analysis_id}`;
      return (
        <div style={urlVideoInfoStyle}>
          <div style={urlVideoHeaderStyle}>
            <img src={process.env.PUBLIC_URL + '/link.png'} alt="Link" width="40" height="40" style={{ marginRight: '10px' }} />
            <div>
              <h3 style={urlVideoTitleStyle}>Video from {analysisData.source_name || 'URL'}</h3>
              <p style={urlVideoTextStyle}>
                Original URL:{' '}
                <a href={analysisData.original_url} target="_blank" rel="noopener noreferrer" style={urlLinkStyle}>
                  {analysisData.original_url}
                </a>
              </p>
            </div>
          </div>
          <div style={videoWrapperStyle}>
            <video
              ref={videoRef}
              controls
              style={videoPlayerStyle}
              onError={handleVideoError}
              onLoadedData={handleVideoLoad}
              preload="metadata"
            >
              <source src={videoDownloadUrl} type="video/mp4" />
              <source src={analysisData.original_url} type="video/mp4" />
            </video>
            {videoError && (
              <div style={videoErrorStyle}>
                <p>Unable to play the video directly.</p>
                <p style={videoErrorSubtextStyle}>
                  View original at:{' '}
                  <a href={analysisData.original_url} target="_blank" rel="noopener noreferrer" style={urlLinkStyle}>
                    {analysisData.original_url}
                  </a>
                </p>
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div style={videoPlaceholderStyle}>
        <p>Video Player</p>
        <p style={videoPlaceholderSubtextStyle}>
          {videoSource === 'url' ? 'Video processed from external URL' : '(No video file available)'}
        </p>
      </div>
    );
  };

  // ── Star rating ───────────────────────────────────────────────────────────
  const renderStarRating = () => (
    <div style={starRatingContainerStyle}>
      <p style={ratingLabelStyle}>Rate your experience:</p>
      <div style={starsContainerStyle}>
        {[1, 2, 3, 4, 5].map((star) => (
          <FaStar
            key={star}
            style={{ ...starStyle, color: star <= rating ? '#FFD700' : '#ccc', cursor: 'pointer' }}
            onClick={() => handleStarClick(star)}
          />
        ))}
      </div>
    </div>
  );

  // ── Feedback widget ───────────────────────────────────────────────────────
  const renderFeedbackWidget = () => {
    if (!showFeedback) return null;
    const userInfo = getUserInfo();
    return (
      <div ref={feedbackRef} style={feedbackWidgetStyle}>
        <div style={feedbackHeaderStyle}>
          <h3 style={feedbackTitleStyle}>Share Your Feedback</h3>
          <button onClick={() => setShowFeedback(false)} style={closeButtonStyle}>
            <FaTimes size={14} />
          </button>
        </div>
        <div style={feedbackContentStyle}>
          <div style={userStatusStyle}>
            <span style={{ ...userStatusTextStyle, color: userInfo.is_logged_in ? '#28a745' : '#6c757d' }}>
              {userInfo.is_logged_in ? `✓ Sending as ${userInfo.user_name}` : 'Sending as Anonymous User'}
            </span>
          </div>
          {renderStarRating()}
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Tell us about your experience with Verity-X..."
            style={feedbackTextareaStyle}
            rows="4"
          />
          {submitStatus && (
            <div style={submitStatus === 'success' ? successMessageStyle : errorMessageStyle}>
              {submitStatus === 'success' ? 'Thank you for your feedback!' : submitStatus}
            </div>
          )}
          <button
            onClick={handleFeedbackSubmit}
            disabled={isSubmitting || (!feedback.trim() && rating === 0)}
            style={{ ...submitButtonStyle, opacity: (isSubmitting || (!feedback.trim() && rating === 0)) ? 0.6 : 1 }}
          >
            {isSubmitting ? 'Sending...' : <><FaPaperPlane style={{ marginRight: '8px' }} />Send Feedback</>}
          </button>
        </div>
      </div>
    );
  };

  // ── Load analysis data ────────────────────────────────────────────────────
  useEffect(() => {
    if (location.state?.analysisData) {
      setAnalysisData(location.state.analysisData);
      if (location.state.uploadedFile) {
        const file = location.state.uploadedFile;
        if (file instanceof File || (file.name && file.type)) {
          try {
            const url = URL.createObjectURL(file);
            setVideoUrl(url);
            setVideoSource('file');
            setVideoError(false);
            setVideoLoaded(false);
          } catch {
            setVideoSource('none');
            setVideoError(true);
          }
        } else {
          setVideoSource('url');
          setVideoError(false);
          setVideoLoaded(false);
        }
      } else {
        setVideoSource('url');
        setVideoError(false);
        setVideoLoaded(false);
      }
      setLoading(false);
    } else {
      fetchMockData();
    }
  }, [location]);

  useEffect(() => {
    return () => { cleanupVideoUrl(); };
  }, [cleanupVideoUrl]);

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
          <button onClick={() => navigate('/detect')} style={ctaButtonStyle}>Analyze a Video</button>
        </div>
      </div>
    );
  }

  const isFake          = analysisData.prediction === 'FAKE';
  const confidenceColor = isFake ? '#FF0606' : '#33B86E';
  const hasFrames       = analysisData.frame_analysis && analysisData.frame_analysis.length > 0;
  const gradcamAvailable = isFake && analysisData.gradcam_generated;

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div id="results-container" ref={resultsRef} style={pageStyle}>

      {/* Feedback button */}
      <button
        className="feedback-button"
        onClick={() => setShowFeedback(!showFeedback)}
        style={{
          ...feedbackButtonStyle,
          position: isAtBottom ? 'absolute' : 'fixed',
          bottom: isAtBottom ? '20px' : '30px',
          right:  isAtBottom ? '20px' : '30px',
        }}
      >
        <FaComment size={20} />
      </button>

      {renderFeedbackWidget()}

      {/* Header */}
      <div style={headerStyle}>
        <h1 style={titleStyle}>Results</h1>
        <div style={{ ...verdictBadgeStyle, backgroundColor: isFake ? '#FF0606' : '#33B86E' }}>
          {analysisData.prediction}
        </div>
        <p style={{ ...confidenceStyle, color: confidenceColor }}>
          Confidence: {Math.round(analysisData.confidence * 100)}%
        </p>
        {analysisData.source && analysisData.source !== 'file' && (
          <div style={sourceBadgeStyle}>
            Source: {analysisData.source_name || analysisData.source}
          </div>
        )}
      </div>

      {/* Video player */}
      <div style={videoContainerStyle}>{renderVideoPlayer()}</div>

      {/* Frame thumbnails */}
      {hasFrames && (
        <div style={sectionStyle}>
          <h2 style={subtitleStyle}>Frame-by-Frame Analysis</h2>
          <div style={thumbnailContainerStyle}>
            {analysisData.frame_analysis.map((frame, index) => (
              <div
                key={index}
                style={{
                  ...thumbnailStyle,
                  border: selectedFrame === index
                    ? '3px solid #013D83'
                    : frame.suspicious_score > THRESHOLD_DISPLAY
                    ? '3px solid #FF3333'
                    : '3px solid transparent',
                }}
                onClick={() => setSelectedFrame(index)}
              >
                <img src={frame.original_frame} alt={`Frame ${frame.frame_number}`} style={thumbnailImageStyle} />
                <div style={thumbnailOverlayStyle}>
                  {frame.timestamp || `F${index + 1}`}
                </div>
                {/* Score badge */}
                <div style={{
                  ...scoreBadgeStyle,
                  backgroundColor: frame.suspicious_score >= THRESHOLD_DISPLAY ? '#FF060688' : '#33B86E88',
                }}>
                  {Math.round(frame.suspicious_score * 100)}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Selected frame + Grad-CAM */}
      {hasFrames && (
        <div style={heatmapContainerStyle}>
          <div style={heatmapHeaderStyle}>
            <h3 style={heatmapTitleStyle}>Selected Frame Analysis</h3>
            <button
              onClick={() => gradcamAvailable && setShowHeatmap(!showHeatmap)}
              style={{
                ...toggleButtonStyle,
                opacity:  gradcamAvailable ? 1 : 0.4,
                cursor:   gradcamAvailable ? 'pointer' : 'not-allowed',
              }}
              title={gradcamAvailable ? '' : isFake ? 'Grad-CAM unavailable' : 'Grad-CAM only for FAKE predictions'}
            >
              {showHeatmap ? 'Hide Grad-CAM' : 'Show Grad-CAM'}
            </button>
          </div>

          <div style={selectedFrameContainerStyle}>
            <div style={imageWrapperStyle}>
              <img
                src={analysisData.frame_analysis[selectedFrame]?.original_frame}
                alt="Selected Frame"
                style={selectedImageStyle}
              />
              {showHeatmap && gradcamAvailable && analysisData.frame_analysis[selectedFrame]?.heatmap && (
                <img
                  src={analysisData.frame_analysis[selectedFrame].heatmap}
                  alt="Grad-CAM Heatmap"
                  style={heatmapOverlayStyle}
                />
              )}
            </div>
          </div>

          {/* Frame info bar */}
          <div style={frameInfoBarStyle}>
            <span style={frameInfoTextStyle}>
              Frame {analysisData.frame_analysis[selectedFrame]?.frame_number}
              {' '}@ {analysisData.frame_analysis[selectedFrame]?.timestamp}
            </span>
            <span style={{
              ...frameInfoTextStyle,
              color: analysisData.frame_analysis[selectedFrame]?.suspicious_score >= THRESHOLD_DISPLAY
                ? '#E84855' : '#27AE60',
              fontWeight: 700,
            }}>
              Fake score: {Math.round((analysisData.frame_analysis[selectedFrame]?.suspicious_score || 0) * 100)}%
            </span>
          </div>

          <div style={heatmapExplanationStyle}>
            <img src={process.env.PUBLIC_URL + '/warning.png'} alt="Info" width="20" height="20" style={{ marginRight: '8px' }} />
            {isFake && gradcamAvailable ? (
              <span style={explanationTextStyle}>
                Grad-CAM heatmap: red/yellow areas highlight the regions the model focused on when
                detecting manipulation. Click a frame thumbnail to inspect individual frames.
              </span>
            ) : isFake && !gradcamAvailable ? (
              <span style={explanationTextStyle}>
                Grad-CAM heatmap generation failed for this video.
              </span>
            ) : (
              <span style={explanationTextStyle}>
                No Grad-CAM generated — video was assessed as REAL.
                Heatmaps are only produced for FAKE predictions.
              </span>
            )}
          </div>
        </div>
      )}

      {/* Summary */}
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

        {/* Model info */}
        <div style={modelInfoStyle}>
          <span style={modelInfoTextStyle}>
            Model: {analysisData.model_version || 'EfficientNetB4-TemporalPooling-Exp6v3'}
          </span>
          {analysisData.prob_fake !== undefined && (
            <span style={modelInfoTextStyle}>
              Fake probability: {(analysisData.prob_fake * 100).toFixed(1)}%
            </span>
          )}
          {analysisData.prob_real !== undefined && (
            <span style={modelInfoTextStyle}>
              Real probability: {(analysisData.prob_real * 100).toFixed(1)}%
            </span>
          )}
          {gradcamAvailable && (
            <span style={{ ...modelInfoTextStyle, color: '#E84855' }}>
              ● Grad-CAM heatmaps generated
            </span>
          )}
        </div>
      </div>

      {/* CTA */}
      <div ref={ctaContainerRef} style={{ ...ctaContainerStyle, position: 'relative' }}>
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

// ── Threshold for display colouring ──────────────────────────────────────────
const THRESHOLD_DISPLAY = 0.758;

// ── STYLES ────────────────────────────────────────────────────────────────────

const pageStyle = {
  backgroundColor: '#E5E3E3',
  minHeight: '100vh',
  padding: '2rem 1rem',
  position: 'relative',
};

const loadingStyle = { textAlign: 'center', padding: '4rem 2rem' };
const errorStyle   = { textAlign: 'center', padding: '4rem 2rem' };

const spinnerStyle = {
  width: '50px', height: '50px',
  border: '5px solid #f3f3f3',
  borderTop: '5px solid #013D83',
  borderRadius: '50%',
  animation: 'spin 1s linear infinite',
  margin: '0 auto 1.5rem',
};

const headerStyle    = { textAlign: 'center', marginBottom: '2rem' };

const titleStyle = {
  color: '#013D83', fontSize: '2.5rem', fontWeight: '700', marginBottom: '1.5rem',
};

const verdictBadgeStyle = {
  color: 'white', fontSize: '2rem', fontWeight: '700',
  padding: '1rem 2rem', borderRadius: '10px',
  display: 'inline-block', marginBottom: '1rem',
};

const confidenceStyle = { fontSize: '1.5rem', fontWeight: '600', margin: '0' };

const sourceBadgeStyle = {
  backgroundColor: '#A9D6E5', color: '#013D83',
  padding: '0.5rem 1rem', borderRadius: '20px',
  fontSize: '0.9rem', fontWeight: '600', marginTop: '0.5rem', display: 'inline-block',
};

const videoContainerStyle = {
  display: 'flex', justifyContent: 'center',
  marginBottom: '3rem', width: '100%',
  maxWidth: '800px', marginLeft: 'auto', marginRight: 'auto',
};

const videoPlayerStyle = {
  width: '100%', maxWidth: '640px', height: '360px',
  borderRadius: '10px', backgroundColor: '#000', display: 'block',
};

const videoWrapperStyle = {
  position: 'relative', width: '100%', maxWidth: '640px', margin: '0 auto',
};

const videoErrorStyle = {
  position: 'absolute', top: '50%', left: '50%',
  transform: 'translate(-50%, -50%)',
  backgroundColor: 'rgba(255,255,255,0.9)', padding: '20px',
  borderRadius: '10px', textAlign: 'center', border: '2px solid #ff4444', zIndex: 10,
};

const videoErrorSubtextStyle = { fontSize: '0.9rem', color: '#666', marginTop: '10px' };

const videoLoadingStyle = {
  position: 'absolute', top: '50%', left: '50%',
  transform: 'translate(-50%, -50%)', textAlign: 'center', color: '#fff', zIndex: 5,
};

const urlVideoInfoStyle = { width: '100%', maxWidth: '640px' };

const urlVideoHeaderStyle = {
  display: 'flex', alignItems: 'center', marginBottom: '1rem',
  padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '8px',
};

const urlVideoTitleStyle = { color: '#013D83', fontSize: '1.2rem', fontWeight: '600', margin: '0 0 0.25rem 0' };
const urlVideoTextStyle  = { color: '#666', fontSize: '0.9rem', margin: '0' };
const urlLinkStyle       = { color: '#013D83', textDecoration: 'none', wordBreak: 'break-all' };

const videoPlaceholderStyle = {
  backgroundColor: '#F8F8F8', border: '2px dashed #ccc',
  borderRadius: '10px', padding: '3rem', textAlign: 'center',
  width: '100%', maxWidth: '640px',
};

const videoPlaceholderSubtextStyle = { color: '#766F6F', fontSize: '0.9rem', marginTop: '0.5rem' };

const sectionStyle = { marginBottom: '3rem', width: '100%' };

const subtitleStyle = {
  color: '#013D83', fontSize: '1.8rem', fontWeight: '600',
  textAlign: 'center', marginBottom: '1.5rem',
};

const thumbnailContainerStyle = {
  display: 'flex', overflowX: 'auto', gap: '1rem',
  padding: '1rem', backgroundColor: '#E5E3E3',
  borderRadius: '10px', marginLeft: '23px',
};

const thumbnailStyle = {
  flex: '0 0 auto', width: '120px', height: '120px',
  borderRadius: '8px', overflow: 'hidden', position: 'relative',
  cursor: 'pointer', transition: 'transform 0.2s ease',
};

const thumbnailImageStyle  = { width: '100%', height: '100%', objectFit: 'cover' };

const thumbnailOverlayStyle = {
  position: 'absolute', bottom: '0', left: '0', right: '0',
  backgroundColor: 'rgba(0,0,0,0.7)', color: 'white',
  padding: '4px', fontSize: '0.75rem', textAlign: 'center',
};

const scoreBadgeStyle = {
  position: 'absolute', top: '4px', right: '4px',
  color: 'white', fontSize: '0.7rem', fontWeight: '700',
  padding: '2px 5px', borderRadius: '4px',
};

const heatmapContainerStyle = {
  backgroundColor: '#F8F8F8', borderRadius: '15px', padding: '2rem',
  marginBottom: '3rem', width: '100%', maxWidth: '900px',
  marginLeft: 'auto', marginRight: 'auto',
};

const heatmapHeaderStyle = {
  display: 'flex', justifyContent: 'space-between',
  alignItems: 'center', marginBottom: '1.5rem',
  flexWrap: 'wrap', gap: '1rem',
};

const heatmapTitleStyle = { color: '#013D83', fontSize: '1.5rem', fontWeight: '600', margin: '0' };

const toggleButtonStyle = {
  backgroundColor: '#A9D6E5', color: '#013D83', border: 'none',
  padding: '10px 20px', borderRadius: '8px', fontWeight: '500',
  fontSize: '0.95rem', transition: 'all 0.3s ease',
};

const selectedFrameContainerStyle = { display: 'flex', justifyContent: 'center', marginBottom: '1rem' };

const imageWrapperStyle = { position: 'relative', width: '800px', height: '400px' };

const selectedImageStyle = {
  width: '100%', height: '100%', objectFit: 'cover',
  borderRadius: '8px', border: '2px solid #ddd',
};

const heatmapOverlayStyle = {
  position: 'absolute', top: '0', left: '0',
  width: '100%', height: '100%',
  opacity: '0.65', pointerEvents: 'none', borderRadius: '8px',
};

const frameInfoBarStyle = {
  display: 'flex', justifyContent: 'space-between',
  padding: '0.5rem 1rem', backgroundColor: '#EEF2F7',
  borderRadius: '6px', marginBottom: '0.75rem',
};

const frameInfoTextStyle = { fontSize: '0.85rem', color: '#444', fontWeight: '500' };

const heatmapExplanationStyle = {
  display: 'flex', alignItems: 'flex-start',
  color: '#6D6D6D', fontSize: '0.9rem', marginTop: '1rem',
};

const explanationTextStyle = { margin: '0', lineHeight: '1.5' };

const summaryContainerStyle = {
  backgroundColor: '#F8F8F8', borderRadius: '15px', padding: '2rem',
  marginBottom: '3rem', width: '70%', marginLeft: 'auto', marginRight: 'auto',
};

const summaryTitleStyle = { color: '#013D83', fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem' };

const summaryTextStyle = { color: '#000', lineHeight: '1.6', marginBottom: '1rem', fontSize: '1.1rem' };

const anomaliesListStyle = { margin: '0 0 1rem 0', paddingLeft: '1.5rem' };

const anomalyItemStyle = { marginBottom: '0.5rem', display: 'flex', alignItems: 'flex-start' };
const anomalyBulletStyle = { color: '#FF0606', fontWeight: 'bold', marginRight: '0.5rem', fontSize: '1.2rem' };
const anomalyTextStyle   = { color: '#000', lineHeight: '1.5' };

const modelInfoStyle = {
  display: 'flex', gap: '1.5rem', flexWrap: 'wrap',
  marginTop: '1rem', padding: '0.75rem 1rem',
  backgroundColor: '#EEF2F7', borderRadius: '8px',
  borderLeft: '4px solid #013D83',
};

const modelInfoTextStyle = { color: '#013D83', fontSize: '0.85rem', fontWeight: '600' };

const ctaContainerStyle = {
  display: 'flex', justifyContent: 'center',
  gap: '1rem', flexWrap: 'wrap', marginTop: '2rem',
};

const analyzeAnotherButtonStyle = {
  backgroundColor: '#A9D6E5', color: '#013D83', border: 'none',
  padding: '12px 30px', borderRadius: '8px', fontWeight: '600',
  cursor: 'pointer', fontSize: '1rem', transition: 'all 0.3s ease',
};

const downloadReportButtonStyle = {
  backgroundColor: '#E5E3E3', color: '#013D83',
  border: '2px solid #013D83', padding: '12px 30px',
  borderRadius: '8px', fontWeight: '600', cursor: 'pointer',
  fontSize: '1rem', transition: 'all 0.3s ease',
};

const ctaButtonStyle = {
  backgroundColor: '#013D83', color: 'white', border: 'none',
  padding: '12px 30px', borderRadius: '8px', fontWeight: '600',
  cursor: 'pointer', fontSize: '1rem',
};

// ── Feedback styles ───────────────────────────────────────────────────────────

const feedbackButtonStyle = {
  width: '60px', height: '60px', borderRadius: '50%',
  backgroundColor: '#013D83', color: 'white', border: 'none',
  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
  boxShadow: '0 4px 15px rgba(1,61,131,0.3)', zIndex: 1000, transition: 'all 0.3s ease',
};

const feedbackWidgetStyle = {
  position: 'fixed', bottom: '100px', right: '30px',
  width: '350px', backgroundColor: 'white', borderRadius: '12px',
  boxShadow: '0 8px 30px rgba(0,0,0,0.15)', zIndex: 1001,
  border: '1px solid #e1e5e9', animation: 'slideUp 0.3s ease-out',
};

const feedbackHeaderStyle = {
  backgroundColor: '#013D83', color: 'white',
  padding: '15px 20px', borderRadius: '12px 12px 0 0',
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
};

const feedbackTitleStyle = { margin: 0, fontSize: '1.1rem', fontWeight: '600' };

const closeButtonStyle = {
  background: 'none', border: 'none', color: 'white', cursor: 'pointer',
  padding: '5px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
};

const feedbackContentStyle = { padding: '20px' };

const userStatusStyle = {
  marginBottom: '15px', padding: '8px 12px',
  backgroundColor: '#f8f9fa', borderRadius: '6px',
  border: '1px solid #e9ecef', textAlign: 'center',
};

const userStatusTextStyle = { fontSize: '0.85rem', fontWeight: '500' };

const starRatingContainerStyle = { marginBottom: '15px' };
const ratingLabelStyle = { margin: '0 0 10px 0', fontSize: '0.9rem', color: '#333', fontWeight: '500' };
const starsContainerStyle = { display: 'flex', gap: '5px', marginBottom: '15px' };
const starStyle = { fontSize: '24px', transition: 'color 0.2s ease' };

const feedbackTextareaStyle = {
  width: '100%', padding: '12px', border: '1px solid #ddd',
  borderRadius: '8px', fontSize: '0.9rem', resize: 'vertical',
  fontFamily: 'inherit', marginBottom: '15px', minHeight: '80px',
};

const submitButtonStyle = {
  width: '100%', padding: '12px', backgroundColor: '#013D83',
  color: 'white', border: 'none', borderRadius: '8px',
  fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  transition: 'all 0.3s ease',
};

const successMessageStyle = {
  backgroundColor: '#d4edda', color: '#155724', padding: '10px',
  borderRadius: '6px', fontSize: '0.85rem', marginBottom: '15px', textAlign: 'center',
};

const errorMessageStyle = {
  backgroundColor: '#f8d7da', color: '#721c24', padding: '10px',
  borderRadius: '6px', fontSize: '0.85rem', marginBottom: '15px', textAlign: 'center',
};

// ── CSS animations ────────────────────────────────────────────────────────────
const styles = `
  @keyframes spin {
    0%   { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  @keyframes slideUp {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }
`;
const styleSheet = document.createElement('style');
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);

export default Results;