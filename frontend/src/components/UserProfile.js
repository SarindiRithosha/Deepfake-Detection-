import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaEnvelope, FaSignOutAlt, FaChartBar, FaTrash,
         FaEdit, FaBold, FaItalic, FaUnderline, FaCheckCircle, FaHistory } from 'react-icons/fa';

function UserProfile() {
  const { currentUser, userProfile, logout, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [activeSection,    setActiveSection]    = useState('profile');
  const [userData,         setUserData]         = useState({ name:'', email:'', analysisCount:0 });
  const [isEditingName,    setIsEditingName]    = useState(false);
  const [tempName,         setTempName]         = useState('');
  const [contactForm,      setContactForm]      = useState({ subject:'', message:'' });
  const [showNameConfirm,  setShowNameConfirm]  = useState(false);
  const [showDeleteConfirm,setShowDeleteConfirm]= useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  useEffect(() => { if (!currentUser) navigate('/login'); }, [currentUser, navigate]);

  useEffect(() => {
    if (userProfile) {
      setUserData({
        name:          userProfile.name || 'User',
        email:         userProfile.email || currentUser?.email || '',
        analysisCount: userProfile.analysis_count || 0,
      });
      setTempName(userProfile.name || 'User');
    }
  }, [userProfile, currentUser]);

  const handleNameSave = () => setShowNameConfirm(true);

  const confirmNameChange = async () => {
    try {
      const token    = await currentUser.getIdToken();
      const response = await fetch(`${process.env.REACT_APP_API_URL}/auth/user/${currentUser.uid}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: tempName }),
      });
      if (response.ok) { await updateProfile(); setIsEditingName(false); }
    } catch (e) { console.error('Error updating name:', e); }
    setShowNameConfirm(false);
  };

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    try {
      const token    = await currentUser.getIdToken();
      const response = await fetch(`${process.env.REACT_APP_API_URL}/contact`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...contactForm, userEmail: userData.email, userName: userData.name }),
      });
      if (response.ok) { setShowSuccessPopup(true); setContactForm({ subject:'', message:'' }); }
    } catch (e) { console.error('Error sending message:', e); }
  };

  const handleDeleteAccount = async () => {
    try {
      const token    = await currentUser.getIdToken();
      const response = await fetch(`${process.env.REACT_APP_API_URL}/auth/user/${currentUser.uid}`, {
        method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) { await logout(); navigate('/'); }
    } catch (e) { console.error('Error deleting account:', e); alert('Error deleting account.'); }
    setShowDeleteConfirm(false);
  };

  const formatText = (format) => {
    const ta    = document.getElementById('msgTA');
    const start = ta.selectionStart, end = ta.selectionEnd;
    const sel   = contactForm.message.substring(start, end);
    const wrap  = { bold: `**${sel}**`, italic: `*${sel}*`, underline: `__${sel}__` };
    setContactForm(p => ({ ...p, message: p.message.substring(0,start)+(wrap[format]||sel)+p.message.substring(end) }));
  };

  if (!currentUser) return <div>Loading…</div>;

  return (
    <div style={page}>
      {/* Success popup */}
      {showSuccessPopup && (
        <div style={overlay}>
          <div style={popup}>
            <FaCheckCircle style={{ color:'#22c55e', fontSize:'3.5rem', marginBottom:'1rem' }}/>
            <h3 style={{ color:'#15803d', margin:'0 0 0.5rem' }}>Message Sent!</h3>
            <p style={{ color:'#6b7280', marginBottom:'1.5rem', fontSize:'0.9rem' }}>We'll get back to you soon.</p>
            <button onClick={() => setShowSuccessPopup(false)} style={btnGreen}>OK</button>
          </div>
        </div>
      )}

      {/* Name confirm modal */}
      {showNameConfirm && (
        <div style={overlay}>
          <div style={modal}>
            <h3 style={{ margin:'0 0 0.75rem', color:'#111827' }}>Confirm Name Change</h3>
            <p style={{ color:'#6b7280', fontSize:'0.9rem', marginBottom:'1.25rem' }}>
              Change your name to <strong>"{tempName}"</strong>?
            </p>
            <div style={{ display:'flex', gap:'0.75rem', justifyContent:'center' }}>
              <button onClick={confirmNameChange} style={btnPri}>Confirm</button>
              <button onClick={() => { setTempName(userData.name); setIsEditingName(false); setShowNameConfirm(false); }} style={btnGrey}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm modal */}
      {showDeleteConfirm && (
        <div style={overlay}>
          <div style={modal}>
            <h3 style={{ margin:'0 0 0.75rem', color:'#b91c1c' }}>Delete Account</h3>
            <p style={{ color:'#6b7280', fontSize:'0.9rem', marginBottom:'1.25rem' }}>
              This action is permanent and cannot be undone.
            </p>
            <div style={{ display:'flex', gap:'0.75rem', justifyContent:'center' }}>
              <button onClick={handleDeleteAccount} style={btnRed}>Delete Account</button>
              <button onClick={() => setShowDeleteConfirm(false)} style={btnGrey}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div style={container}>
        {/* Sidebar */}
        <div style={sidebar}>
          <div style={avatarBlock}>
            <div style={avatarCircle}>{userData.name.charAt(0).toUpperCase()}</div>
            <div>
              <p style={{ margin:'0 0 0.1rem', fontWeight:700, color:'#111827', fontSize:'1rem' }}>{userData.name}</p>
              <p style={{ margin:0, color:'#6b7280', fontSize:'0.8rem' }}>{userData.email}</p>
            </div>
          </div>

          <nav style={{ display:'flex', flexDirection:'column', gap:'0.25rem' }}>
            {[
              { key:'profile',  icon:<FaUser/>,     label:'My Profile' },
              { key:'history',  icon:<FaHistory/>,  label:'Analysis History' },
              { key:'contact',  icon:<FaEnvelope/>, label:'Contact Us' },
            ].map(item => (
              <button key={item.key} onClick={() => item.key==='history' ? navigate('/history') : setActiveSection(item.key)}
                style={{ ...navBtn, ...(activeSection===item.key ? navBtnActive : {}) }}>
                <span style={{ marginRight:'0.6rem' }}>{item.icon}</span>{item.label}
              </button>
            ))}
            <button onClick={async()=>{ await logout(); navigate('/'); }} style={navBtn}>
              <FaSignOutAlt style={{ marginRight:'0.6rem' }}/>Log Out
            </button>
          </nav>
        </div>

        {/* Main */}
        <div style={main}>
          {activeSection === 'profile' ? (
            <div>
              <h1 style={sectionTitle}>My Profile</h1>

              {/* Personal info */}
              <div style={card}>
                <h2 style={cardTitle}>Personal Information</h2>
                <div style={{ display:'flex', flexDirection:'column', gap:'1.25rem' }}>

                  <div style={inputGroup}>
                    <label style={label}>Full Name</label>
                    <div style={{ display:'flex', gap:'0.5rem', alignItems:'center' }}>
                      <input type="text" value={isEditingName ? tempName : userData.name}
                        onChange={e => setTempName(e.target.value)}
                        disabled={!isEditingName} style={inputStyle}/>
                      <button onClick={isEditingName ? handleNameSave : () => setIsEditingName(true)}
                        style={editBtn}>
                        <FaEdit/>
                      </button>
                    </div>
                  </div>

                  <div style={inputGroup}>
                    <label style={label}>Email Address</label>
                    <input type="email" value={userData.email} disabled style={{ ...inputStyle, background:'#f9fafb' }}/>
                  </div>

                  <div style={inputGroup}>
                    <label style={label}>Password</label>
                    <div style={{ display:'flex', gap:'0.5rem', alignItems:'center' }}>
                      <input type="password" value="••••••••" disabled style={{ ...inputStyle, flex:1, background:'#f9fafb' }}/>
                      <button onClick={() => navigate('/forgot-password')} style={btnPri}>Change Password</button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Account status — shows analyses, no upload limit */}
              <div style={card}>
                <h2 style={cardTitle}>Account Status</h2>
                <div style={statusBox}>
                  <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
                    <div style={{ width:'42px', height:'42px', borderRadius:'50%', background:'#eff6ff',
                      display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <FaChartBar style={{ color:'#013D83', fontSize:'1.2rem' }}/>
                    </div>
                    <div>
                      <p style={{ margin:0, fontWeight:600, color:'#111827', fontSize:'0.95rem' }}>Total Analyses</p>
                      <p style={{ margin:0, fontSize:'0.78rem', color:'#6b7280' }}>Registered users have unlimited analyses</p>
                    </div>
                  </div>
                  <div style={{ textAlign:'center' }}>
                    <p style={{ margin:0, fontSize:'2.5rem', fontWeight:800, color:'#013D83', lineHeight:1 }}>
                      {userData.analysisCount}
                    </p>
                    <p style={{ margin:0, fontSize:'0.72rem', color:'#6b7280', marginTop:'0.2rem' }}>videos analysed</p>
                  </div>
                </div>
                <div style={{ marginTop:'0.75rem', padding:'0.6rem 0.9rem', background:'#f0fdf4', borderRadius:'8px',
                  display:'flex', alignItems:'center', gap:'0.5rem' }}>
                  <FaCheckCircle style={{ color:'#22c55e', fontSize:'0.9rem' }}/>
                  <p style={{ margin:0, fontSize:'0.8rem', color:'#15803d', fontWeight:500 }}>
                    Unlimited analyses — no restrictions on your registered account
                  </p>
                </div>
              </div>

              {/* Account actions */}
              <div style={card}>
                <h2 style={cardTitle}>Account Actions</h2>
                <div style={{ display:'flex', gap:'1rem', flexWrap:'wrap' }}>
                  <button onClick={() => setShowDeleteConfirm(true)} style={btnRed}>
                    <FaTrash style={{ marginRight:'0.4rem' }}/>Delete Account
                  </button>
                  <button onClick={async()=>{ await logout(); navigate('/'); }} style={btnGrey}>
                    <FaSignOutAlt style={{ marginRight:'0.4rem' }}/>Log Out
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <h1 style={sectionTitle}>Contact Us</h1>
              <div style={card}>
                <form onSubmit={handleContactSubmit} style={{ display:'flex', flexDirection:'column', gap:'1.25rem' }}>
                  <div style={inputGroup}>
                    <label style={label}>Subject</label>
                    <input type="text" value={contactForm.subject} required
                      onChange={e => setContactForm(p => ({ ...p, subject:e.target.value }))}
                      placeholder="Enter subject" style={inputStyle}/>
                  </div>
                  <div style={inputGroup}>
                    <label style={label}>Message</label>
                    <div style={{ display:'flex', gap:'0.4rem', marginBottom:'0.4rem' }}>
                      {[['bold',<FaBold/>],['italic',<FaItalic/>],['underline',<FaUnderline/>]].map(([f,icon])=>(
                        <button key={f} type="button" onClick={() => formatText(f)}
                          style={{ border:'1px solid #e5e7eb', background:'white', padding:'0.35rem 0.55rem',
                            borderRadius:'4px', cursor:'pointer', color:'#6b7280', fontSize:'0.85rem' }}>
                          {icon}
                        </button>
                      ))}
                    </div>
                    <textarea id="msgTA" value={contactForm.message} required
                      onChange={e => setContactForm(p => ({ ...p, message:e.target.value }))}
                      placeholder="Type your message here…" rows={8}
                      style={{ ...inputStyle, resize:'vertical', minHeight:'150px' }}/>
                  </div>
                  <button type="submit" style={{ ...btnPri, alignSelf:'flex-end' }}>Send Message</button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const page        = { background:'#f0f2f5', minHeight:'100vh', padding:'2rem', fontFamily:"'Segoe UI',sans-serif" };
const container   = { display:'flex', maxWidth:'1200px', margin:'0 auto', background:'white', borderRadius:'14px', overflow:'hidden', boxShadow:'0 2px 12px rgba(0,0,0,0.08)', minHeight:'80vh' };
const sidebar     = { width:'260px', background:'#fafafa', padding:'1.75rem 1.25rem', borderRight:'1px solid #f3f4f6', flexShrink:0 };
const avatarBlock = { display:'flex', alignItems:'center', gap:'0.75rem', marginBottom:'1.75rem', paddingBottom:'1.25rem', borderBottom:'1px solid #e5e7eb' };
const avatarCircle= { width:'48px', height:'48px', borderRadius:'50%', background:'#013D83', color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.3rem', fontWeight:700, flexShrink:0 };
const navBtn      = { display:'flex', alignItems:'center', padding:'0.6rem 0.85rem', background:'transparent', border:'none', color:'#6b7280', fontSize:'0.9rem', cursor:'pointer', borderRadius:'7px', textAlign:'left', width:'100%' };
const navBtnActive= { background:'#013D83', color:'white' };
const main        = { flex:1, padding:'2rem', overflowY:'auto', background:'#fafafa' };
const sectionTitle= { color:'#111827', fontWeight:800, fontSize:'1.75rem', marginBottom:'1.5rem' };
const card        = { background:'white', border:'1px solid #e5e7eb', borderRadius:'10px', padding:'1.5rem', marginBottom:'1.25rem' };
const cardTitle   = { color:'#111827', fontWeight:700, fontSize:'1.1rem', marginBottom:'1rem' };
const inputGroup  = { display:'flex', flexDirection:'column', gap:'0.35rem' };
const label       = { fontSize:'0.85rem', fontWeight:600, color:'#374151' };
const inputStyle  = { padding:'0.6rem 0.75rem', border:'1px solid #e5e7eb', borderRadius:'7px', fontSize:'0.9rem', background:'white', outline:'none', flex:1 };
const editBtn     = { background:'transparent', border:'none', color:'#6b7280', cursor:'pointer', padding:'0.4rem', fontSize:'1rem' };
const statusBox   = { display:'flex', justifyContent:'space-between', alignItems:'center', background:'#f8fafc', padding:'1.1rem 1.25rem', borderRadius:'10px' };
const btnPri  = { padding:'0.55rem 1.25rem', background:'#013D83', color:'white', border:'none', borderRadius:'7px', fontWeight:700, cursor:'pointer', fontSize:'0.85rem', display:'flex', alignItems:'center' };
const btnGrey = { padding:'0.55rem 1.25rem', background:'#6b7280', color:'white', border:'none', borderRadius:'7px', fontWeight:700, cursor:'pointer', fontSize:'0.85rem', display:'flex', alignItems:'center' };
const btnRed  = { padding:'0.55rem 1.25rem', background:'#dc2626', color:'white', border:'none', borderRadius:'7px', fontWeight:700, cursor:'pointer', fontSize:'0.85rem', display:'flex', alignItems:'center' };
const btnGreen= { padding:'0.55rem 1.5rem', background:'#22c55e', color:'white', border:'none', borderRadius:'7px', fontWeight:700, cursor:'pointer', fontSize:'0.9rem' };
const overlay = { position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 };
const modal   = { background:'white', padding:'2rem', borderRadius:'12px', maxWidth:'380px', width:'90%', textAlign:'center', boxShadow:'0 8px 32px rgba(0,0,0,0.18)' };
const popup   = { ...modal, padding:'2.5rem 2rem' };

export default UserProfile;