import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    if (!email) {
      setError('Email is required');
      setLoading(false);
      return;
    }
    
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Incorrect Email Address');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:8000/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (response.ok) {
        navigate('/verify-reset', { state: { email } });
      } else {
        setError(data.detail);
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
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
            <h1 style={titleStyle}>Reset Your Password</h1>
            <p style={subtitleStyle}>Enter your email to reset your password.</p>
            
            <form onSubmit={handleSubmit} style={formStyle}>
              <div style={inputGroupStyle}>
                <label style={labelStyle}>Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError('');
                  }}
                  style={{
                    ...inputStyle,
                    borderColor: error ? '#FF6B6B' : '#ddd'
                  }}
                  placeholder="Enter your email"
                />
                {error && <span style={errorStyle}>{error}</span>}
              </div>

              <button type="submit" disabled={loading} style={submitButtonStyle}>
                {loading ? 'Sending OTP...' : 'Send Code'}
              </button>
            </form>

            <div style={linksContainerStyle}>
              <p style={loginTextStyle}>
                Remember your password? <Link to="/login" style={loginLinkStyle}>Log In</Link>
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Minimal Footer */}
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
  marginBottom: '0.5rem'
};

const subtitleStyle = {
  color: '#747474',
  textAlign: 'center',
  marginBottom: '2rem',
  fontSize: '1rem'
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
  boxSizing: 'border-box',
  transition: 'border-color 0.3s ease'
};

const errorStyle = {
  color: '#FF6B6B',
  fontSize: '0.8rem',
  marginTop: '0.25rem',
  display: 'block'
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

const loginTextStyle = {
  color: '#747373ff',
  fontSize: '0.9rem',
  margin: '0'
};

const loginLinkStyle = {
  color: '#013D83',
  textDecoration: 'none',
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

export default ForgotPassword;