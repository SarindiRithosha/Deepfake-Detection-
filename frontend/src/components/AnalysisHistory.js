import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FaChevronLeft, FaChevronRight, FaCheckCircle, FaExclamationTriangle,
         FaFilm, FaSearch, FaClock } from 'react-icons/fa';
import axios from 'axios';

function AnalysisHistory() {
  const { currentUser } = useAuth();
  const navigate        = useNavigate();
  const [analyses,    setAnalyses]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const [search,      setSearch]      = useState('');
  const [filter,      setFilter]      = useState('all'); // 'all' | 'FAKE' | 'REAL'
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 8;

  useEffect(() => { if (!currentUser) navigate('/login'); }, [currentUser, navigate]);

  useEffect(() => {
    if (!currentUser) return;
    fetchHistory();
  }, [currentUser]);

  const fetchHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const token    = await currentUser.getIdToken();
      const response = await axios.get(
        `http://localhost:8000/analysis-history/${currentUser.uid}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAnalyses(response.data.analyses || []);
    } catch (e) {
      console.error('Failed to fetch history:', e);
      setError('Failed to load analysis history. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) return <div>Loading…</div>;

  // Filter & search
  const filtered = analyses.filter(a => {
    const matchFilter = filter === 'all' || a.verdict === filter;
    const matchSearch = !search.trim() ||
      (a.videoName || '').toLowerCase().includes(search.toLowerCase()) ||
      (a.verdict   || '').toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const totalPages  = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const startIdx    = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentItems = filtered.slice(startIdx, startIdx + ITEMS_PER_PAGE);

  const formatDate = (ts) => {
    if (!ts) return 'N/A';
    try {
      const d = ts.toDate ? ts.toDate() : new Date(ts);
      return d.toLocaleString('en-GB', { day:'2-digit', month:'short', year:'numeric',
        hour:'2-digit', minute:'2-digit' });
    } catch { return 'N/A'; }
  };

  const stats = {
    total : analyses.length,
    fake  : analyses.filter(a => a.verdict === 'FAKE').length,
    real  : analyses.filter(a => a.verdict === 'REAL').length,
  };

  return (
    <div style={page}>
      <div style={container}>

        {/* Header */}
        <div style={header}>
          <div>
            <h1 style={title}>Analysis History</h1>
            <p style={subtitle}>A complete record of all your deepfake detection analyses.</p>
          </div>
          <button onClick={fetchHistory} style={refreshBtn}>↻ Refresh</button>
        </div>

        {/* Stats strip */}
        <div style={statsRow}>
          {[
            { label:'Total Analyses', value:stats.total, color:'#013D83', bg:'#eff6ff' },
            { label:'Deepfakes Found', value:stats.fake,  color:'#b91c1c', bg:'#fef2f2' },
            { label:'Verified Real',  value:stats.real,  color:'#15803d', bg:'#f0fdf4' },
          ].map(s=>(
            <div key={s.label} style={{...statBox,background:s.bg}}>
              <p style={{...statVal,color:s.color}}>{s.value}</p>
              <p style={statLabel}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Controls */}
        <div style={controlsRow}>
          <div style={searchWrap}>
            <FaSearch style={{color:'#9ca3af',fontSize:'0.85rem',flexShrink:0}}/>
            <input
              type="text" placeholder="Search by filename or verdict…"
              value={search} onChange={e=>{setSearch(e.target.value);setCurrentPage(1);}}
              style={searchInput}
            />
          </div>
          <div style={filterGroup}>
            {['all','FAKE','REAL'].map(f=>(
              <button key={f} onClick={()=>{setFilter(f);setCurrentPage(1);}}
                style={{...filterBtn, ...(filter===f?filterBtnActive:{})}}>
                {f==='all'?'All':f}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div style={centreBox}>
            <div style={spinner}/><p style={{color:'#013D83',fontWeight:600,marginTop:'1rem'}}>Loading…</p>
          </div>
        ) : error ? (
          <div style={centreBox}>
            <FaExclamationTriangle style={{fontSize:'2rem',color:'#ef4444',marginBottom:'1rem'}}/>
            <p style={{color:'#374151',marginBottom:'1rem'}}>{error}</p>
            <button onClick={fetchHistory} style={btnPri}>Try Again</button>
          </div>
        ) : filtered.length === 0 ? (
          <div style={centreBox}>
            <FaFilm style={{fontSize:'3rem',color:'#d1d5db',marginBottom:'1rem'}}/>
            <h3 style={{color:'#374151',marginBottom:'0.5rem'}}>
              {analyses.length===0?'No Analysis History Yet':'No Results Found'}
            </h3>
            <p style={{color:'#6b7280',marginBottom:'1.5rem',fontSize:'0.9rem'}}>
              {analyses.length===0
                ?'Start by uploading a video on the Detection page.'
                :'Try adjusting your search or filter.'}
            </p>
            {analyses.length===0&&(
              <button onClick={()=>navigate('/detect')} style={btnPri}>Go to Detection</button>
            )}
          </div>
        ) : (
          <>
            <div style={tableWrap}>
              <table style={table}>
                <thead>
                  <tr style={tHead}>
                    <th style={th}>DATE & TIME</th>
                    <th style={th}>VIDEO NAME</th>
                    <th style={th}>VERDICT</th>
                    <th style={th}>CONFIDENCE</th>
                    <th style={th}>SOURCE</th>
                    <th style={th}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map((analysis, i) => {
                    const isFake = analysis.verdict === 'FAKE';
                    return (
                      <tr key={analysis.analysisId || i} style={i%2===0?trEven:trOdd}>
                        <td style={td}>
                          <div style={{display:'flex',alignItems:'center',gap:'0.4rem'}}>
                            <FaClock style={{color:'#9ca3af',fontSize:'0.75rem',flexShrink:0}}/>
                            <span style={{fontSize:'0.82rem',color:'#374151'}}>{formatDate(analysis.analyzedAt)}</span>
                          </div>
                        </td>
                        <td style={td}>
                          <div style={{display:'flex',alignItems:'center',gap:'0.4rem'}}>
                            <FaFilm style={{color:'#9ca3af',fontSize:'0.75rem',flexShrink:0}}/>
                            <span style={{fontSize:'0.85rem',color:'#111827',fontWeight:500,
                              maxWidth:'180px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                              {analysis.videoName || 'Untitled video'}
                            </span>
                          </div>
                        </td>
                        <td style={td}>
                          <span style={{...verdict, ...(isFake?verdictFake:verdictReal)}}>
                            {isFake
                              ?<FaExclamationTriangle style={{marginRight:'4px',fontSize:'0.7rem'}}/>
                              :<FaCheckCircle style={{marginRight:'4px',fontSize:'0.7rem'}}/>}
                            {analysis.verdict}
                          </span>
                        </td>
                        <td style={td}>
                          <div style={{display:'flex',alignItems:'center',gap:'0.4rem'}}>
                            <div style={{flex:1,height:'5px',background:'#f3f4f6',borderRadius:'3px',minWidth:'60px'}}>
                              <div style={{height:'100%',borderRadius:'3px',
                                width:`${Math.round((analysis.confidenceScore||0)*100)}%`,
                                background:isFake?'#ef4444':'#22c55e'}}/>
                            </div>
                            <span style={{fontSize:'0.82rem',fontWeight:700,color:'#374151',minWidth:'36px'}}>
                              {Math.round((analysis.confidenceScore||0)*100)}%
                            </span>
                          </div>
                        </td>
                        <td style={td}>
                          <span style={sourceChip}>
                            {analysis.source==='file'?'📁 File':`🔗 ${analysis.source||'URL'}`}
                          </span>
                        </td>
                        <td style={td}>
                          <button
                            onClick={()=>navigate('/results',{state:{analysisData:{
                              prediction:analysis.verdict,
                              confidence:analysis.confidenceScore||0,
                              prob_fake:analysis.confidenceScore||0,
                              prob_real:1-(analysis.confidenceScore||0),
                              frame_analysis:[],
                              summary:`Historical analysis from ${formatDate(analysis.analyzedAt)}. Verdict: ${analysis.verdict} with ${Math.round((analysis.confidenceScore||0)*100)}% confidence.`,
                              anomalies:analysis.anomalies||[],
                              analysis_id:analysis.analysisId,
                              filename:analysis.videoName,
                              model_version:'EfficientNetB4-TemporalPooling-Exp6v3',
                              gradcam_generated:analysis.gradcamGenerated||false,
                              source:analysis.source,
                              timestamp:analysis.analyzedAt,
                            }}})}
                            style={viewBtn}>
                            View Report
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={paginRow}>
                <span style={{fontSize:'0.82rem',color:'#6b7280'}}>
                  Showing {startIdx+1}–{Math.min(startIdx+ITEMS_PER_PAGE,filtered.length)} of {filtered.length}
                </span>
                <div style={{display:'flex',gap:'0.3rem',alignItems:'center'}}>
                  <button onClick={()=>setCurrentPage(p=>Math.max(1,p-1))} disabled={currentPage===1}
                    style={{...pageBtn,opacity:currentPage===1?0.4:1}}>
                    <FaChevronLeft size={11}/>
                  </button>
                  {Array.from({length:totalPages},(_,i)=>i+1).map(p=>(
                    <button key={p} onClick={()=>setCurrentPage(p)}
                      style={{...pageBtn,...(p===currentPage?pageBtnActive:{})}}>
                      {p}
                    </button>
                  ))}
                  <button onClick={()=>setCurrentPage(p=>Math.min(totalPages,p+1))} disabled={currentPage===totalPages}
                    style={{...pageBtn,opacity:currentPage===totalPages?0.4:1}}>
                    <FaChevronRight size={11}/>
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

const page       = { background:'#f0f2f5', minHeight:'100vh', padding:'2rem 1.25rem', fontFamily:"'Segoe UI',sans-serif" };
const container  = { maxWidth:'1200px', margin:'0 auto', background:'white', borderRadius:'14px', padding:'2rem', boxShadow:'0 2px 12px rgba(0,0,0,0.07)' };
const header     = { display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'1.5rem', flexWrap:'wrap', gap:'1rem' };
const title      = { color:'#013D83', fontWeight:800, fontSize:'2rem', margin:'0 0 0.3rem' };
const subtitle   = { color:'#6b7280', fontSize:'0.9rem', margin:0 };
const refreshBtn = { padding:'0.5rem 1rem', background:'#eff6ff', color:'#013D83', border:'1px solid #bfdbfe', borderRadius:'8px', cursor:'pointer', fontWeight:600, fontSize:'0.85rem' };
const statsRow   = { display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'1rem', marginBottom:'1.5rem' };
const statBox    = { borderRadius:'10px', padding:'1rem 1.25rem' };
const statVal    = { margin:'0 0 0.2rem', fontSize:'1.8rem', fontWeight:800 };
const statLabel  = { margin:0, fontSize:'0.78rem', color:'#6b7280', fontWeight:500 };
const controlsRow= { display:'flex', gap:'1rem', marginBottom:'1.25rem', flexWrap:'wrap', alignItems:'center' };
const searchWrap = { flex:'1 1 220px', display:'flex', alignItems:'center', gap:'0.5rem', border:'1px solid #e5e7eb', borderRadius:'8px', padding:'0.45rem 0.75rem', background:'#f9fafb' };
const searchInput= { flex:1, border:'none', background:'none', outline:'none', fontSize:'0.85rem', color:'#374151' };
const filterGroup= { display:'flex', gap:'0.3rem' };
const filterBtn  = { padding:'0.4rem 0.9rem', border:'1px solid #e5e7eb', borderRadius:'20px', background:'white', color:'#6b7280', cursor:'pointer', fontSize:'0.82rem', fontWeight:500 };
const filterBtnActive = { background:'#013D83', color:'white', border:'1px solid #013D83' };
const tableWrap  = { overflowX:'auto', border:'1px solid #f3f4f6', borderRadius:'10px' };
const table      = { width:'100%', borderCollapse:'collapse' };
const tHead      = { background:'#f8fafc' };
const th         = { color:'#374151', fontWeight:700, padding:'0.85rem 1rem', textAlign:'left', fontSize:'0.75rem', textTransform:'uppercase', letterSpacing:'0.05em', borderBottom:'1px solid #e5e7eb' };
const trEven     = { background:'white' };
const trOdd      = { background:'#fafafa' };
const td         = { padding:'0.85rem 1rem', borderBottom:'1px solid #f3f4f6' };
const verdict    = { display:'inline-flex', alignItems:'center', padding:'0.25rem 0.7rem', borderRadius:'20px', fontSize:'0.78rem', fontWeight:700 };
const verdictFake= { background:'#fef2f2', color:'#b91c1c' };
const verdictReal= { background:'#f0fdf4', color:'#15803d' };
const sourceChip = { fontSize:'0.75rem', padding:'0.2rem 0.6rem', borderRadius:'20px', background:'#f3f4f6', color:'#374151' };
const viewBtn    = { padding:'0.4rem 0.9rem', background:'#013D83', color:'white', border:'none', borderRadius:'6px', cursor:'pointer', fontSize:'0.8rem', fontWeight:600 };
const paginRow   = { display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:'1.25rem', flexWrap:'wrap', gap:'0.75rem' };
const pageBtn    = { width:'32px', height:'32px', border:'1px solid #e5e7eb', borderRadius:'6px', background:'white', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.82rem', color:'#374151' };
const pageBtnActive = { background:'#013D83', color:'white', border:'1px solid #013D83' };
const centreBox  = { display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'4rem 2rem', textAlign:'center' };
const btnPri     = { padding:'0.65rem 1.5rem', background:'#013D83', color:'white', border:'none', borderRadius:'8px', fontWeight:700, cursor:'pointer', fontSize:'0.88rem' };
const spinner    = { width:'36px', height:'36px', border:'4px solid #e5e7eb', borderTop:'4px solid #013D83', borderRadius:'50%', animation:'spin 0.8s linear infinite' };

export { AnalysisHistory as default };