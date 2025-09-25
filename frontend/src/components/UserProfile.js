import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaEnvelope, FaSignOutAlt, FaUpload, FaTrash, FaEdit, FaBold, FaItalic, FaUnderline, FaCheckCircle } from 'react-icons/fa';

function UserProfile() {
    const { currentUser, userProfile, logout } = useAuth();
    const navigate = useNavigate();
    const [activeSection, setActiveSection] = useState('profile');
    const [userData, setUserData] = useState({
        name: '',
        email: '',
        uploadsRemaining: 0,
        maxUploads: 50
    });
    const [isEditingName, setIsEditingName] = useState(false);
    const [tempName, setTempName] = useState('');
    const [contactForm, setContactForm] = useState({
        subject: '',
        message: ''
    });
    const [showNameConfirm, setShowNameConfirm] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showSuccessPopup, setShowSuccessPopup] = useState(false);


    // Redirect if not logged in
    useEffect(() => {
        if (!currentUser) {
            navigate('/login');
        }
    }, [currentUser, navigate]);

    // Load user data
    useEffect(() => {
        if (userProfile) {
            setUserData({
                name: userProfile.name || 'User',
                email: userProfile.email || currentUser?.email || '',
                uploadsRemaining: userProfile.max_uploads - (userProfile.analysis_count || 0),
                maxUploads: userProfile.max_uploads || 50
            });
            setTempName(userProfile.name || 'User');
        }
    }, [userProfile, currentUser]);

    const handleNameEdit = () => {
        setIsEditingName(true);
        setTempName(userData.name);
    };

    const handleNameSave = () => {
        setShowNameConfirm(true);
    };

    const confirmNameChange = async () => {
        try {
            // Update name in backend
            const token = await currentUser.getIdToken();
            const response = await fetch(`http://localhost:8000/auth/user/${currentUser.uid}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name: tempName })
            });

            if (response.ok) {
                setUserData(prev => ({ ...prev, name: tempName }));
                setIsEditingName(false);
            }
        } catch (error) {
            console.error('Error updating name:', error);
        }
        setShowNameConfirm(false);
    };

    const cancelNameChange = () => {
        setTempName(userData.name);
        setIsEditingName(false);
        setShowNameConfirm(false);
    };

    const handleContactSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = await currentUser.getIdToken();
            const response = await fetch('http://localhost:8000/contact', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    subject: contactForm.subject,
                    message: contactForm.message,
                    userEmail: userData.email,
                    userName: userData.name
                })
            });

            if (response.ok) {
                setShowSuccessPopup(true);
                setContactForm({ subject: '', message: '' });
            } else {
               // alert('Failed to send message. Please try again.');
            }
        } catch (error) {
            console.error('Error sending message:', error);
           // alert('Error sending message. Please try again.');
        }
    };

    const handleDeleteAccount = async () => {
        try {
            const token = await currentUser.getIdToken();
            const response = await fetch(`http://localhost:8000/auth/user/${currentUser.uid}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                await logout();
                navigate('/');
                alert('Account deleted successfully.');
            }
        } catch (error) {
            console.error('Error deleting account:', error);
            alert('Error deleting account. Please try again.');
        }
        setShowDeleteConfirm(false);
    };

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    const formatText = (format) => {
        const textarea = document.getElementById('messageTextarea');
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = contactForm.message.substring(start, end);
        
        let formattedText = '';
        switch (format) {
            case 'bold':
                formattedText = `**${selectedText}**`;
                break;
            case 'italic':
                formattedText = `*${selectedText}*`;
                break;
            case 'underline':
                formattedText = `__${selectedText}__`;
                break;
            default:
                formattedText = selectedText;
        }
        
        const newMessage = contactForm.message.substring(0, start) + formattedText + contactForm.message.substring(end);
        setContactForm(prev => ({ ...prev, message: newMessage }));
    };

    if (!currentUser) {
        return <div>Loading...</div>;
    }

    return (
        <div style={pageStyle}>
             {showSuccessPopup && (
                <div style={modalOverlayStyle}>
                    <div style={successPopupStyle}>
                        <FaCheckCircle style={successIconStyle} />
                        <h3 style={successTitleStyle}>Message Sent Successfully</h3>
                        <p style={successMessageStyle}>Thank you for contacting us. We'll get back to you soon!</p>
                        <button 
                            onClick={() => setShowSuccessPopup(false)}
                            style={successButtonStyle}
                        >
                            OK
                        </button>
                    </div>
                </div>
            )}

            {/* Confirmation Modals */}
            {showNameConfirm && (
                <div style={modalOverlayStyle}>
                    <div style={modalStyle}>
                        <h3>Confirm Name Change</h3>
                        <p>Are you sure you want to change your name to "{tempName}"?</p>
                        <div style={modalButtonContainerStyle}>
                            <button onClick={confirmNameChange} style={confirmButtonStyle}>Yes, Change</button>
                            <button onClick={cancelNameChange} style={cancelButtonStyle}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            {showDeleteConfirm && (
                <div style={modalOverlayStyle}>
                    <div style={modalStyle}>
                        <h3>Delete Account</h3>
                        <p>Are you sure you want to permanently delete your account? This action cannot be undone.</p>
                        <div style={modalButtonContainerStyle}>
                            <button onClick={handleDeleteAccount} style={deleteAccountButtonStyle}>Delete Account</button>
                            <button onClick={() => setShowDeleteConfirm(false)} style={cancelButtonStyle}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            <div style={containerStyle}>
                {/* Sidebar Navigation */}
                <div style={sidebarStyle}>
                    {/* Profile Header */}
                    <div style={profileHeaderStyle}>
                        <div style={avatarContainerStyle}>
                            <div style={avatarStyle}>
                                {userData.name ? userData.name.charAt(0).toUpperCase() : 'U'}
                            </div>
                        </div>
                        <div style={profileInfoStyle}>
                            <h3 style={userNameStyle}>{userData.name}</h3>
                            <p style={userEmailStyle}>{userData.email}</p>
                        </div>
                    </div>

                    {/* Navigation Buttons */}
                    <div style={navButtonsStyle}>
                        <button 
                            onClick={() => setActiveSection('profile')}
                            style={activeSection === 'profile' ? activeNavButtonStyle : navButtonStyle}
                        >
                            <FaUser style={navIconStyle} />
                            My Profile
                        </button>
                        
                        <button 
                            onClick={() => setActiveSection('contact')}
                            style={activeSection === 'contact' ? activeNavButtonStyle : navButtonStyle}
                        >
                            <FaEnvelope style={navIconStyle} />
                            Contact Us
                        </button>
                        
                        <button 
                            onClick={handleLogout}
                            style={navButtonStyle}
                        >
                            <FaSignOutAlt style={navIconStyle} />
                            Log Out
                        </button>
                    </div>
                </div>

                {/* Main Content */}
                <div style={contentStyle}>
                    {activeSection === 'profile' ? (
                        /* My Profile Content */
                        <div>
                            <h1 style={sectionTitleStyle}>My Profile</h1>
                            
                            {/* Personal Information Card */}
                            <div style={cardStyle}>
                                <h2 style={cardTitleStyle}>Personal Information</h2>
                                <div style={formStyle}>
                                    <div style={inputGroupStyle}>
                                        <label style={labelStyle}>Full Name</label>
                                        <div style={inputContainerStyle}>
                                            <input
                                                type="text"
                                                value={isEditingName ? tempName : userData.name}
                                                onChange={(e) => setTempName(e.target.value)}
                                                onKeyPress={(e) => e.key === 'Enter' && handleNameSave()}
                                                disabled={!isEditingName}
                                                style={inputStyle}
                                            />
                                            <button 
                                                onClick={isEditingName ? handleNameSave : handleNameEdit}
                                                style={editButtonStyle}
                                            >
                                                <FaEdit />
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <div style={inputGroupStyle}>
                                        <label style={labelStyle}>Email Address</label>
                                        <input
                                            type="email"
                                            value={userData.email}
                                            disabled
                                            style={{...inputStyle, backgroundColor: '#f0f0f0'}}
                                        />
                                    </div>
                                    
                                    <div style={inputGroupStyle}>
                                        <label style={labelStyle}>Password</label>
                                        <div style={passwordContainerStyle}>
                                            <input
                                                type="password"
                                                value="••••••••"
                                                disabled
                                                style={{...inputStyle, backgroundColor: '#f0f0f0'}}
                                            />
                                            <button 
                                                onClick={() => navigate('/forgot-password')}
                                                style={changePasswordButtonStyle}
                                            >
                                                Change Password
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Account Status Card */}
                            <div style={cardStyle}>
                                <h2 style={cardTitleStyle}>Account Status</h2>
                                <div style={statusBoxStyle}>
                                    <div style={statusContentStyle}>
                                        <FaUpload style={uploadIconStyle} />
                                        <span style={statusTextStyle}>Uploads Remaining</span>
                                    </div>
                                    <div style={uploadCountStyle}>
                                        <span style={remainingCountStyle}>{userData.uploadsRemaining}</span>
                                        <span style={countSeparatorStyle}>/</span>
                                        <span style={maxCountStyle}>{userData.maxUploads}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Account Actions Card */}
                            <div style={cardStyle}>
                                <h2 style={cardTitleStyle}>Account Actions</h2>
                                <div style={actionsContainerStyle}>
                                    <button 
                                        onClick={() => setShowDeleteConfirm(true)}
                                        style={deleteButtonStyle}
                                    >
                                        <FaTrash style={actionIconStyle} />
                                        Delete Account
                                    </button>
                                    <button 
                                        onClick={handleLogout}
                                        style={logoutButtonStyle}
                                    >
                                        <FaSignOutAlt style={actionIconStyle} />
                                        Log Out
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* Contact Us Content */
                        <div>
                            <h1 style={sectionTitleStyle}>Contact Us</h1>
                            <div style={cardStyle}>
                                <form onSubmit={handleContactSubmit} style={contactFormStyle}>
                                    <div style={inputGroupStyle}>
                                        <label style={labelStyle}>Subject</label>
                                        <input
                                            type="text"
                                            value={contactForm.subject}
                                            onChange={(e) => setContactForm(prev => ({...prev, subject: e.target.value}))}
                                            style={inputStyle}
                                            placeholder="Enter subject"
                                            required
                                        />
                                    </div>
                                    
                                    <div style={inputGroupStyle}>
                                        <label style={labelStyle}>Message</label>
                                        
                                        {/* Text Formatting Toolbar */}
                                        <div style={toolbarStyle}>
                                            <button type="button" onClick={() => formatText('bold')} style={formatButtonStyle}>
                                                <FaBold />
                                            </button>
                                            <button type="button" onClick={() => formatText('italic')} style={formatButtonStyle}>
                                                <FaItalic />
                                            </button>
                                            <button type="button" onClick={() => formatText('underline')} style={formatButtonStyle}>
                                                <FaUnderline />
                                            </button>
                                        </div>
                                        
                                        <textarea
                                            id="messageTextarea"
                                            value={contactForm.message}
                                            onChange={(e) => setContactForm(prev => ({...prev, message: e.target.value}))}
                                            style={{...inputStyle, ...textareaStyle}}
                                            placeholder="Type your message here..."
                                            rows="8"
                                            required
                                        />
                                    </div>
                                    
                                    <button type="submit" style={sendButtonStyle}>
                                        Send Message
                                    </button>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

const successPopupStyle = {
    backgroundColor: 'white',
    padding: '3rem 2rem',
    borderRadius: '15px',
    maxWidth: '400px',
    width: '90%',
    textAlign: 'center',
    boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
};

const successIconStyle = {
    color: '#28a745',
    fontSize: '4rem',
    marginBottom: '1.5rem'
};

const successTitleStyle = {
    color: '#28a745',
    fontSize: '1.5rem',
    fontWeight: 'bold',
    marginBottom: '1rem'
};

const successMessageStyle = {
    color: '#666',
    fontSize: '1rem',
    marginBottom: '2rem',
    lineHeight: '1.5'
};

const successButtonStyle = {
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    padding: '0.75rem 2rem',
    borderRadius: '8px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.3s ease'
};

const pageStyle = {
    backgroundColor: '#E5E3E3',
    minHeight: '100vh',
    padding: '2rem'
};

const containerStyle = {
    display: 'flex',
    maxWidth: '1200px',
    margin: '0 auto',
    backgroundColor: 'white',
    borderRadius: '15px',
    overflow: 'hidden',
    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
    minHeight: '80vh'
};

const sidebarStyle = {
    width: '350px',
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    padding: '2rem',
    borderRight: '1px solid #e0e0e0'
};

const profileHeaderStyle = {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '2rem',
    paddingBottom: '1.5rem',
    borderBottom: '1px solid #e0e0e0'
};

const avatarContainerStyle = {
    marginRight: '1rem'
};

const avatarStyle = {
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    backgroundColor: '#013D83',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px',
    fontWeight: 'bold'
};

const profileInfoStyle = {
    flex: 1
};

const userNameStyle = {
    margin: '0 0 0.25rem 0',
    color: 'black',
    fontWeight: 'bold',
    fontSize: '1.2rem'
};

const userEmailStyle = {
    margin: '0',
    color: '#6D6D6D',
    fontSize: '0.9rem'
};

const navButtonsStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem'
};

const navButtonStyle = {
    display: 'flex',
    alignItems: 'center',
    padding: '0.75rem 1rem',
    backgroundColor: 'transparent',
    border: 'none',
    color: '#6D6D6D',
    fontSize: '1rem',
    cursor: 'pointer',
    borderRadius: '5px',
    transition: 'all 0.3s ease'
};

const activeNavButtonStyle = {
    ...navButtonStyle,
    backgroundColor: '#013D83',
    color: 'white'
};

const navIconStyle = {
    marginRight: '0.75rem',
    fontSize: '1.1rem'
};

const contentStyle = {
    flex: 1,
    backgroundColor: '#FAFAFA',
    padding: '2rem',
    overflowY: 'auto'
};

const sectionTitleStyle = {
    color: 'black',
    fontWeight: 'bold',
    fontSize: '2rem',
    marginBottom: '2rem',
    textAlign: 'left'
};

const cardStyle = {
    backgroundColor: '#FAFAFA',
    border: '1px solid #e0e0e0',
    borderRadius: '7px',
    padding: '1.5rem',
    marginBottom: '1.5rem'
};

const cardTitleStyle = {
    color: 'black',
    fontWeight: 'bold',
    fontSize: '1.3rem',
    marginBottom: '1rem',
    textAlign: 'left'
};

const formStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem'
};

const inputGroupStyle = {
    display: 'flex',
    flexDirection: 'column'
};

const labelStyle = {
    color: 'black',
    fontWeight: 'normal',
    marginBottom: '0.5rem',
    fontSize: '1rem'
};

const inputContainerStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
};

const inputStyle = {
    flex: 1,
    padding: '0.75rem',
    backgroundColor: '#FAFAFA',
    border: '1px solid #e0e0e0',
    borderRadius: '5px',
    fontSize: '1rem'
};

const editButtonStyle = {
    backgroundColor: 'transparent',
    border: 'none',
    color: '#6D6D6D',
    cursor: 'pointer',
    padding: '0.5rem',
    borderRadius: '3px',
    fontSize: '1.1rem'
};

const passwordContainerStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
};

const changePasswordButtonStyle = {
    backgroundColor: '#013D83',
    color: 'white',
    border: 'none',
    padding: '0.75rem 1.5rem',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    whiteSpace: 'nowrap'
};

const statusBoxStyle = {
    backgroundColor: 'rgba(216, 234, 255, 0.35)',
    padding: '1.5rem',
    borderRadius: '7px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
};

const statusContentStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem'
};

const uploadIconStyle = {
    color: '#013D83',
    fontSize: '1.5rem'
};

const statusTextStyle = {
    color: 'black',
    fontWeight: '600',
    fontSize: '1.1rem'
};

const uploadCountStyle = {
    display: 'flex',
    alignItems: 'baseline',
    gap: '0.25rem'
};

const remainingCountStyle = {
    color: '#013D83',
    fontWeight: 'bold',
    fontSize: '2rem'
};

const countSeparatorStyle = {
    color: '#6D6D6D',
    fontSize: '1.5rem',
    margin: '0 0.25rem'
};

const maxCountStyle = {
    color: '#6D6D6D',
    fontSize: '1.2rem'
};

const actionsContainerStyle = {
    display: 'flex',
    gap: '1rem'
};

const deleteButtonStyle = {
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    padding: '0.75rem 1.5rem',
    borderRadius: '5px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '1rem'
};

const logoutButtonStyle = {
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    padding: '0.75rem 1.5rem',
    borderRadius: '5px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '1rem'
};

const actionIconStyle = {
    fontSize: '1rem'
};

const contactFormStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem'
};

const toolbarStyle = {
    display: 'flex',
    gap: '0.5rem',
    marginBottom: '0.5rem'
};

const formatButtonStyle = {
    backgroundColor: 'transparent',
    border: '1px solid #e0e0e0',
    padding: '0.5rem',
    borderRadius: '3px',
    cursor: 'pointer',
    fontSize: '1rem',
    color: '#6D6D6D'
};

const textareaStyle = {
    resize: 'vertical',
    minHeight: '150px'
};

const sendButtonStyle = {
    backgroundColor: '#013D83',
    color: 'white',
    border: 'none',
    padding: '0.75rem 2rem',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '1rem',
    alignSelf: 'flex-end',
    marginTop: '1rem'
};

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

const modalButtonContainerStyle = {
    display: 'flex',
    gap: '1rem',
    justifyContent: 'center',
    marginTop: '1.5rem'
};

const confirmButtonStyle = {
    backgroundColor: '#013D83',
    color: 'white',
    border: 'none',
    padding: '0.75rem 1.5rem',
    borderRadius: '5px',
    cursor: 'pointer'
};

const cancelButtonStyle = {
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    padding: '0.75rem 1.5rem',
    borderRadius: '5px',
    cursor: 'pointer'
};

const deleteAccountButtonStyle = {
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    padding: '0.75rem 1.5rem',
    borderRadius: '5px',
    cursor: 'pointer'
};

export default UserProfile;