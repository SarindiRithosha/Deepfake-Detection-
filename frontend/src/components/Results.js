import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaComment, FaPaperPlane, FaTimes, FaStar, FaCheckCircle,
         FaExclamationTriangle, FaBrain, FaClock, FaFilm, FaDownload } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import jsPDF from 'jspdf';

const THRESHOLD_DISPLAY = 0.758;

function Results() {
  const location  = useLocation();
  const navigate  = useNavigate();
  const { currentUser, userProfile } = useAuth();

  const [analysisData,  setAnalysisData]  = useState(null);
  const [selectedFrame, setSelectedFrame] = useState(0);
  const [showHeatmap,   setShowHeatmap]   = useState(false);
  const [loading,       setLoading]       = useState(true);
  const [videoUrl,      setVideoUrl]      = useState(null);
  const [videoSource,   setVideoSource]   = useState(null);
  const [showFeedback,  setShowFeedback]  = useState(false);
  const [feedback,      setFeedback]      = useState('');
  const [rating,        setRating]        = useState(0);
  const [isSubmitting,  setIsSubmitting]  = useState(false);
  const [submitStatus,  setSubmitStatus]  = useState(null);
  const [videoError,    setVideoError]    = useState(false);
  const [pdfLoading,    setPdfLoading]    = useState(false);

  const videoRef    = useRef(null);
  const feedbackRef = useRef(null);

  const cleanupVideoUrl = useCallback(() => { if (videoUrl) URL.revokeObjectURL(videoUrl); }, []);

  useEffect(() => {
    const h = (e) => {
      if (feedbackRef.current && !feedbackRef.current.contains(e.target) && !e.target.closest('.fab-feedback'))
        setShowFeedback(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  useEffect(() => {
    if (location.state?.analysisData) {
      setAnalysisData(location.state.analysisData);
      const file = location.state.uploadedFile;
      if (file instanceof File || (file?.name && file?.type)) {
        try { setVideoUrl(URL.createObjectURL(file)); setVideoSource('file'); }
        catch { setVideoSource('none'); setVideoError(true); }
      } else { setVideoSource('url'); }
      setLoading(false);
    } else {
      setAnalysisData({ prediction:'FAKE', confidence:0.87, prob_fake:0.87, prob_real:0.13,
        frame_analysis:[], summary:'Demo data loaded.', anomalies:['Demo anomaly'],
        analysis_id:'DEMO_001', filename:'demo.mp4',
        model_version:'EfficientNetB4-TemporalPooling-Exp6v3', gradcam_generated:false });
      setVideoSource('none'); setLoading(false);
    }
  }, [location]);

  useEffect(() => () => cleanupVideoUrl(), [cleanupVideoUrl]);

  const getUserInfo = () => currentUser && userProfile
    ? { user_name: userProfile.name||'User', user_email: currentUser.email||'', user_id: currentUser.uid, is_logged_in:true }
    : { user_name:'Anonymous', user_email:'', user_id:null, is_logged_in:false };

  /* ── PDF ── */
  const handleDownloadReport = async () => {
    if (!analysisData) return;
    setPdfLoading(true);
    try {
      const pdf    = new jsPDF('p','mm','a4');
      const W      = 210;
      const isFake = analysisData.prediction === 'FAKE';
      const conf   = Math.round(analysisData.confidence * 100);

      pdf.setFillColor(1,61,131); pdf.rect(0,0,W,45,'F');
      pdf.setFont('helvetica','bold'); pdf.setFontSize(24); pdf.setTextColor(255,255,255);
      pdf.text('VERITY-X',15,20);
      pdf.setFontSize(10); pdf.setFont('helvetica','normal');
      pdf.text('AI-Powered Deepfake Detection',15,28);
      pdf.text('CONFIDENTIAL ANALYSIS REPORT',15,36);
      pdf.setFontSize(9);
      pdf.text(`Report Date: ${new Date().toLocaleDateString('en-GB',{day:'2-digit',month:'long',year:'numeric'})}`,W-15,20,{align:'right'});
      pdf.text(`Analysis ID: ${analysisData.analysis_id||'N/A'}`,W-15,28,{align:'right'});

      pdf.setFillColor(...(isFake?[220,53,69]:[40,167,69]));
      pdf.rect(0,45,W,28,'F');
      pdf.setTextColor(255,255,255); pdf.setFont('helvetica','bold'); pdf.setFontSize(20);
      pdf.text(`VERDICT: ${analysisData.prediction}`,W/2,58,{align:'center'});
      pdf.setFontSize(11);
      pdf.text(`Confidence: ${conf}%  |  Fake: ${(analysisData.prob_fake*100).toFixed(1)}%  |  Real: ${(analysisData.prob_real*100).toFixed(1)}%`,W/2,67,{align:'center'});

      let y = 85;
      const section = (title) => {
        pdf.setFillColor(240,244,248); pdf.rect(10,y-5,W-20,10,'F');
        pdf.setFont('helvetica','bold'); pdf.setFontSize(11); pdf.setTextColor(1,61,131);
        pdf.text(title,16,y+1); y+=10;
        pdf.setTextColor(50,50,50); pdf.setFont('helvetica','normal'); pdf.setFontSize(9.5);
      };

      section('VIDEO INFORMATION');
      const row = (lbl,val,lbl2,val2) => {
        pdf.setFont('helvetica','bold'); pdf.text(lbl+':',15,y);
        pdf.setFont('helvetica','normal'); pdf.text(String(val||'N/A'),55,y);
        if(lbl2){ pdf.setFont('helvetica','bold'); pdf.text(lbl2+':',110,y);
          pdf.setFont('helvetica','normal'); pdf.text(String(val2||'N/A'),160,y); }
        y+=7;
      };
      row('Filename',analysisData.filename,'Frames',analysisData.frame_count||analysisData.frame_analysis?.length||16);
      row('Source',analysisData.source||'File','Time',analysisData.analysis_time||'N/A');
      row('Timestamp',analysisData.timestamp?new Date(analysisData.timestamp).toLocaleString():'N/A'); y+=5;

      section('MODEL INFORMATION');
      row('Model',analysisData.model_version||'EfficientNetB4-TemporalPooling-Exp6v3');
      row('Accuracy','85.84%','AUC-ROC','0.9307');
      row('EER','14.61%','Threshold','0.758');
      row('Grad-CAM',analysisData.gradcam_generated?'Generated (FAKE)':'Not generated (REAL)'); y+=5;

      section('ANALYSIS SUMMARY');
      const sLines = pdf.splitTextToSize(analysisData.summary||'No summary.',W-30);
      pdf.text(sLines,15,y); y+=sLines.length*6+8;

      if(isFake && analysisData.anomalies?.length>0){
        section('DETECTED ANOMALIES');
        analysisData.anomalies.forEach(a=>{
          if(y>265){pdf.addPage();y=20;}
          pdf.setFillColor(255,235,235); pdf.rect(13,y-4,W-26,7,'F');
          pdf.setTextColor(180,30,30); pdf.text('▶',15,y);
          pdf.setTextColor(50,50,50); pdf.text(a,22,y); y+=9;
        }); y+=4;
      }

      if(analysisData.frame_analysis?.length>0){
        if(y>220){pdf.addPage();y=20;}
        section('FRAME SCORES');
        pdf.setFontSize(8.5);
        const cols=4, colW=(W-30)/cols;
        analysisData.frame_analysis.forEach((fr,i)=>{
          const c=i%cols, r=Math.floor(i/cols), fx=15+c*colW, fy=y+r*10;
          if(fy>270)return;
          const hi=fr.suspicious_score>=THRESHOLD_DISPLAY;
          pdf.setFillColor(hi?255:235,hi?235:255,hi?235:235); pdf.rect(fx,fy-4,colW-2,8,'F');
          pdf.setTextColor(hi?180:40,hi?30:130,hi?30:40);
          pdf.text(`F${i+1} @ ${fr.timestamp||'0:00'}`,fx+2,fy);
          pdf.text(`${Math.round(fr.suspicious_score*100)}%${hi?' ⚠':' ✓'}`,fx+colW-4,fy,{align:'right'});
        });
        y+=Math.ceil(analysisData.frame_analysis.length/cols)*10+8;
      }

      const totalPages = pdf.internal.getNumberOfPages();
      for(let p=1;p<=totalPages;p++){
        pdf.setPage(p);
        pdf.setFillColor(240,244,248); pdf.rect(0,285,W,12,'F');
        pdf.setFontSize(8); pdf.setTextColor(100,100,100);
        pdf.text('© 2025 Verity-X — AI-Powered Deepfake Detection System',15,292);
        pdf.text(`Page ${p} of ${totalPages}`,W-15,292,{align:'right'});
        pdf.setDrawColor(1,61,131); pdf.setLineWidth(0.3); pdf.line(0,285,W,285);
      }
      pdf.save(`verityx_analysis_${analysisData.analysis_id||Date.now()}.pdf`);
    } catch(e){ console.error('PDF error:',e); } finally { setPdfLoading(false); }
  };

  /* ── Feedback ── */
  const handleFeedbackSubmit = async () => {
    if(!feedback.trim()&&rating===0){setSubmitStatus('Please add a rating or comment.');return;}
    setIsSubmitting(true); setSubmitStatus(null);
    try {
      const ui = getUserInfo();
      await axios.post('http://localhost:8000/submit-feedback',{
        feedback:feedback.trim(),rating,
        analysis_id:analysisData?.analysis_id||'unknown',
        prediction:analysisData?.prediction||'unknown',
        confidence:analysisData?.confidence||0,
        source:videoSource,timestamp:new Date().toISOString(),...ui});
      setSubmitStatus('success'); setFeedback(''); setRating(0);
      setTimeout(()=>{setShowFeedback(false);setSubmitStatus(null);},1800);
    } catch { setSubmitStatus('error'); } finally { setIsSubmitting(false); }
  };

  /* ── Video ── */
  const renderVideo = () => {
    if(videoSource==='file'&&videoUrl) return(
      <div style={vidWrap}>
        <video ref={videoRef} controls style={vidEl} src={videoUrl}
          onError={()=>setVideoError(true)} onLoadedData={()=>{}} preload="metadata" key={videoUrl}/>
        {videoError&&<div style={vidOverlay}><p>Unable to play video</p></div>}
      </div>
    );
    if(videoSource==='url'&&analysisData?.original_url) return(
      <div style={vidWrap}>
        <div style={urlBanner}>
          <span style={{fontWeight:600,fontSize:'0.75rem',color:'#013D83'}}>🔗 {analysisData.source_name||'URL'}</span>
          <a href={analysisData.original_url} target="_blank" rel="noopener noreferrer"
            style={{fontSize:'0.75rem',color:'#2563eb',textDecoration:'none',wordBreak:'break-all'}}>
            {analysisData.original_url.length>55?analysisData.original_url.slice(0,55)+'…':analysisData.original_url}
          </a>
        </div>
        <video controls style={vidEl} onError={()=>setVideoError(true)} preload="metadata">
          <source src={`http://localhost:8000/video/${analysisData.analysis_id}`} type="video/mp4"/>
        </video>
      </div>
    );
    return(
      <div style={{background:'#f9fafb',borderRadius:'8px',aspectRatio:'16/9',display:'flex',
        flexDirection:'column',alignItems:'center',justifyContent:'center',border:'2px dashed #e5e7eb',color:'#9ca3af'}}>
        <FaFilm style={{fontSize:'2rem',opacity:0.4,marginBottom:'0.5rem'}}/>
        <p style={{margin:0,fontSize:'0.85rem'}}>No video available</p>
      </div>
    );
  };

  if(loading) return(
    <div style={page}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'60vh',flexDirection:'column',gap:'1rem'}}>
        <div style={spinner}/><p style={{color:'#013D83',fontWeight:600}}>Loading results…</p>
      </div>
    </div>
  );
  if(!analysisData) return(
    <div style={page}>
      <div style={{textAlign:'center',padding:'4rem'}}>
        <h2>No analysis data found</h2>
        <button onClick={()=>navigate('/detect')} style={btnPri}>Analyse a Video</button>
      </div>
    </div>
  );

  const isFake       = analysisData.prediction==='FAKE';
  const hasFrames    = analysisData.frame_analysis?.length>0;
  const gradcamAvail = isFake&&analysisData.gradcam_generated;
  const conf         = Math.round(analysisData.confidence*100);

  return(
    <div style={page}>
      {/* FAB feedback */}
      <button className="fab-feedback" onClick={()=>setShowFeedback(!showFeedback)} style={fab}>
        <FaComment size={17}/>
      </button>

      {/* Feedback panel */}
      {showFeedback&&(
        <div ref={feedbackRef} style={fbPanel}>
          <div style={fbHead}>
            <span style={{fontWeight:700,fontSize:'0.95rem'}}>Share Feedback</span>
            <button onClick={()=>setShowFeedback(false)} style={{background:'none',border:'none',color:'white',cursor:'pointer',display:'flex'}}>
              <FaTimes size={13}/>
            </button>
          </div>
          <div style={{padding:'1rem'}}>
            <p style={{margin:'0 0 0.6rem',fontSize:'0.8rem',color:'#666'}}>
              {getUserInfo().is_logged_in?`✓ As ${getUserInfo().user_name}`:'As Anonymous'}
            </p>
            <div style={{display:'flex',gap:'4px',marginBottom:'0.75rem'}}>
              {[1,2,3,4,5].map(s=>(
                <FaStar key={s} onClick={()=>setRating(s)}
                  style={{cursor:'pointer',fontSize:'1.3rem',color:s<=rating?'#FFD700':'#ddd'}}/>
              ))}
            </div>
            <textarea value={feedback} onChange={e=>setFeedback(e.target.value)}
              placeholder="Your thoughts on Verity-X…"
              style={{width:'100%',padding:'0.6rem',border:'1px solid #e0e0e0',borderRadius:'6px',
                fontSize:'0.83rem',resize:'vertical',minHeight:'70px',fontFamily:'inherit',boxSizing:'border-box'}}/>
            {submitStatus&&(
              <p style={{fontSize:'0.78rem',margin:'0.4rem 0',
                color:submitStatus==='success'?'#16a34a':submitStatus==='error'?'#dc2626':'#666'}}>
                {submitStatus==='success'?'✓ Thank you!':submitStatus==='error'?'Failed. Try again.':submitStatus}
              </p>
            )}
            <button onClick={handleFeedbackSubmit} disabled={isSubmitting}
              style={{...btnPri,width:'100%',padding:'0.55rem',fontSize:'0.82rem',justifyContent:'center'}}>
              <FaPaperPlane size={11} style={{marginRight:'5px'}}/>
              {isSubmitting?'Sending…':'Send Feedback'}
            </button>
          </div>
        </div>
      )}

      <div style={wrap}>
        {/* ── HERO ── */}
        <div style={{...hero,background:isFake
          ?'linear-gradient(135deg,#1a0505 0%,#2d0a0a 60%,#1a0505 100%)'
          :'linear-gradient(135deg,#051a0a 0%,#0a2d14 60%,#051a0a 100%)'}}>

          <div style={heroRow}>
            <div style={{display:'flex',alignItems:'center',gap:'1.2rem',flex:'1 1 280px'}}>
              <div style={verdictIcon}>
                {isFake?<FaExclamationTriangle style={{color:'#f87171',fontSize:'2.2rem'}}/>
                       :<FaCheckCircle style={{color:'#4ade80',fontSize:'2.2rem'}}/>}
              </div>
              <div>
                <p style={{margin:'0 0 0.2rem',fontSize:'0.65rem',letterSpacing:'0.15em',color:'rgba(255,255,255,0.45)',textTransform:'uppercase'}}>
                  ANALYSIS VERDICT
                </p>
                <h1 style={{margin:'0 0 0.2rem',fontSize:'2.4rem',fontWeight:800,letterSpacing:'-0.02em',
                  color:isFake?'#f87171':'#4ade80'}}>{analysisData.prediction}</h1>
                <p style={{margin:0,fontSize:'0.85rem',color:'rgba(255,255,255,0.5)'}}>
                  {isFake?'This video shows signs of synthetic manipulation.'
                         :'No manipulation detected. Video appears authentic.'}
                </p>
              </div>
            </div>

            <div style={{display:'flex',gap:'0.75rem',flexWrap:'wrap',justifyContent:'flex-end'}}>
              {[['Confidence',conf+'%'],['Fake Score',(analysisData.prob_fake*100).toFixed(1)+'%'],
                ['Real Score',(analysisData.prob_real*100).toFixed(1)+'%'],['Threshold','75.8%']].map(([l,v])=>(
                <div key={l} style={metricBox}>
                  <p style={{margin:'0 0 0.2rem',fontSize:'0.62rem',color:'rgba(255,255,255,0.45)',textTransform:'uppercase',letterSpacing:'0.08em'}}>{l}</p>
                  <p style={{margin:0,fontSize:'1.3rem',fontWeight:700,color:'white'}}>{v}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Progress bar */}
          <div style={{borderTop:'1px solid rgba(255,255,255,0.1)',paddingTop:'1rem'}}>
            <div style={{height:'5px',background:'rgba(255,255,255,0.1)',borderRadius:'3px',position:'relative',marginBottom:'0.4rem'}}>
              <div style={{position:'absolute',left:0,top:0,height:'100%',borderRadius:'3px',
                width:`${analysisData.prob_fake*100}%`,
                background:isFake?'linear-gradient(90deg,#f87171,#fb923c)':'linear-gradient(90deg,#4ade80,#22c55e)',
                transition:'width 0.8s ease'}}/>
              <div style={{position:'absolute',top:'-4px',left:'75.8%',width:'2px',height:'13px',
                background:'rgba(255,255,255,0.6)',borderRadius:'1px'}}/>
            </div>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:'0.68rem',color:'rgba(255,255,255,0.35)'}}>
              <span>0% (REAL)</span><span>▲ threshold (75.8%)</span><span>100% (FAKE)</span>
            </div>
          </div>
        </div>

        {/* ── GRID ── */}
        <div style={grid}>
          {/* Left */}
          <div style={{display:'flex',flexDirection:'column',gap:'1.25rem'}}>

            <div style={card}>
              <div style={cardHead}><FaFilm style={cardIcon}/><h3 style={cardTitle}>Analysed Video</h3></div>
              {renderVideo()}
              <div style={{display:'flex',gap:'0.4rem',flexWrap:'wrap',marginTop:'0.6rem'}}>
                <span style={chip}>{analysisData.filename||'video'}</span>
                {analysisData.source&&analysisData.source!=='file'&&(
                  <span style={{...chip,background:'#e0f2fe',color:'#0369a1'}}>{analysisData.source_name||analysisData.source}</span>
                )}
              </div>
            </div>

            <div style={card}>
              <div style={cardHead}><FaBrain style={cardIcon}/><h3 style={cardTitle}>Analysis Summary</h3></div>
              <p style={{color:'#4b5563',lineHeight:1.7,fontSize:'0.875rem',margin:0}}>{analysisData.summary}</p>
              {isFake&&analysisData.anomalies?.length>0&&(
                <div style={{marginTop:'1rem'}}>
                  <p style={{fontSize:'0.72rem',fontWeight:700,color:'#b91c1c',textTransform:'uppercase',letterSpacing:'0.06em',margin:'0 0 0.5rem'}}>
                    DETECTED ANOMALIES
                  </p>
                  {analysisData.anomalies.map((a,i)=>(
                    <div key={i} style={{display:'flex',alignItems:'flex-start',gap:'0.5rem',marginBottom:'0.35rem'}}>
                      <span style={{width:'6px',height:'6px',borderRadius:'50%',background:'#ef4444',flexShrink:0,marginTop:'0.35rem'}}/>
                      <span style={{fontSize:'0.85rem',color:'#374151'}}>{a}</span>
                    </div>
                  ))}
                </div>
              )}
              <div style={{display:'flex',flexWrap:'wrap',gap:'0.35rem',marginTop:'1rem',paddingTop:'1rem',borderTop:'1px solid #f3f4f6'}}>
                {[analysisData.model_version||'EfficientNetB4-Exp6v3','Acc: 85.84%','AUC: 0.9307',
                  ...(gradcamAvail?['Grad-CAM ✓']:[])].map(t=>(
                  <span key={t} style={{...chip,background:t.includes('Grad')?'#fef2f2':undefined,
                    color:t.includes('Grad')?'#b91c1c':undefined}}>{t}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Right */}
          <div style={{display:'flex',flexDirection:'column',gap:'1.25rem'}}>

            {hasFrames&&(
              <div style={card}>
                <div style={cardHead}><FaCheckCircle style={cardIcon}/><h3 style={cardTitle}>Frame-by-Frame Analysis</h3></div>

                <div style={{display:'grid',gridTemplateColumns:'repeat(8,1fr)',gap:'4px',marginBottom:'1rem'}}>
                  {analysisData.frame_analysis.map((fr,i)=>{
                    const hi=fr.suspicious_score>=THRESHOLD_DISPLAY;
                    return(
                      <button key={i} onClick={()=>setSelectedFrame(i)} style={{
                        position:'relative',borderRadius:'5px',overflow:'hidden',cursor:'pointer',
                        background:'none',border:'none',padding:0,aspectRatio:'1',
                        outline:selectedFrame===i?'2px solid #013D83':hi?'2px solid #ef4444':'2px solid transparent'}}>
                        <img src={fr.original_frame} alt={`F${i+1}`} style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}}/>
                        <div style={{position:'absolute',bottom:0,left:0,right:0,padding:'2px',
                          background:'rgba(0,0,0,0.65)',color:'white',fontSize:'0.55rem',textAlign:'center'}}>
                          {fr.timestamp||`F${i+1}`}
                        </div>
                        <div style={{position:'absolute',top:'3px',right:'3px',color:'white',fontSize:'0.5rem',
                          fontWeight:700,padding:'1px 3px',borderRadius:'3px',
                          background:hi?'#ef4444cc':'#22c55ecc'}}>
                          {Math.round(fr.suspicious_score*100)}%
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div style={{background:'#f9fafb',borderRadius:'8px',overflow:'hidden'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',
                    padding:'0.55rem 0.75rem',borderBottom:'1px solid #e5e7eb'}}>
                    <span style={{fontSize:'0.78rem',color:'#374151',fontWeight:600}}>
                      Frame {analysisData.frame_analysis[selectedFrame]?.frame_number} @ {analysisData.frame_analysis[selectedFrame]?.timestamp}
                    </span>
                    <div style={{display:'flex',alignItems:'center',gap:'0.6rem'}}>
                      <span style={{fontSize:'0.78rem',fontWeight:700,
                        color:analysisData.frame_analysis[selectedFrame]?.suspicious_score>=THRESHOLD_DISPLAY?'#ef4444':'#22c55e'}}>
                        Score: {Math.round((analysisData.frame_analysis[selectedFrame]?.suspicious_score||0)*100)}%
                      </span>
                      {gradcamAvail&&(
                        <button onClick={()=>setShowHeatmap(!showHeatmap)} style={{
                          fontSize:'0.7rem',padding:'0.25rem 0.65rem',borderRadius:'20px',
                          background:'#013D83',color:'white',border:'none',cursor:'pointer',fontWeight:600}}>
                          {showHeatmap?'Hide Grad-CAM':'Show Grad-CAM'}
                        </button>
                      )}
                    </div>
                  </div>
                  <div style={{position:'relative',aspectRatio:'16/9'}}>
                    <img src={analysisData.frame_analysis[selectedFrame]?.original_frame}
                      alt="Selected" style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}}/>
                    {showHeatmap&&gradcamAvail&&analysisData.frame_analysis[selectedFrame]?.heatmap&&(
                      <img src={analysisData.frame_analysis[selectedFrame].heatmap}
                        alt="Grad-CAM" style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover',opacity:0.65}}/>
                    )}
                  </div>
                  <p style={{margin:0,padding:'0.45rem 0.75rem',fontSize:'0.72rem',color:'#6b7280',borderTop:'1px solid #e5e7eb'}}>
                    {isFake&&gradcamAvail
                      ?'🔴 Red/yellow areas indicate regions the model found suspicious.'
                      :isFake?'Grad-CAM unavailable for this video.'
                      :'Grad-CAM is only generated for FAKE predictions.'}
                  </p>
                </div>
              </div>
            )}

            <div style={card}>
              <div style={cardHead}><FaClock style={cardIcon}/><h3 style={cardTitle}>Analysis Details</h3></div>
              <div>
                {[['Analysis ID',analysisData.analysis_id||'N/A'],['File',analysisData.filename||'N/A'],
                  ['Frames',String(analysisData.frame_count||analysisData.frame_analysis?.length||16)],
                  ['Processing',analysisData.analysis_time||'N/A'],
                  ['Model','EfficientNetB4 + Temporal Pooling'],['Threshold','0.758 (optimal)'],
                  ['Grad-CAM',gradcamAvail?'Generated':'Not generated'],
                  ['Time',analysisData.timestamp?new Date(analysisData.timestamp).toLocaleString():'N/A'],
                ].map(([l,v])=>(
                  <div key={l} style={{display:'flex',padding:'0.45rem 0',borderBottom:'1px solid #f3f4f6',gap:'1rem'}}>
                    <span style={{fontSize:'0.78rem',color:'#9ca3af',fontWeight:600,minWidth:'115px',flexShrink:0}}>{l}</span>
                    <span style={{fontSize:'0.78rem',color:'#374151',wordBreak:'break-all'}}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div style={{display:'flex',justifyContent:'center',gap:'1rem',marginTop:'2rem',flexWrap:'wrap'}}>
          <button onClick={()=>navigate('/detect')} style={btnSec}>← Analyse Another Video</button>
          <button onClick={handleDownloadReport} disabled={pdfLoading} style={{...btnPri,gap:'6px'}}>
            <FaDownload size={12}/>{pdfLoading?'Generating…':'Download PDF Report'}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @media(max-width:900px){.results-grid{grid-template-columns:1fr!important}}
      `}</style>
    </div>
  );
}

/* styles */
const page    = {background:'#f0f2f5',minHeight:'100vh',fontFamily:"'Segoe UI',sans-serif"};
const wrap    = {maxWidth:'1280px',margin:'0 auto',padding:'0 1.25rem 3rem'};
const hero    = {borderRadius:'0 0 14px 14px',padding:'2.2rem 1.75rem 1.4rem',marginBottom:'1.75rem',animation:'fadeUp 0.45s ease'};
const heroRow = {display:'flex',flexWrap:'wrap',gap:'1.75rem',alignItems:'center',marginBottom:'1.25rem'};
const verdictIcon={width:'58px',height:'58px',borderRadius:'50%',background:'rgba(255,255,255,0.1)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0};
const metricBox={background:'rgba(255,255,255,0.08)',borderRadius:'10px',padding:'0.65rem 1.1rem',textAlign:'center',minWidth:'75px',backdropFilter:'blur(4px)'};
const grid    = {display:'grid',gridTemplateColumns:'1fr 1.15fr',gap:'1.25rem',alignItems:'start'};
const card    = {background:'white',borderRadius:'12px',padding:'1.4rem',boxShadow:'0 1px 4px rgba(0,0,0,0.07)',animation:'fadeUp 0.4s ease'};
const cardHead= {display:'flex',alignItems:'center',gap:'0.55rem',marginBottom:'1.1rem'};
const cardIcon= {color:'#013D83',fontSize:'0.95rem'};
const cardTitle={margin:0,fontSize:'0.95rem',fontWeight:700,color:'#111827'};
const chip    = {fontSize:'0.7rem',padding:'0.18rem 0.55rem',borderRadius:'20px',background:'#eff6ff',color:'#1d4ed8',fontWeight:600};
const vidWrap = {borderRadius:'8px',overflow:'hidden',background:'#000',aspectRatio:'16/9',position:'relative'};
const vidEl   = {width:'100%',height:'100%',display:'block'};
const vidOverlay={position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(0,0,0,0.7)',color:'white',fontSize:'0.9rem'};
const urlBanner={padding:'0.4rem 0.7rem',background:'#f0f4ff',borderBottom:'1px solid #dbeafe',display:'flex',flexWrap:'wrap',gap:'0.4rem',alignItems:'center'};
const btnPri  = {padding:'0.7rem 1.6rem',background:'#013D83',color:'white',border:'none',borderRadius:'8px',fontWeight:700,cursor:'pointer',fontSize:'0.88rem',display:'flex',alignItems:'center'};
const btnSec  = {padding:'0.7rem 1.6rem',background:'white',color:'#013D83',border:'2px solid #013D83',borderRadius:'8px',fontWeight:700,cursor:'pointer',fontSize:'0.88rem'};
const fab     = {position:'fixed',bottom:'2rem',right:'2rem',width:'50px',height:'50px',borderRadius:'50%',background:'#013D83',color:'white',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 4px 16px rgba(1,61,131,0.4)',zIndex:1000};
const fbPanel = {position:'fixed',bottom:'5.2rem',right:'2rem',width:'300px',background:'white',borderRadius:'12px',boxShadow:'0 8px 28px rgba(0,0,0,0.16)',zIndex:1001,border:'1px solid #e5e7eb',animation:'fadeUp 0.2s ease'};
const fbHead  = {padding:'0.7rem 1rem',background:'#013D83',color:'white',borderRadius:'12px 12px 0 0',display:'flex',justifyContent:'space-between',alignItems:'center'};
const spinner = {width:'38px',height:'38px',border:'4px solid #e5e7eb',borderTop:'4px solid #013D83',borderRadius:'50%',animation:'spin 0.8s linear infinite'};

export default Results;