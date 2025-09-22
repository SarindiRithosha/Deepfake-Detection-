import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

function VerifyReset() {
  const navigate = useNavigate();
  const [code, setCode] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (code.length !== 6) {
      alert('Please enter a valid 6-digit code');
      return;
    }

    // Redirect to reset password page
    navigate('/reset-password');
  };

  return (
    <div style={pageStyle}>
        <header style={headerStyle}>
            <Link to="/" style={logoLinkStyle}>
                <img
                src={process.env.PUBLIC_URL + "/verityx.png"}
                alt="Verity-X Logo"
                width="130"
                height="40"
                />
            </Link>
            </header>

        <main style={mainStyle}>
      <div style={containerStyle}>
        <div style={formContainerStyle}>
          <h1 style={titleStyle}>Verify Your Email</h1>
          
          <form onSubmit={handleSubmit} style={formStyle}>
            <div style={inputGroupStyle}>
              <label style={labelStyle}>Verification Code</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                style={inputStyle}
                placeholder="Enter 6-digit code"
                maxLength="6"
              />
            </div>

            <button type="submit" style={submitButtonStyle}>
              Verify
            </button>
          </form>

          <div style={linksContainerStyle}>
            <p style={resendTextStyle}>
              Didn't receive the code? <button style={resendLinkStyle}>Resend</button>
            </p>
          </div>
        </div>
      </div>
    </main>

      <footer style={footerStyle}>
        <p style={footerTextStyle}>© 2025 Verity-X. All rights reserved.</p>
      </footer>
    </div>
  );
}

const pageStyle = {
  backgroundColor: '#E5E3E3',
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column'
};


const headerStyle = {
  padding: '1.5rem 2rem',
  backgroundColor: '#013D83'
};

const logoLinkStyle = {
  textDecoration: 'none'
};

const mainStyle = {
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '2rem 1rem'
};

const containerStyle = {
  width: '100%',
  maxWidth: '400px'
};

const formContainerStyle = {
  backgroundColor: '#F8F8F8',
  borderRadius: '15px',
  padding: '2.5rem',
  boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
};

const titleStyle = {
  color: '#013D83',
  fontSize: '2rem',
  fontWeight: '700',
  textAlign: 'center',
  marginBottom: '2rem'
};

const formStyle = {
  width: '100%'
};

const inputGroupStyle = {
  marginBottom: '1.5rem'
};

const labelStyle = {
  color: '#747474',
  fontWeight: '600',
  display: 'block',
  marginBottom: '0.5rem',
  fontSize: '0.9rem'
};

const inputStyle = {
  width: '100%',
  padding: '12px 15px',
  border: '1px solid #ddd',
  borderRadius: '8px',
  fontSize: '1rem',
  boxSizing: 'border-box'
};

const submitButtonStyle = {
  backgroundColor: '#013D83',
  color: 'white',
  border: 'none',
  padding: '12px',
  borderRadius: '8px',
  fontSize: '1.1rem',
  fontWeight: '600',
  cursor: 'pointer',
  width: '100%',
  marginTop: '1rem'
};

const linksContainerStyle = {
  textAlign: 'center',
  marginTop: '2rem'
};

const resendTextStyle = {
  color: '#747373ff',
  fontSize: '0.9rem',
  margin: '0'
};

const resendLinkStyle = {
  color: '#013D83',
  background: 'none',
  border: 'none',
  textDecoration: 'underline',
  cursor: 'pointer',
  fontWeight: '600'
};

const footerStyle = {
  backgroundColor: '#013D83',
  padding: '1.5rem 2rem',
  textAlign: 'center'
};

const footerTextStyle = {
  color: 'white',
  margin: '0',
  fontSize: '0.9rem'
};

export default VerifyReset;