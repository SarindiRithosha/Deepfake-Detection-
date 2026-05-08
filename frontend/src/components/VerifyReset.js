import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';

function VerifyReset() {
  const navigate = useNavigate();
  const location = useLocation();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [timeLeft, setTimeLeft] = useState(120);

  useEffect(() => {
    if (location.state?.email) {
      setEmail(location.state.email);
    } else {
      navigate('/forgot-password');
    }
  }, [location, navigate]);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (code.length !== 6) {
      setError('Please enter 6-digit code');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/auth/verify-password-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          code: code
        })
      });

      const data = await response.json();

      if (response.ok) {
        navigate('/reset-password', { state: { email } });
      } else {
        setError(data.detail);
      }
    } catch (error) {
      setError('Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/auth/resend-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (response.ok) {
        setTimeLeft(120);
        setError('');
        alert('New OTP sent to your email!');
      } else {
        alert('Failed to resend OTP. Please try again.');
      }
    } catch (error) {
      alert('Network error. Please try again.');
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
            <p style={subtitleStyle}>Enter the 6-digit code sent to {email}</p>
            
            {error && <div style={errorAlertStyle}>{error}</div>}
            
            <form onSubmit={handleSubmit} style={formStyle}>
              <div style={inputGroupStyle}>
                <label style={labelStyle}>Verification Code</label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value.replace(/\D/g, '').slice(0, 6));
                    setError('');
                  }}
                  style={{
                    ...inputStyle,
                    borderColor: error ? '#FF6B6B' : '#ddd'
                  }}
                  placeholder="Enter 6-digit code"
                  maxLength="6"
                />
                
                {/* Timer Display */}
                <div style={timerContainerStyle}>
                  <span style={timerLabelStyle}>Time remaining: </span>
                  <span style={{
                    ...timerStyle,
                    color: timeLeft < 30 ? '#FF6B6B' : timeLeft < 60 ? '#FFD166' : '#013D83'
                  }}>
                    {formatTime(timeLeft)}
                  </span>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading || timeLeft === 0} 
                style={{
                  ...submitButtonStyle,
                  backgroundColor: timeLeft === 0 ? '#6c757d' : '#013D83'
                }}
              >
                {loading ? 'Verifying...' : timeLeft === 0 ? 'Code Expired' : 'Verify'}
              </button>
            </form>

            <div style={linksContainerStyle}>
              <p style={resendTextStyle}>
                Didn't receive the code? 
                <button 
                  onClick={handleResendOtp} 
                  style={resendLinkStyle}
                  disabled={timeLeft > 100}
                >
                  Resend
                </button>
              </p>
              <p style={backTextStyle}>
                <Link to="/forgot-password" style={backLinkStyle}>
                  ← Back to Forgot Password
                </Link>
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

const errorAlertStyle = {
  backgroundColor: '#FFE6E6',
  color: '#D8000C',
  padding: '10px',
  borderRadius: '5px',
  marginBottom: '1rem',
  fontSize: '0.9rem',
  textAlign: 'center'
};

const timerContainerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginTop: '0.5rem',
  padding: '0.5rem',
  backgroundColor: '#f8f9fa',
  borderRadius: '5px'
};

const timerLabelStyle = {
  fontSize: '0.8rem',
  color: '#666',
  fontWeight: '600'
};

const timerStyle = {
  fontSize: '0.9rem',
  fontWeight: 'bold'
};

const backTextStyle = {
  marginTop: '1rem',
  fontSize: '0.9rem'
};

const backLinkStyle = {
  color: '#013D83',
  textDecoration: 'none'
};

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
  boxSizing: 'border-box'
};

const submitButtonStyle = {
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