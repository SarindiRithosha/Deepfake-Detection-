import React, { useState, useEffect, useCallback } from 'react';
import {
  FaBell, FaChartLine, FaUsers, FaChartBar, FaUserFriends,
  FaBullseye, FaArrowUp, FaArrowDown, FaMinus, FaUserCircle,
  FaComments, FaEnvelope, FaCircle, FaSearch, FaSync,
  FaShieldAlt, FaStar, FaVideo, FaExclamationTriangle,
  FaCheckCircle, FaDatabase
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const API = process.env.REACT_APP_API_URL;

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeNav,        setActiveNav]        = useState('dashboard');
  const [showUserDrop,     setShowUserDrop]      = useState(false);
  const [showNotifs,       setShowNotifs]        = useState(false);
  const [adminUser,        setAdminUser]         = useState(null);
  const [isLoading,        setIsLoading]         = useState(true);
  const [stats,            setStats]             = useState(null);
  const [systemStats,      setSystemStats]       = useState(null);
  const [notifications,    setNotifications]     = useState([]);
  const [unreadCount,      setUnreadCount]       = useState(0);
  const [lastUpdated,      setLastUpdated]       = useState(null);

  const token = () => localStorage.getItem('adminToken');

  const fetchNotifications = useCallback(async () => {
    try {
      const r = await fetch(`${API}/admin/notifications`, { headers: { Authorization: `Bearer ${token()}` } });
      if (r.ok) {
        const d = await r.json();
        setNotifications(d.notifications || []);
        setUnreadCount(d.unread_count || 0);
      }
    } catch {}
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const r = await fetch(`${API}/admin/dashboard-stats`, { headers: { Authorization: `Bearer ${token()}` } });
      if (r.ok) {
        const d = await r.json();
        setStats(d);
        setLastUpdated(new Date());
      }
    } catch (e) { console.error('Failed to fetch stats:', e); }
  }, []);

  const fetchSystemStats = useCallback(async () => {
    try {
      const r = await fetch(`${API}/admin/system-stats`, { headers: { Authorization: `Bearer ${token()}` } });
      if (r.ok) setSystemStats(await r.json());
    } catch {}
  }, []);

  useEffect(() => {
    const init = async () => {
      const tk = token();
      const stored = localStorage.getItem('adminUser');
      if (!tk || !stored) { navigate('/login'); return; }
      try {
        const r = await fetch(`${API}/auth/admin/verify?token=${tk}`);
        if (r.ok) {
          setAdminUser(JSON.parse(stored));
          await Promise.all([fetchStats(), fetchNotifications(), fetchSystemStats()]);
        } else {
          localStorage.removeItem('adminToken');
          localStorage.removeItem('adminUser');
          navigate('/login');
        }
      } catch {
        navigate('/login');
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, [navigate, fetchStats, fetchNotifications, fetchSystemStats]);

  useEffect(() => {
    if (!adminUser) return;
    const interval = setInterval(() => {
      fetchStats();
      fetchNotifications();
    }, 30000);
    return () => clearInterval(interval);
  }, [adminUser, fetchStats, fetchNotifications]);

  // Close dropdowns on outside click
  useEffect(() => {
    const h = (e) => {
      if (!e.target.closest('.notif-container') && !e.target.closest('.notif-bell')) setShowNotifs(false);
      if (!e.target.closest('.user-dropdown')) setShowUserDrop(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const handleLogout = async () => {
    try {
      await fetch(`${API}/auth/admin-logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: token() }),
      });
    } catch {}
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    navigate('/login');
  };

  const markNotifsRead = async () => {
    try {
      await fetch(`${API}/admin/notifications/mark-read`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      setUnreadCount(0);
      setNotifications(n => n.map(x => ({ ...x, read: true })));
    } catch {}
  };

  const timeAgo = (ts) => {
    if (!ts) return '';
    const s = Math.floor((Date.now() - new Date(ts)) / 1000);
    if (s < 60) return 'Just now';
    if (s < 3600) return `${Math.floor(s/60)}m ago`;
    if (s < 86400) return `${Math.floor(s/3600)}h ago`;
    return `${Math.floor(s/86400)}d ago`;
  };

  if (isLoading) return (
    <div style={layout}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh'}}>
        <div style={spinnerSt}/>
      </div>
    </div>
  );
  if (!adminUser) return null;

  const trendIcon = (t) => t==='up'
    ? <FaArrowUp style={{color:'#22c55e',fontSize:'11px'}}/>
    : t==='down'
    ? <FaArrowDown style={{color:'#ef4444',fontSize:'11px'}}/>
    : <FaMinus style={{color:'#f59e0b',fontSize:'11px'}}/>;

  const trendColor = (t) => t==='up'?'#22c55e':t==='down'?'#ef4444':'#f59e0b';

  return (
    <div style={layout}>

      {/* ── Fixed Header ── */}
      <header style={hdrWrap}>
        <div style={hdrLeft}>
          <img src={process.env.PUBLIC_URL+'/admin logo2.png'} alt="Verity-X Admin" style={{height:'48px'}}/>
        </div>
        <div style={hdrRight}>
          {lastUpdated && (
            <span style={{fontSize:'0.75rem',color:'#9ca3af',marginRight:'1rem'}}>
              Updated {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <button onClick={() => { fetchStats(); fetchNotifications(); }}
            style={{background:'none',border:'none',cursor:'pointer',padding:'0.5rem',color:'#6b7280',display:'flex'}}>
            <FaSync size={14}/>
          </button>

          {/* Notifications */}
          <div className="notif-container" style={{position:'relative',display:'inline-block',marginLeft:'0.5rem'}}>
            <button className="notif-bell"
              onClick={() => { setShowNotifs(!showNotifs); if (unreadCount>0&&!showNotifs) markNotifsRead(); }}
              style={{background:'none',border:'none',cursor:'pointer',padding:'0.5rem',position:'relative'}}>
              <FaBell style={{color:'#444',fontSize:'1.3rem'}}/>
              {unreadCount > 0 && (
                <span style={{position:'absolute',top:'-1px',right:'-4px',background:'#ef4444',color:'white',
                  borderRadius:'50%',width:'16px',height:'16px',fontSize:'0.65rem',fontWeight:700,
                  display:'flex',alignItems:'center',justifyContent:'center',border:'2px solid #E5E3E3'}}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            {showNotifs && (
              <div style={notifDrop}>
                <div style={{padding:'12px 16px',borderBottom:'1px solid #e5e7eb',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <span style={{fontWeight:700,color:'#013D83',fontSize:'0.95rem'}}>Notifications</span>
                  <span style={{fontSize:'0.75rem',background:'#f3f4f6',color:'#6b7280',padding:'2px 8px',borderRadius:'12px'}}>{notifications.length}</span>
                </div>
                <div style={{maxHeight:'280px',overflowY:'auto'}}>
                  {notifications.length === 0 ? (
                    <div style={{padding:'2rem',textAlign:'center',color:'#9ca3af'}}>
                      <FaBell style={{fontSize:'1.5rem',opacity:0.4,marginBottom:'0.5rem'}}/>
                      <p style={{margin:0,fontSize:'0.85rem'}}>No notifications</p>
                    </div>
                  ) : notifications.slice(0,6).map((n,i) => (
                    <div key={i} style={{padding:'12px 16px',borderBottom:'1px solid #f3f4f6',display:'flex',gap:'10px',alignItems:'flex-start',cursor:'pointer'}}>
                      <div style={{width:'28px',height:'28px',borderRadius:'50%',background:'#eff6ff',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                        {n.type==='feedback'
                          ? <FaComments style={{color:'#013D83',fontSize:'12px'}}/>
                          : <FaEnvelope style={{color:'#013D83',fontSize:'12px'}}/>}
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <p style={{margin:'0 0 2px',fontSize:'0.82rem'}}>
                          <span style={{fontWeight:700,color:'#013D83'}}>{n.user_name}</span>
                          {' '}<span style={{color:'#6b7280'}}>{n.type==='feedback'?'submitted feedback':'sent a message'}</span>
                        </p>
                        <p style={{margin:0,fontSize:'0.72rem',color:'#9ca3af'}}>{timeAgo(n.timestamp)}</p>
                      </div>
                      {!n.read && <FaCircle style={{color:'#013D83',fontSize:'7px',marginTop:'4px',flexShrink:0}}/>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div style={{width:'1px',height:'20px',background:'rgba(0,0,0,0.15)',margin:'0 0.75rem'}}/>

          <div className="user-dropdown" style={{position:'relative'}}>
            <button onClick={() => setShowUserDrop(!showUserDrop)}
              style={{background:'none',border:'none',display:'flex',alignItems:'center',gap:'0.5rem',cursor:'pointer',padding:'0.4rem'}}>
              <FaUserCircle style={{fontSize:'1.5rem',color:'#444'}}/>
              <span style={{fontWeight:500,color:'#444',fontSize:'0.9rem'}}>Admin</span>
            </button>
            {showUserDrop && (
              <div style={{position:'absolute',top:'100%',right:0,background:'white',borderRadius:'8px',
                boxShadow:'0 4px 16px rgba(0,0,0,0.12)',minWidth:'120px',zIndex:1001,border:'1px solid #e5e7eb'}}>
                <button onClick={handleLogout}
                  style={{width:'100%',padding:'0.65rem 1rem',background:'none',border:'none',
                    textAlign:'left',cursor:'pointer',color:'#374151',fontSize:'0.88rem'}}>
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div style={{display:'flex',flex:1,marginTop:'64px'}}>

        {/* ── Sidebar ── */}
        <nav style={sidebar}>
          {[
            { key:'dashboard', icon:<FaChartLine/>, label:'Dashboard' },
            { key:'users',     icon:<FaUsers/>,     label:'User Management' },
            { key:'feedback',  icon:<FaComments/>,  label:'Feedback' },
          ].map(item => (
            <button key={item.key} onClick={() => setActiveNav(item.key)}
              style={{ ...navBtn, ...(activeNav===item.key ? navBtnActive : {}) }}>
              <span style={{marginRight:'0.65rem',display:'flex'}}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        {/* ── Main content ── */}
        <main style={mainContent}>
          {activeNav === 'dashboard' && <DashboardView stats={stats} systemStats={systemStats} trendIcon={trendIcon} trendColor={trendColor}/>}
          {activeNav === 'users'     && <UserManagement/>}
          {activeNav === 'feedback'  && <FeedbackView/>}
        </main>
      </div>

      <footer style={{background:'#E5E3E3',padding:'0.75rem 1rem',textAlign:'center',marginLeft:'220px'}}>
        <p style={{color:'rgba(81,80,80,0.6)',margin:0,fontSize:'0.82rem'}}>© 2025 Verity-X. All rights reserved.</p>
      </footer>

      <style>{`
        @keyframes spin { to { transform:rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
      `}</style>
    </div>
  );
}


/* ── Dashboard tab  */
function DashboardView({ stats, systemStats, trendIcon, trendColor }) {
  if (!stats) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',padding:'4rem'}}>
      <div style={spinnerSt}/><p style={{marginLeft:'1rem',color:'#013D83'}}>Loading dashboard...</p>
    </div>
  );

  const trend = stats.analysis_trend || {};

  const kpis = [
    {
      label:'Total Analyses', value: stats.total_analyses,
      icon:<FaChartBar style={{fontSize:'1.8rem',color:'#013D83',opacity:0.6}}/>,
      sub: <span style={{color:trendColor(trend.trend_type),fontSize:'0.82rem',fontWeight:600,display:'flex',alignItems:'center',gap:'4px'}}>
             {trendIcon(trend.trend_type)} {trend.trend_display} vs last week
           </span>,
    },
    {
      label:'Registered Users', value: stats.total_users,
      icon:<FaUsers style={{fontSize:'1.8rem',color:'#013D83',opacity:0.6}}/>,
      sub: <span style={{color:'#22c55e',fontSize:'0.82rem',fontWeight:600}}>{stats.active_users} currently active</span>,
    },
    {
      label:'Deepfakes Detected', value: stats.fake_detections,
      icon:<FaExclamationTriangle style={{fontSize:'1.8rem',color:'#b91c1c',opacity:0.6}}/>,
      sub: <span style={{fontSize:'0.82rem',color:'#6b7280'}}>{stats.detection_rate}% detection rate</span>,
    },
    {
      label:'Model Accuracy', value: `${stats.model_accuracy}%`,
      icon:<FaBullseye style={{fontSize:'1.8rem',color:'#013D83',opacity:0.6}}/>,
      sub: <span style={{fontSize:'0.82rem',color:'#6b7280'}}>AUC-ROC: {stats.model_auc}</span>,
    },
  ];

  return (
    <div>
      <div style={pgHeader}>
        <div>
          <h1 style={pgTitle}>Admin Dashboard</h1>
          <p style={{color:'#6b7280',margin:0,fontSize:'0.9rem',display:'flex',alignItems:'center',gap:'0.5rem'}}>
            System overview and analytics
            <span style={{display:'inline-flex',alignItems:'center',gap:'4px',color:'#22c55e',fontSize:'0.82rem'}}>
              <span style={{width:'7px',height:'7px',borderRadius:'50%',background:'#22c55e',animation:'pulse 2s infinite',display:'inline-block'}}/>
              Auto-refreshing every 30s
            </span>
          </p>
        </div>
      </div>

      {/* KPI row */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'1.25rem',marginBottom:'1.75rem'}}>
        {kpis.map(k => (
          <div key={k.label} style={kpiCard}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
              <div>
                <p style={{margin:'0 0 0.4rem',color:'#6b7280',fontSize:'0.82rem',fontWeight:500}}>{k.label}</p>
                <h2 style={{margin:'0 0 0.4rem',color:'#013D83',fontSize:'2.2rem',fontWeight:800,lineHeight:1}}>{k.value}</h2>
                {k.sub}
              </div>
              {k.icon}
            </div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'1.25rem',marginBottom:'1.75rem'}}>

        {/* Detection breakdown donut */}
        <div style={vizCard}>
          <h3 style={vizTitle}>Detection Breakdown</h3>
          <div style={{display:'flex',alignItems:'center',justifyContent:'center',padding:'1rem 0'}}>
            <div style={{position:'relative',width:'120px',height:'120px'}}>
              <svg viewBox="0 0 36 36" style={{transform:'rotate(-90deg)',width:'100%',height:'100%'}}>
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f3f4f6" strokeWidth="3.5"/>
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#ef4444" strokeWidth="3.5"
                  strokeDasharray={`${stats.detection_rate} ${100-stats.detection_rate}`}
                  strokeLinecap="round"/>
              </svg>
              <div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}>
                <span style={{fontSize:'1.2rem',fontWeight:800,color:'#013D83'}}>{stats.detection_rate}%</span>
                <span style={{fontSize:'0.6rem',color:'#9ca3af',marginTop:'1px'}}>FAKE rate</span>
              </div>
            </div>
            <div style={{marginLeft:'1.5rem'}}>
              <div style={{display:'flex',alignItems:'center',gap:'6px',marginBottom:'8px'}}>
                <span style={{width:'10px',height:'10px',borderRadius:'50%',background:'#ef4444',flexShrink:0}}/>
                <span style={{fontSize:'0.82rem',color:'#374151'}}>Fake: {stats.fake_detections}</span>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:'6px'}}>
                <span style={{width:'10px',height:'10px',borderRadius:'50%',background:'#22c55e',flexShrink:0}}/>
                <span style={{fontSize:'0.82rem',color:'#374151'}}>Real: {stats.real_detections}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Model performance */}
        <div style={vizCard}>
          <h3 style={vizTitle}>Model Performance</h3>
          {[
            ['Accuracy',  `${stats.model_accuracy}%`, stats.model_accuracy],
            ['AUC-ROC',   stats.model_auc,             stats.model_auc * 100],
            ['Threshold', '75.8%',                     75.8],
          ].map(([label,val,pct]) => (
            <div key={label} style={{marginBottom:'0.75rem'}}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:'4px'}}>
                <span style={{fontSize:'0.78rem',color:'#6b7280'}}>{label}</span>
                <span style={{fontSize:'0.78rem',fontWeight:700,color:'#013D83'}}>{val}</span>
              </div>
              <div style={{height:'6px',background:'#f3f4f6',borderRadius:'3px',overflow:'hidden'}}>
                <div style={{height:'100%',borderRadius:'3px',background:'linear-gradient(90deg,#013D83,#A9D6E5)',width:`${pct}%`}}/>
              </div>
            </div>
          ))}
          <div style={{marginTop:'0.75rem',padding:'0.5rem 0.75rem',background:'#eff6ff',borderRadius:'6px'}}>
            <p style={{margin:0,fontSize:'0.72rem',color:'#013D83'}}>
              EER: {stats.model_eer}%  ·  16 frames/video  ·  EfficientNetB4
            </p>
          </div>
        </div>

        {/* Experiment accuracy bar chart */}
        {systemStats?.accuracy_trend && (
          <div style={vizCard}>
            <h3 style={vizTitle}>Experiment History</h3>
            <div style={{display:'flex',alignItems:'flex-end',gap:'6px',height:'90px',paddingBottom:'4px'}}>
              {systemStats.accuracy_trend.map((exp, i) => {
                const h = ((exp.accuracy - 50) / 50) * 100;
                const isCurrent = i === systemStats.accuracy_trend.length - 1;
                return (
                  <div key={i} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:'2px'}}>
                    <span style={{fontSize:'0.55rem',color: isCurrent?'#013D83':'#9ca3af',fontWeight: isCurrent?700:400}}>
                      {exp.accuracy}%
                    </span>
                    <div style={{width:'100%',background: isCurrent?'#013D83':'#A9D6E5',borderRadius:'3px 3px 0 0',
                      height:`${h}px`,minHeight:'8px',transition:'height 0.3s'}}/>
                    <span style={{fontSize:'0.52rem',color:'#9ca3af',textAlign:'center'}}>{exp.label.replace('Exp ','E')}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Recent analyses table */}
      {stats.recent_analyses?.length > 0 && (
        <div style={vizCard}>
          <h3 style={vizTitle}>Recent Analyses</h3>
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead>
                <tr style={{background:'#f8fafc'}}>
                  {['Analysis ID','Video','Verdict','Confidence','Source','Date'].map(h => (
                    <th key={h} style={{padding:'0.6rem 0.75rem',textAlign:'left',fontSize:'0.7rem',fontWeight:700,color:'#374151',textTransform:'uppercase',letterSpacing:'0.04em',borderBottom:'1px solid #e5e7eb'}}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stats.recent_analyses.map((a,i) => {
                  const isFake = a.verdict === 'FAKE';
                  return (
                    <tr key={i} style={{borderBottom:'1px solid #f3f4f6', background: i%2===0?'white':'#fafafa'}}>
                      <td style={tdSt}><span style={{fontSize:'0.72rem',color:'#9ca3af',fontFamily:'monospace'}}>{(a.analysisId||'').slice(0,12)}…</span></td>
                      <td style={tdSt}><span style={{fontSize:'0.8rem',color:'#374151'}}>{a.videoName||'Unknown'}</span></td>
                      <td style={tdSt}>
                        <span style={{display:'inline-flex',alignItems:'center',gap:'4px',padding:'0.2rem 0.6rem',
                          borderRadius:'20px',fontSize:'0.72rem',fontWeight:700,
                          background:isFake?'#fef2f2':'#f0fdf4',color:isFake?'#b91c1c':'#15803d'}}>
                          {isFake?<FaExclamationTriangle size={9}/>:<FaCheckCircle size={9}/>}
                          {a.verdict}
                        </span>
                      </td>
                      <td style={tdSt}>
                        <div style={{display:'flex',alignItems:'center',gap:'6px'}}>
                          <div style={{width:'50px',height:'4px',background:'#f3f4f6',borderRadius:'2px',overflow:'hidden'}}>
                            <div style={{height:'100%',borderRadius:'2px',width:`${a.confidenceScore}%`,background:isFake?'#ef4444':'#22c55e'}}/>
                          </div>
                          <span style={{fontSize:'0.78rem',fontWeight:700,color:'#374151'}}>{a.confidenceScore}%</span>
                        </div>
                      </td>
                      <td style={tdSt}><span style={{fontSize:'0.75rem',color:'#6b7280'}}>{a.source||'file'}</span></td>
                      <td style={tdSt}><span style={{fontSize:'0.75rem',color:'#9ca3af'}}>{a.analyzedAt?new Date(a.analyzedAt).toLocaleString('en-GB',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}):'—'}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}


/* ── User Management tab  */
function UserManagement() {
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [selected,setSelected]= useState(null);
  const [userAnalyses,setUserAnalyses] = useState([]);
  const [loadingAnalyses,setLoadingAnalyses] = useState(false);

  const token = () => localStorage.getItem('adminToken');

  const fetchUsers = async (q = '') => {
    setLoading(true);
    try {
      const url = q ? `${API}/admin/users?search=${encodeURIComponent(q)}` : `${API}/admin/users`;
      const r   = await fetch(url, { headers: { Authorization: `Bearer ${token()}` } });
      if (r.ok) setUsers(await r.json());
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const fetchUserAnalyses = async (uid) => {
    setLoadingAnalyses(true);
    try {
      const r = await fetch(`${API}/admin/users/${uid}/analyses`, { headers: { Authorization: `Bearer ${token()}` } });
      if (r.ok) { const d = await r.json(); setUserAnalyses(d.analyses||[]); }
    } catch {} finally { setLoadingAnalyses(false); }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleSelect = (user) => {
    setSelected(user);
    fetchUserAnalyses(user.uid);
  };

  return (
    <div>
      <div style={pgHeader}>
        <h1 style={pgTitle}>User Management</h1>
      </div>

      <div style={{display:'grid',gridTemplateColumns:selected?'1fr 380px':'1fr',gap:'1.25rem',alignItems:'start'}}>

        {/* Users table */}
        <div style={vizCard}>
          {/* Search */}
          <div style={{display:'flex',gap:'0.75rem',marginBottom:'1.25rem'}}>
            <div style={{flex:1,display:'flex',alignItems:'center',gap:'0.5rem',border:'1px solid #e5e7eb',borderRadius:'8px',padding:'0.45rem 0.75rem',background:'#f9fafb'}}>
              <FaSearch style={{color:'#9ca3af',fontSize:'0.8rem',flexShrink:0}}/>
              <input type="text" placeholder="Search by name or email..."
                value={search} onChange={e => setSearch(e.target.value)}
                onKeyDown={e => e.key==='Enter' && fetchUsers(search)}
                style={{flex:1,border:'none',background:'none',outline:'none',fontSize:'0.85rem',color:'#374151'}}/>
            </div>
            <button onClick={() => fetchUsers(search)}
              style={{padding:'0.45rem 1.1rem',background:'#013D83',color:'white',border:'none',borderRadius:'8px',cursor:'pointer',fontWeight:600,fontSize:'0.85rem'}}>
              Search
            </button>
            <button onClick={() => { setSearch(''); fetchUsers(''); }}
              style={{padding:'0.45rem 0.85rem',background:'#f3f4f6',color:'#374151',border:'none',borderRadius:'8px',cursor:'pointer',fontSize:'0.85rem'}}>
              Clear
            </button>
          </div>

          {loading ? (
            <div style={{display:'flex',alignItems:'center',justifyContent:'center',padding:'3rem'}}>
              <div style={spinnerSt}/>
            </div>
          ) : (
            <div style={{overflowX:'auto',borderRadius:'8px',border:'1px solid #f3f4f6'}}>
              <table style={{width:'100%',borderCollapse:'collapse'}}>
                <thead>
                  <tr style={{background:'#A9D6E5'}}>
                    {['ID','Name','Email','Analyses','Status',''].map(h => (
                      <th key={h} style={{padding:'0.75rem 0.9rem',textAlign:'left',fontSize:'0.72rem',fontWeight:700,color:'#013D83',textTransform:'uppercase',letterSpacing:'0.04em'}}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr><td colSpan={6} style={{padding:'2rem',textAlign:'center',color:'#9ca3af',fontSize:'0.85rem'}}>No users found</td></tr>
                  ) : users.map((u,i) => (
                    <tr key={u.uid} style={{borderBottom:'1px solid #f3f4f6',background:selected?.uid===u.uid?'#eff6ff':i%2===0?'white':'#fafafa',cursor:'pointer'}}
                      onClick={() => handleSelect(u)}>
                      <td style={tdSt}><span style={{fontFamily:'monospace',fontSize:'0.78rem',color:'#9ca3af'}}>{String(u.id).padStart(3,'0')}</span></td>
                      <td style={tdSt}><span style={{fontWeight:600,color:'#013D83',fontSize:'0.85rem'}}>{u.name}</span></td>
                      <td style={tdSt}><span style={{color:'#6b7280',fontSize:'0.82rem'}}>{u.email}</span></td>
                      <td style={tdSt}><span style={{fontWeight:700,color:'#374151'}}>{u.analyses}</span></td>
                      <td style={tdSt}>
                        <span style={{padding:'0.2rem 0.65rem',borderRadius:'20px',fontSize:'0.72rem',fontWeight:600,
                          background:u.status==='Active'?'rgba(187,247,208,0.6)':'rgba(254,202,202,0.6)',
                          color:u.status==='Active'?'#15803d':'#b91c1c'}}>
                          {u.status}
                        </span>
                      </td>
                      <td style={tdSt}>
                        <button style={{padding:'0.2rem 0.6rem',background:'#eff6ff',color:'#013D83',border:'1px solid #bfdbfe',borderRadius:'5px',cursor:'pointer',fontSize:'0.75rem',fontWeight:600}}>
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p style={{margin:'0.75rem 0 0',fontSize:'0.75rem',color:'#9ca3af'}}>{users.length} users total</p>
        </div>

        {/* User detail panel */}
        {selected && (
          <div style={{...vizCard,position:'sticky',top:'80px'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'1rem'}}>
              <div style={{display:'flex',alignItems:'center',gap:'0.75rem'}}>
                <div style={{width:'42px',height:'42px',borderRadius:'50%',background:'#013D83',color:'white',
                  display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.1rem',fontWeight:700,flexShrink:0}}>
                  {selected.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p style={{margin:0,fontWeight:700,color:'#111827',fontSize:'0.95rem'}}>{selected.name}</p>
                  <p style={{margin:0,color:'#6b7280',fontSize:'0.78rem'}}>{selected.email}</p>
                </div>
              </div>
              <button onClick={() => { setSelected(null); setUserAnalyses([]); }}
                style={{background:'none',border:'none',cursor:'pointer',color:'#9ca3af',fontSize:'1rem',padding:'2px'}}>
                ×
              </button>
            </div>

            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.5rem',marginBottom:'1rem'}}>
              {[
                ['Total Analyses', selected.analyses],
                ['Status', selected.status],
              ].map(([l,v]) => (
                <div key={l} style={{background:'#f8fafc',borderRadius:'7px',padding:'0.6rem 0.75rem'}}>
                  <p style={{margin:'0 0 0.15rem',fontSize:'0.68rem',color:'#9ca3af',textTransform:'uppercase',letterSpacing:'0.05em'}}>{l}</p>
                  <p style={{margin:0,fontWeight:700,color:'#013D83',fontSize:'1rem'}}>{v}</p>
                </div>
              ))}
            </div>

            <p style={{margin:'0 0 0.5rem',fontSize:'0.8rem',fontWeight:700,color:'#374151'}}>Recent Analyses</p>
            {loadingAnalyses ? (
              <div style={{display:'flex',justifyContent:'center',padding:'1.5rem'}}><div style={spinnerSt}/></div>
            ) : userAnalyses.length === 0 ? (
              <p style={{color:'#9ca3af',fontSize:'0.8rem',textAlign:'center',padding:'1rem 0'}}>No analyses found</p>
            ) : (
              <div style={{display:'flex',flexDirection:'column',gap:'0.4rem',maxHeight:'300px',overflowY:'auto'}}>
                {userAnalyses.map((a,i) => {
                  const isFake = a.verdict === 'FAKE';
                  return (
                    <div key={i} style={{padding:'0.5rem 0.65rem',borderRadius:'7px',background:'#f8fafc',border:'1px solid #f3f4f6'}}>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                        <span style={{fontSize:'0.78rem',color:'#374151',fontWeight:500,maxWidth:'160px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                          {a.videoName||'Unknown'}
                        </span>
                        <span style={{padding:'1px 6px',borderRadius:'10px',fontSize:'0.68rem',fontWeight:700,
                          background:isFake?'#fef2f2':'#f0fdf4',color:isFake?'#b91c1c':'#15803d'}}>
                          {a.verdict}
                        </span>
                      </div>
                      <div style={{display:'flex',justifyContent:'space-between',marginTop:'2px'}}>
                        <span style={{fontSize:'0.7rem',color:'#9ca3af'}}>{a.confidenceScore}% confidence</span>
                        <span style={{fontSize:'0.7rem',color:'#9ca3af'}}>
                          {a.analyzedAt?new Date(a.analyzedAt).toLocaleDateString('en-GB',{day:'2-digit',month:'short'}):'—'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}


/* ── Feedback tab  */
function FeedbackView() {
  const [feedback, setFeedback] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState('all');

  const token = () => localStorage.getItem('adminToken');

  useEffect(() => {
    const fetch_ = async () => {
      try {
        const r = await fetch(`${API}/admin/feedback`, { headers: { Authorization: `Bearer ${token()}` } });
        if (r.ok) { const d = await r.json(); setFeedback(d.feedback||[]); }
      } catch {} finally { setLoading(false); }
    };
    fetch_();
  }, []);

  const filtered = filter === 'all' ? feedback
    : feedback.filter(f => filter==='high' ? f.rating>=4 : filter==='low' ? f.rating<=2 : true);

  const avgRating = feedback.length ? (feedback.reduce((s,f) => s+f.rating,0)/feedback.length).toFixed(1) : 0;

  return (
    <div>
      <div style={pgHeader}>
        <div>
          <h1 style={pgTitle}>User Feedback</h1>
          <p style={{color:'#6b7280',margin:0,fontSize:'0.9rem'}}>All feedback submitted by users via the Results page</p>
        </div>
      </div>

      {/* Stats strip */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'1rem',marginBottom:'1.5rem'}}>
        {[
          ['Total Feedback', feedback.length, '#013D83','#eff6ff'],
          ['Average Rating', avgRating + ' / 5', '#b45309','#fffbeb'],
          ['High Ratings (4-5★)', feedback.filter(f=>f.rating>=4).length, '#15803d','#f0fdf4'],
        ].map(([l,v,c,bg]) => (
          <div key={l} style={{background:bg,borderRadius:'10px',padding:'1rem 1.25rem'}}>
            <p style={{margin:'0 0 0.3rem',fontSize:'1.6rem',fontWeight:800,color:c}}>{v}</p>
            <p style={{margin:0,fontSize:'0.78rem',color:'#6b7280'}}>{l}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div style={{display:'flex',gap:'0.4rem',marginBottom:'1.25rem'}}>
        {[['all','All'],['high','High (4-5★)'],['low','Low (1-2★)']].map(([k,l]) => (
          <button key={k} onClick={() => setFilter(k)}
            style={{padding:'0.35rem 0.9rem',border:'1px solid #e5e7eb',borderRadius:'20px',
              background:filter===k?'#013D83':'white',color:filter===k?'white':'#6b7280',
              cursor:'pointer',fontSize:'0.8rem',fontWeight:500}}>
            {l}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{display:'flex',justifyContent:'center',padding:'3rem'}}><div style={spinnerSt}/></div>
      ) : filtered.length === 0 ? (
        <div style={{...vizCard,textAlign:'center',padding:'3rem',color:'#9ca3af'}}>
          <FaComments style={{fontSize:'2.5rem',opacity:0.3,marginBottom:'0.75rem'}}/>
          <p>No feedback yet.</p>
        </div>
      ) : (
        <div style={{display:'grid',gap:'0.75rem'}}>
          {filtered.map((f,i) => (
            <div key={i} style={{...vizCard,padding:'1rem 1.25rem'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'0.5rem',flexWrap:'wrap',gap:'0.5rem'}}>
                <div style={{display:'flex',alignItems:'center',gap:'0.6rem'}}>
                  <div style={{width:'32px',height:'32px',borderRadius:'50%',background:'#013D83',color:'white',
                    display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.85rem',fontWeight:700,flexShrink:0}}>
                    {(f.userName||'A').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p style={{margin:0,fontWeight:700,color:'#111827',fontSize:'0.88rem'}}>{f.userName||'Anonymous'}</p>
                    <p style={{margin:0,color:'#9ca3af',fontSize:'0.72rem'}}>{f.userEmail}</p>
                  </div>
                </div>
                <div style={{display:'flex',alignItems:'center',gap:'0.75rem'}}>
                  <div style={{display:'flex',gap:'2px'}}>
                    {[1,2,3,4,5].map(s => (
                      <FaStar key={s} style={{fontSize:'0.85rem',color:s<=f.rating?'#f59e0b':'#e5e7eb'}}/>
                    ))}
                  </div>
                  <span style={{fontSize:'0.72rem',color:'#9ca3af'}}>
                    {f.timestamp?new Date(f.timestamp).toLocaleString('en-GB',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}):''}
                  </span>
                </div>
              </div>
              {f.feedback && <p style={{margin:'0 0 0.5rem',color:'#374151',fontSize:'0.85rem',lineHeight:1.5}}>{f.feedback}</p>}
              <div style={{display:'flex',gap:'0.5rem',flexWrap:'wrap'}}>
                {f.prediction && (
                  <span style={{fontSize:'0.7rem',padding:'0.15rem 0.5rem',borderRadius:'10px',
                    background:f.prediction==='FAKE'?'#fef2f2':'#f0fdf4',
                    color:f.prediction==='FAKE'?'#b91c1c':'#15803d',fontWeight:600}}>
                    {f.prediction} · {f.confidence}%
                  </span>
                )}
                {f.source && <span style={{fontSize:'0.7rem',padding:'0.15rem 0.5rem',borderRadius:'10px',background:'#f3f4f6',color:'#374151'}}>{f.source}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


/* ── Styles ── */
const layout     = { display:'flex', flexDirection:'column', minHeight:'100vh', fontFamily:"'Segoe UI',sans-serif" };
const hdrWrap    = { display:'flex', position:'fixed', top:0, left:0, right:0, height:'64px', zIndex:1000 };
const hdrLeft    = { width:'220px', background:'#013D83', display:'flex', alignItems:'center', justifyContent:'center', padding:'0 1rem' };
const hdrRight   = { flex:1, background:'#E5E3E3', display:'flex', alignItems:'center', justifyContent:'flex-end', padding:'0 1.5rem' };
const sidebar    = { width:'220px', background:'#013D83', padding:'1.5rem 0.75rem', display:'flex', flexDirection:'column', gap:'0.3rem', position:'fixed', height:'calc(100vh - 64px)', left:0, top:'64px' };
const navBtn     = { display:'flex', alignItems:'center', padding:'0.65rem 1rem', background:'transparent', border:'none', color:'rgba(255,255,255,0.75)', fontSize:'0.9rem', cursor:'pointer', borderRadius:'7px', textAlign:'left', width:'100%', fontFamily:'inherit' };
const navBtnActive = { ...navBtn, background:'white', color:'#013D83', fontWeight:700 };
const mainContent= { flex:1, background:'#E5E3E3', padding:'1.5rem', marginLeft:'220px', minHeight:'calc(100vh - 64px)' };
const pgHeader   = { marginBottom:'1.5rem' };
const pgTitle    = { color:'#013D83', fontWeight:800, fontSize:'2rem', margin:'0 0 0.25rem' };
const kpiCard    = { background:'white', borderRadius:'12px', padding:'1.25rem 1.5rem', boxShadow:'0 1px 4px rgba(0,0,0,0.07)' };
const vizCard    = { background:'white', borderRadius:'12px', padding:'1.25rem', boxShadow:'0 1px 4px rgba(0,0,0,0.07)' };
const vizTitle   = { color:'#013D83', fontWeight:700, fontSize:'1rem', margin:'0 0 1rem' };
const tdSt       = { padding:'0.65rem 0.9rem' };
const spinnerSt  = { width:'32px', height:'32px', border:'3px solid #e5e7eb', borderTop:'3px solid #013D83', borderRadius:'50%', animation:'spin 0.8s linear infinite' };
const notifDrop  = { position:'absolute', top:'calc(100% + 6px)', right:0, background:'white', borderRadius:'10px', boxShadow:'0 8px 28px rgba(0,0,0,0.14)', width:'320px', zIndex:1002, border:'1px solid #e5e7eb' };