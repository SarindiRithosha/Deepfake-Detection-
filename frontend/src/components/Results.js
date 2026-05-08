import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  FaComment, FaPaperPlane, FaTimes, FaStar,
  FaCheckCircle, FaExclamationTriangle, FaBrain,
  FaClock, FaFilm, FaDownload, FaChartBar
} from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import jsPDF from 'jspdf';

const THRESHOLD = 0.758;

// jsPDF helper — jsPDF does NOT support spread operator for color args
// Must call setFillColor(r,g,b) and setTextColor(r,g,b) with individual numbers
const setFill  = (pdf, r, g, b) => pdf.setFillColor(r, g, b);
const setStroke= (pdf, r, g, b) => pdf.setDrawColor(r, g, b);
const setText  = (pdf, r, g, b) => pdf.setTextColor(r, g, b);

export default function Results() {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, userProfile } = useAuth();

  const [data,       setData]       = useState(null);
  const [selFrame,   setSelFrame]   = useState(0);
  const [showHeatmap,setShowHeatmap]= useState(false);
  const [loading,    setLoading]    = useState(true);
  const [blobUrl,    setBlobUrl]    = useState(null);
  const [videoSrc,   setVideoSrc]   = useState(null);
  const [vidErr,     setVidErr]     = useState(false);
  const [showFB,     setShowFB]     = useState(false);
  const [fbText,     setFbText]     = useState('');
  const [rating,     setRating]     = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [fbStatus,   setFbStatus]   = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  const fbRef = useRef(null);
  const cleanup = useCallback(() => { if (blobUrl) URL.revokeObjectURL(blobUrl); }, []);

  useEffect(() => {
    const h = (e) => {
      if (fbRef.current && !fbRef.current.contains(e.target) && !e.target.closest('.fab-fb'))
        setShowFB(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  useEffect(() => {
    if (location.state?.analysisData) {
      setData(location.state.analysisData);
      const f = location.state.uploadedFile;
      if (f instanceof File || (f?.name && f?.type)) {
        try { setBlobUrl(URL.createObjectURL(f)); setVideoSrc('file'); }
        catch { setVideoSrc('none'); }
      } else {
        setVideoSrc(location.state.videoUrl ? 'url' : 'none');
      }
      setLoading(false);
    } else {
      setData({ prediction:'FAKE', confidence:0.87, prob_fake:0.87, prob_real:0.13,
        frame_analysis:[], summary:'Demo mode.', anomalies:['Demo anomaly'],
        analysis_id:'DEMO_001', filename:'demo.mp4',
        model_version:'EfficientNetB4-TemporalPooling-Exp6v3', gradcam_generated:false });
      setVideoSrc('none'); setLoading(false);
    }
  }, [location]);

  useEffect(() => () => cleanup(), [cleanup]);

  const userInfo = () => currentUser && userProfile
    ? { user_name:userProfile.name||'User', user_email:currentUser.email||'', user_id:currentUser.uid, is_logged_in:true }
    : { user_name:'Anonymous', user_email:'', user_id:null, is_logged_in:false };

  /* ── PDF Generation: uses jsPDF to create a detailed report with consistent styling and a clean layout */
  const downloadPDF = async () => {
    if (!data) return;
    setPdfLoading(true);
    try {
      const pdf    = new jsPDF('p', 'mm', 'a4');
      const W      = 210;
      const isFake = data.prediction === 'FAKE';
      const conf   = Math.round(data.confidence * 100);

      /* ── Header: clean minimal ── */
      setFill(pdf, 1, 61, 131);
      pdf.rect(0, 0, W, 40, 'F');
      // Left accent bar
      setFill(pdf, 169, 214, 229);
      pdf.rect(0, 0, 3, 40, 'F');
      // Wordmark
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(22);
      setText(pdf, 255, 255, 255);
      pdf.text('VERITY-X', 12, 16);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8.5);
      setText(pdf, 169, 214, 229);
      pdf.text('AI-Powered Deepfake Detection Platform', 12, 25);
      pdf.setFontSize(7);
      setText(pdf, 180, 205, 225);
      pdf.text('CONFIDENTIAL  —  ANALYSIS REPORT', 12, 33);
      // Right meta
      pdf.setFontSize(7.5);
      setText(pdf, 169, 214, 229);
      pdf.text('Generated: ' + new Date().toLocaleDateString('en-GB',{day:'2-digit',month:'long',year:'numeric'}), W-12, 16, {align:'right'});
      pdf.text('Report ID: ' + (data.analysis_id||'N/A'), W-12, 25, {align:'right'});
      setText(pdf, 180, 205, 225);
      pdf.text('Verity-X AI System', W-12, 33, {align:'right'});
      // Bottom accent line
      setFill(pdf, 169, 214, 229);
      pdf.rect(0, 40, W, 1.2, 'F');

      /* ── Verdict band ── */
      if (isFake) { setFill(pdf, 185, 28, 28); } else { setFill(pdf, 21, 128, 61); }
      pdf.rect(0, 41.2, W, 30, 'F');

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(22);
      setText(pdf, 255, 255, 255);
      pdf.text('VERDICT: ' + data.prediction, W/2, 53, {align:'center'});
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10.5);
      pdf.text('Confidence: ' + conf + '%   |   Fake: ' + (data.prob_fake*100).toFixed(1) + '%   |   Real: ' + (data.prob_real*100).toFixed(1) + '%', W/2, 63, {align:'center'});

      /* ── Verdict description box ── */
      if (isFake) { setFill(pdf, 255, 245, 245); } else { setFill(pdf, 245, 255, 250); }
      pdf.rect(13, 75, W-26, 12, 'F');
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8.5);
      if (isFake) { setText(pdf, 130, 20, 20); } else { setText(pdf, 14, 90, 42); }
      const dsc = isFake
        ? 'This video has been assessed as containing synthetic manipulation. Review anomalies and frame scores for evidence.'
        : 'No manipulation artefacts were detected. This video is assessed as authentic by the Verity-X detection model.';
      pdf.text(pdf.splitTextToSize(dsc, W-36), W/2, 82, {align:'center'});

      let y = 93;

      const section = (title) => {
        setFill(pdf, 1, 61, 131);
        pdf.rect(0, y-1, 4, 11, 'F');
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(10.5);
        setText(pdf, 1, 61, 131);
        pdf.text(title, 10, y+7);
        setStroke(pdf, 210, 225, 245);
        pdf.setLineWidth(0.35);
        pdf.line(10, y+10, W-10, y+10);
        y += 15;
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9.2);
        setText(pdf, 35, 45, 65);
      };

      const row = (l, v, l2, v2) => {
        pdf.setFont('helvetica', 'bold'); setText(pdf, 80, 95, 120);
        pdf.text(l+':', 14, y);
        pdf.setFont('helvetica', 'normal'); setText(pdf, 20, 25, 50);
        pdf.text(String(v||'N/A'), 52, y);
        if (l2) {
          pdf.setFont('helvetica', 'bold'); setText(pdf, 80, 95, 120);
          pdf.text(l2+':', 112, y);
          pdf.setFont('helvetica', 'normal'); setText(pdf, 20, 25, 50);
          pdf.text(String(v2||'N/A'), 150, y);
        }
        y += 7;
      };

      section('VIDEO INFORMATION');
      row('Filename',    data.filename,                              'Frames',      data.frame_count||data.frame_analysis?.length||16);
      row('Source',      data.source||'File upload',                'Processing',  data.analysis_time||'N/A');
      row('Date / Time', data.timestamp ? new Date(data.timestamp).toLocaleString() : 'N/A');
      y += 4;

      section('DETECTION MODEL');
      row('Model',     data.model_version||'EfficientNetB4-TemporalPooling', 'Accuracy', '85.84%');
      row('AUC-ROC',   '0.9307',                                              'EER',      '14.61%');
      row('Threshold', '0.758 (optimal)', 'Grad-CAM', data.gradcam_generated ? 'Generated' : 'Not generated');
      y += 4;

      section('ANALYSIS SUMMARY');
      setFill(pdf, 246, 249, 255);
      const sumLines = pdf.splitTextToSize(data.summary||'No summary.', W-30);
      pdf.rect(12, y-3, W-24, sumLines.length*5.6+6, 'F');
      setText(pdf, 30, 40, 80);
      pdf.text(sumLines, 16, y+2);
      y += sumLines.length*5.6+10;

      if (isFake && data.anomalies?.length > 0) {
        if (y > 232) { pdf.addPage(); y = 20; }
        section('DETECTED ANOMALIES');
        data.anomalies.forEach(a => {
          if (y > 268) { pdf.addPage(); y = 20; }
          setFill(pdf, 255, 242, 242);
          pdf.rect(12, y-3.5, W-24, 8, 'F');
          setFill(pdf, 185, 28, 28);
          pdf.circle(16.5, y+0.5, 1.6, 'F');
          setText(pdf, 50, 15, 15);
          const aLines = pdf.splitTextToSize(a, W-36);
          pdf.text(aLines, 22, y+1);
          y += Math.max(8, aLines.length*5.2+2);
        });
        y += 4;
      }

      if (data.frame_analysis?.length > 0) {
        if (y > 218) { pdf.addPage(); y = 20; }
        section('FRAME ANALYSIS SCORES');
        pdf.setFontSize(8.2);
        const cols = 4, colW = (W-28)/cols;
        data.frame_analysis.forEach((fr, i) => {
          const c = i%cols, r = Math.floor(i/cols);
          const fx = 14+c*colW, fy = y+r*12;
          if (fy > 268) return;
          const hi = fr.suspicious_score >= THRESHOLD;
          if (hi) { setFill(pdf, 255, 240, 240); } else { setFill(pdf, 240, 255, 247); }
          pdf.rect(fx, fy-3.5, colW-3, 10, 'F');
          if (hi) { setFill(pdf, 185, 28, 28); } else { setFill(pdf, 21, 128, 61); }
          pdf.circle(fx+3.5, fy+1.5, 1.8, 'F');
          pdf.setFont('helvetica', 'normal');
          if (hi) { setText(pdf, 130, 20, 20); } else { setText(pdf, 15, 80, 40); }
          pdf.text(`F${i+1} · ${fr.timestamp||'—'}`, fx+8, fy+1);
          pdf.setFont('helvetica', 'bold');
          pdf.text(`${Math.round(fr.suspicious_score*100)}%`, fx+colW-5, fy+1, {align:'right'});
        });
        y += Math.ceil(data.frame_analysis.length/cols)*12+8;
      }

      /* ── Footer on every page ── */
      const total = pdf.internal.getNumberOfPages();
      for (let p = 1; p <= total; p++) {
        pdf.setPage(p);
        setFill(pdf, 1, 61, 131);
        pdf.rect(0, 287, W, 10, 'F');
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(7.5);
        setText(pdf, 169, 214, 229);
        pdf.text('© 2025 Verity-X — AI-Powered Deepfake Detection System', 14, 293);
        pdf.text(`Page ${p} of ${total}`, W-14, 293, {align:'right'});
      }

      pdf.save(`verityx_report_${data.analysis_id||Date.now()}.pdf`);
    } catch (e) {
      console.error('PDF generation error:', e);
      alert('PDF generation failed. Please try again.');
    } finally {
      setPdfLoading(false);
    }
  };

  /* ── Feedback ── */
  const submitFeedback = async () => {
    if (!fbText.trim() && rating === 0) { setFbStatus('Please add a rating or comment.'); return; }
    setSubmitting(true); setFbStatus(null);
    try {
      const ui = userInfo();
      await axios.post(`${process.env.REACT_APP_API_URL}/submit-feedback`, {
        feedback:fbText.trim(), rating,
        analysis_id:data?.analysis_id||'unknown',
        prediction:data?.prediction||'unknown',
        confidence:data?.confidence||0,
        source:videoSrc, timestamp:new Date().toISOString(), ...ui,
      });
      setFbStatus('success'); setFbText(''); setRating(0);
      setTimeout(() => { setShowFB(false); setFbStatus(null); }, 1800);
    } catch { setFbStatus('error'); } finally { setSubmitting(false); }
  };

  /* ── Video player ── */
  const renderVideo = () => {
    if (videoSrc === 'file' && blobUrl) return (
      <div style={vWrap}>
        <video controls style={vEl} src={blobUrl} onError={() => setVidErr(true)} preload="metadata" key={blobUrl}/>
        {vidErr && <div style={vOvr}><p style={{margin:0}}>Unable to play video</p></div>}
      </div>
    );
    if (videoSrc === 'url' && data?.original_url) return (
      <div>
        <div style={urlChip}>
          <span style={{fontWeight:700,fontSize:'0.73rem',color:'#013D83'}}>{data.source_name||'URL'}</span>
          <a href={data.original_url} target="_blank" rel="noopener noreferrer"
            style={{fontSize:'0.73rem',color:'#2563eb',textDecoration:'none',wordBreak:'break-all'}}>
            {data.original_url.length>60?data.original_url.slice(0,60)+'…':data.original_url}
          </a>
        </div>
        <div style={vWrap}>
          <video controls style={vEl} onError={() => setVidErr(true)} preload="metadata">
            <source src={`${process.env.REACT_APP_API_URL}/video/${data.analysis_id}`} type="video/mp4"/>
          </video>
        </div>
      </div>
    );
    return (
      <div style={vPH}>
        <FaFilm style={{fontSize:'1.8rem',opacity:0.3,marginBottom:'0.4rem'}}/>
        <p style={{margin:0,fontSize:'0.82rem',color:'#9ca3af'}}>No video available</p>
      </div>
    );
  };

  if (loading) return (
    <div style={pg}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'60vh',flexDirection:'column',gap:'1rem'}}>
        <div style={spinEl}/><p style={{color:'#013D83',fontWeight:600}}>Loading results…</p>
      </div>
    </div>
  );
  if (!data) return (
    <div style={pg}>
      <div style={{textAlign:'center',padding:'4rem'}}>
        <h2>No analysis data found</h2>
        <button onClick={() => navigate('/detect')} style={bPri}>Analyse a Video</button>
      </div>
    </div>
  );

  const isFake    = data.prediction === 'FAKE';
  const hasFrames = data.frame_analysis?.length > 0;
  const gradcam   = isFake && data.gradcam_generated;
  const conf      = Math.round(data.confidence * 100);
  const ui        = userInfo();

  return (
    <div style={pg}>

      {/* FAB */}
      <button className="fab-fb" onClick={() => setShowFB(!showFB)} style={fab}>
        <FaComment size={16}/>
      </button>

      {/* Feedback panel */}
      {showFB && (
        <div ref={fbRef} style={fbPanel}>
          <div style={fbHead}>
            <span style={{fontWeight:700,fontSize:'0.88rem'}}>Share Feedback</span>
            <button onClick={() => setShowFB(false)} style={{background:'none',border:'none',color:'white',cursor:'pointer',display:'flex'}}><FaTimes size={12}/></button>
          </div>
          <div style={{padding:'0.85rem'}}>
            <p style={{margin:'0 0 0.45rem',fontSize:'0.75rem',color:'#9ca3af'}}>
              {ui.is_logged_in ? `Sending as ${ui.user_name}` : 'Sending as Anonymous'}
            </p>
            <div style={{display:'flex',gap:'3px',marginBottom:'0.6rem'}}>
              {[1,2,3,4,5].map(s=>(
                <FaStar key={s} onClick={() => setRating(s)}
                  style={{cursor:'pointer',fontSize:'1.2rem',color:s<=rating?'#f59e0b':'#e5e7eb'}}/>
              ))}
            </div>
            <textarea value={fbText} onChange={e => setFbText(e.target.value)}
              placeholder="Your thoughts on Verity-X..."
              style={{width:'100%',padding:'0.5rem',border:'1px solid #e5e7eb',borderRadius:'6px',
                fontSize:'0.8rem',resize:'vertical',minHeight:'60px',fontFamily:'inherit',boxSizing:'border-box'}}/>
            {fbStatus && (
              <p style={{fontSize:'0.73rem',margin:'0.3rem 0',
                color:fbStatus==='success'?'#16a34a':fbStatus==='error'?'#dc2626':'#6b7280'}}>
                {fbStatus==='success'?'Thank you for your feedback!':fbStatus==='error'?'Failed — try again.':fbStatus}
              </p>
            )}
            <button onClick={submitFeedback} disabled={submitting}
              style={{...bPri,width:'100%',padding:'0.48rem',fontSize:'0.78rem',justifyContent:'center',marginTop:'0.3rem'}}>
              <FaPaperPlane size={9} style={{marginRight:'4px'}}/>
              {submitting?'Sending...':'Send Feedback'}
            </button>
          </div>
        </div>
      )}

      {/* ── VERDICT BANNER ── */}
      <div style={{
        ...verdictBanner,
        background: isFake
          ? 'linear-gradient(135deg, #013D83 0%, #0a2040 40%, #1a0a0a 100%)'
          : 'linear-gradient(135deg, #013D83 0%, #0a2840 40%, #0a1a10 100%)',
      }}>
        <div style={bannerInner}>
          <div style={{display:'flex',alignItems:'center',gap:'1.1rem',flex:'1 1 270px'}}>
            <div style={bIcoRing}>
              {isFake
                ? <FaExclamationTriangle style={{color:'#fca5a5',fontSize:'1.75rem'}}/>
                : <FaCheckCircle style={{color:'#A9D6E5',fontSize:'1.75rem'}}/>}
            </div>
            <div>
              <p style={bLabel}>ANALYSIS VERDICT</p>
              <h1 style={{...bVerdict, color:isFake?'#fca5a5':'#A9D6E5'}}>{data.prediction}</h1>
              <p style={bDesc}>
                {isFake
                  ? 'This video shows signs of synthetic manipulation.'
                  : 'No manipulation detected — video appears authentic.'}
              </p>
            </div>
          </div>

          <div style={{display:'flex',gap:'0.6rem',flexWrap:'wrap',justifyContent:'flex-end'}}>
            {[
              ['Confidence',      conf+'%'],
              ['Fake Probability',(data.prob_fake*100).toFixed(1)+'%'],
              ['Real Probability',(data.prob_real*100).toFixed(1)+'%'],
              ['Threshold',       '75.8%'],
            ].map(([l,v]) => (
              <div key={l} style={mTile}>
                <p style={mLabel}>{l}</p>
                <p style={mVal}>{v}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Probability bar */}
        <div style={{maxWidth:'1280px',margin:'0 auto',borderTop:'1px solid rgba(255,255,255,0.12)',paddingTop:'0.8rem'}}>
          <div style={{height:'5px',background:'rgba(255,255,255,0.1)',borderRadius:'3px',position:'relative',marginBottom:'0.35rem'}}>
            <div style={{
              position:'absolute',left:0,top:0,height:'100%',borderRadius:'3px',
              width:`${data.prob_fake*100}%`,
              background:isFake
                ?'linear-gradient(90deg,#fca5a5,#f87171)'
                :'linear-gradient(90deg,#A9D6E5,#6ee7b7)',
              transition:'width 0.9s ease',
            }}/>
            <div style={{position:'absolute',top:'-4px',left:'75.8%',width:'2px',height:'13px',
              background:'rgba(255,255,255,0.6)',borderRadius:'1px'}}/>
          </div>
          <div style={{display:'flex',justifyContent:'space-between',fontSize:'0.63rem',color:'rgba(255,255,255,0.35)'}}>
            <span>0% — REAL</span>
            <span>threshold 75.8%</span>
            <span>100% — FAKE</span>
          </div>
        </div>
      </div>

      {/* ── BODY ── */}
      <div style={body}>
        <div style={grid}>

          {/* LEFT column */}
          <div style={col}>
            <div style={card}>
              <div style={cardHd}><FaFilm style={ico}/><h3 style={cardTit}>Analysed Video</h3></div>
              {renderVideo()}
              <div style={{display:'flex',gap:'0.35rem',flexWrap:'wrap',marginTop:'0.6rem'}}>
                {data.filename && <span style={chip}>{data.filename}</span>}
                {data.source && data.source !== 'file' && (
                  <span style={{...chip,background:'#dbeafe',color:'#1e40af'}}>{data.source_name||data.source}</span>
                )}
              </div>
            </div>

            <div style={card}>
              <div style={cardHd}><FaBrain style={ico}/><h3 style={cardTit}>Analysis Summary</h3></div>
              <p style={{color:'#4b5563',lineHeight:1.7,fontSize:'0.875rem',margin:0}}>{data.summary}</p>
              {isFake && data.anomalies?.length > 0 && (
                <div style={{marginTop:'1rem'}}>
                  <p style={{fontSize:'0.68rem',fontWeight:700,color:'#b91c1c',textTransform:'uppercase',
                    letterSpacing:'0.07em',margin:'0 0 0.55rem'}}>DETECTED ANOMALIES</p>
                  {data.anomalies.map((a,i) => (
                    <div key={i} style={{display:'flex',alignItems:'flex-start',gap:'0.45rem',marginBottom:'0.35rem',
                      background:'#fef2f2',borderRadius:'6px',padding:'0.38rem 0.6rem'}}>
                      <span style={{color:'#ef4444',fontWeight:700,fontSize:'0.68rem',marginTop:'0.15rem',flexShrink:0}}>x</span>
                      <span style={{fontSize:'0.82rem',color:'#374151'}}>{a}</span>
                    </div>
                  ))}
                </div>
              )}
              <div style={{display:'flex',flexWrap:'wrap',gap:'0.3rem',marginTop:'1rem',paddingTop:'0.9rem',borderTop:'1px solid #f3f4f6'}}>
                {[
                  data.model_version||'EfficientNetB4-Exp6v3',
                  'Acc: 85.84%','AUC: 0.9307',
                  ...(gradcam?['Grad-CAM Generated']:[])
                ].map(t => (
                  <span key={t} style={{...chip,
                    background:t.includes('Grad')?'#fef2f2':undefined,
                    color:t.includes('Grad')?'#b91c1c':undefined}}>
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT column */}
          <div style={col}>
            {hasFrames && (
              <div style={card}>
                <div style={cardHd}><FaChartBar style={ico}/><h3 style={cardTit}>Frame-by-Frame Analysis</h3></div>
                <div style={{display:'grid',gridTemplateColumns:'repeat(8,1fr)',gap:'3px',marginBottom:'0.85rem'}}>
                  {data.frame_analysis.map((fr,i) => {
                    const hi = fr.suspicious_score >= THRESHOLD;
                    return (
                      <button key={i} onClick={() => setSelFrame(i)} style={{
                        position:'relative',borderRadius:'5px',overflow:'hidden',
                        cursor:'pointer',background:'none',border:'none',padding:0,aspectRatio:'1',
                        outline:selFrame===i?'2px solid #013D83':hi?'2px solid #ef4444':'2px solid transparent',
                      }}>
                        <img src={fr.original_frame} alt={`F${i+1}`}
                          style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}}/>
                        <div style={{position:'absolute',bottom:0,left:0,right:0,padding:'1px',
                          background:'rgba(0,0,0,0.68)',color:'white',fontSize:'0.48rem',textAlign:'center'}}>
                          {fr.timestamp||`F${i+1}`}
                        </div>
                        <div style={{position:'absolute',top:'2px',right:'2px',color:'white',
                          fontSize:'0.47rem',fontWeight:700,padding:'1px 2px',borderRadius:'2px',
                          background:hi?'rgba(239,68,68,0.88)':'rgba(1,61,131,0.80)'}}>
                          {Math.round(fr.suspicious_score*100)}%
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div style={{background:'#f8fafc',borderRadius:'10px',overflow:'hidden',border:'1px solid #e5e7eb'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',
                    padding:'0.5rem 0.75rem',borderBottom:'1px solid #e5e7eb',background:'white'}}>
                    <span style={{fontSize:'0.76rem',color:'#374151',fontWeight:600}}>
                      Frame {data.frame_analysis[selFrame]?.frame_number} — {data.frame_analysis[selFrame]?.timestamp}
                    </span>
                    <div style={{display:'flex',alignItems:'center',gap:'0.55rem'}}>
                      <span style={{fontSize:'0.73rem',fontWeight:700,
                        color:data.frame_analysis[selFrame]?.suspicious_score>=THRESHOLD?'#ef4444':'#013D83'}}>
                        {Math.round((data.frame_analysis[selFrame]?.suspicious_score||0)*100)}% fake score
                      </span>
                      {gradcam && (
                        <button onClick={() => setShowHeatmap(!showHeatmap)} style={{
                          fontSize:'0.68rem',padding:'0.2rem 0.55rem',borderRadius:'20px',
                          background:showHeatmap?'#013D83':'#eff6ff',
                          color:showHeatmap?'white':'#013D83',
                          border:'1px solid #013D83',cursor:'pointer',fontWeight:600}}>
                          {showHeatmap?'Hide Grad-CAM':'Show Grad-CAM'}
                        </button>
                      )}
                    </div>
                  </div>
                  <div style={{position:'relative',aspectRatio:'16/9'}}>
                    <img src={data.frame_analysis[selFrame]?.original_frame} alt="Selected frame"
                      style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}}/>
                    {showHeatmap && gradcam && data.frame_analysis[selFrame]?.heatmap && (
                      <img src={data.frame_analysis[selFrame].heatmap} alt="Grad-CAM"
                        style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover',opacity:0.65}}/>
                    )}
                  </div>
                  <p style={{margin:0,padding:'0.42rem 0.75rem',fontSize:'0.7rem',color:'#6b7280',
                    background:'white',borderTop:'1px solid #e5e7eb'}}>
                    {isFake && gradcam
                      ? 'Grad-CAM active — red areas show regions the model found suspicious.'
                      : isFake
                      ? 'Grad-CAM unavailable for this analysis.'
                      : 'Grad-CAM is only generated for FAKE predictions.'}
                  </p>
                </div>
              </div>
            )}

            <div style={card}>
              <div style={cardHd}><FaClock style={ico}/><h3 style={cardTit}>Analysis Details</h3></div>
              {[
                ['Analysis ID', data.analysis_id||'N/A'],
                ['File',        data.filename||'N/A'],
                ['Frames',      String(data.frame_count||data.frame_analysis?.length||16)],
                ['Processing',  data.analysis_time||'N/A'],
                ['Model',       'EfficientNetB4 + Temporal Pooling'],
                ['Threshold',   '0.758 (optimal)'],
                ['Grad-CAM',    gradcam?'Generated':'Not generated'],
                ['Date / Time', data.timestamp?new Date(data.timestamp).toLocaleString():'N/A'],
              ].map(([l,v]) => (
                <div key={l} style={{display:'flex',padding:'0.4rem 0',borderBottom:'1px solid #f3f4f6',gap:'1rem'}}>
                  <span style={{fontSize:'0.75rem',color:'#9ca3af',fontWeight:600,minWidth:'108px',flexShrink:0}}>{l}</span>
                  <span style={{fontSize:'0.75rem',color:'#374151',wordBreak:'break-all'}}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{display:'flex',justifyContent:'center',gap:'0.9rem',paddingTop:'2rem',flexWrap:'wrap'}}>
          <button onClick={() => navigate('/detect')} style={bSec}>Back to Detection</button>
          <button onClick={downloadPDF} disabled={pdfLoading} style={{...bPri,gap:'6px'}}>
            <FaDownload size={11}/>{pdfLoading?'Generating PDF...':'Download PDF Report'}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes spin   { to { transform:rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
      `}</style>
    </div>
  );
}

/* ── Styles ── */
const pg          = { background:'#E5E3E3', minHeight:'100vh', fontFamily:"'Segoe UI',sans-serif" };
const verdictBanner = { marginTop:'2rem', marginBottom:0, padding:'2.2rem 1.5rem 1.4rem' };
const bannerInner = { maxWidth:'1280px', margin:'0 auto', display:'flex', flexWrap:'wrap', gap:'1.75rem', alignItems:'center', marginBottom:'1.1rem' };
const bIcoRing    = { width:'54px', height:'54px', borderRadius:'50%', background:'rgba(255,255,255,0.12)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 };
const bLabel      = { margin:'0 0 0.12rem', fontSize:'0.6rem', letterSpacing:'0.15em', color:'rgba(255,255,255,0.42)', textTransform:'uppercase' };
const bVerdict    = { margin:'0 0 0.18rem', fontSize:'2.1rem', fontWeight:800, letterSpacing:'-0.02em' };
const bDesc       = { margin:0, fontSize:'0.82rem', color:'rgba(255,255,255,0.48)' };
const mTile       = { background:'rgba(255,255,255,0.1)', borderRadius:'9px', padding:'0.58rem 0.95rem', textAlign:'center', minWidth:'68px' };
const mLabel      = { margin:'0 0 0.12rem', fontSize:'0.58rem', color:'rgba(255,255,255,0.42)', textTransform:'uppercase', letterSpacing:'0.07em' };
const mVal        = { margin:0, fontSize:'1.2rem', fontWeight:700, color:'white' };
const body        = { maxWidth:'1280px', margin:'0 auto', padding:'1.6rem 1.5rem 3rem' };
const grid        = { display:'grid', gridTemplateColumns:'1fr 1.12fr', gap:'1.2rem', alignItems:'start' };
const col         = { display:'flex', flexDirection:'column', gap:'1.2rem' };
const card        = { background:'white', borderRadius:'12px', padding:'1.3rem', boxShadow:'0 1px 4px rgba(0,0,0,0.07)', animation:'fadeUp 0.35s ease' };
const cardHd      = { display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'1rem' };
const ico         = { color:'#013D83', fontSize:'0.88rem' };
const cardTit     = { margin:0, fontSize:'0.92rem', fontWeight:700, color:'#111827' };
const chip        = { fontSize:'0.68rem', padding:'0.16rem 0.5rem', borderRadius:'20px', background:'#eff6ff', color:'#1d4ed8', fontWeight:600 };
const vWrap       = { borderRadius:'8px', overflow:'hidden', background:'#000', aspectRatio:'16/9', position:'relative' };
const vEl         = { width:'100%', height:'100%', display:'block' };
const vOvr        = { position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,0.7)', color:'white', fontSize:'0.88rem' };
const vPH         = { background:'#f9fafb', borderRadius:'8px', aspectRatio:'16/9', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', border:'2px dashed #e5e7eb' };
const urlChip     = { display:'flex', flexWrap:'wrap', gap:'0.35rem', alignItems:'center', background:'#eff6ff', borderRadius:'7px', padding:'0.38rem 0.65rem', marginBottom:'0.4rem' };
const bPri        = { padding:'0.68rem 1.5rem', background:'#013D83', color:'white', border:'none', borderRadius:'8px', fontWeight:700, cursor:'pointer', fontSize:'0.86rem', display:'flex', alignItems:'center' };
const bSec        = { padding:'0.68rem 1.5rem', background:'white', color:'#013D83', border:'2px solid #013D83', borderRadius:'8px', fontWeight:700, cursor:'pointer', fontSize:'0.86rem' };
const fab         = { position:'fixed', bottom:'2rem', right:'2rem', width:'46px', height:'46px', borderRadius:'50%', background:'#013D83', color:'white', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 14px rgba(1,61,131,0.4)', zIndex:1000 };
const fbPanel     = { position:'fixed', bottom:'4.8rem', right:'2rem', width:'282px', background:'white', borderRadius:'12px', boxShadow:'0 8px 28px rgba(0,0,0,0.15)', zIndex:1001, border:'1px solid #e5e7eb', animation:'fadeUp 0.2s ease' };
const fbHead      = { padding:'0.62rem 0.9rem', background:'#013D83', color:'white', borderRadius:'12px 12px 0 0', display:'flex', justifyContent:'space-between', alignItems:'center' };
const spinEl      = { width:'36px', height:'36px', border:'4px solid #e5e7eb', borderTop:'4px solid #013D83', borderRadius:'50%', animation:'spin 0.8s linear infinite' };