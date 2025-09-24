import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';

function Signup() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [otpEmail, setOtpEmail] = useState('');
  const [loading, setLoading] = useState(false);

  // Redirect if already logged in
  React.useEffect(() => {
    if (currentUser) {
      navigate('/');
    }
  }, [currentUser, navigate]);

  const getPasswordStrength = (password) => {
    if (password.length === 0) return { strength: 0, label: '' };
    if (password.length < 6) return { strength: 1, label: 'Weak' };
    if (password.length < 8) return { strength: 2, label: 'Medium' };
    return { strength: 3, label: 'Strong' };
  };

  const passwordStrength = getPasswordStrength(formData.password);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    if (errors[e.target.name]) {
      setErrors({
        ...errors,
        [e.target.name]: ''
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email address';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:8000/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        setOtpEmail(formData.email);
        setShowVerification(true);
        setErrors({});
      } else {
        setErrors({ submit: data.detail });
      }
    } catch (error) {
      setErrors({ submit: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleVerification = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (verificationCode.length !== 6) {
      setErrors({ otp: 'Please enter 6-digit code' });
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:8000/auth/verify-signup-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: otpEmail,
          code: verificationCode
        })
      });

      const data = await response.json();

      if (response.ok) {
        alert('Registration successful! Please login with your credentials.');
        navigate('/login');
      } else {
        setErrors({ otp: data.detail });
      }
    } catch (error) {
      setErrors({ otp: 'Verification failed. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    try {
      const response = await fetch('http://localhost:8000/auth/resend-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: otpEmail })
      });

      const data = await response.json();

      if (response.ok) {
        alert('New OTP sent to your email!');
        setErrors({});
      } else {
        alert('Failed to resend OTP. Please try again.');
      }
    } catch (error) {
      alert('Network error. Please try again.');
    }
  };

  return (
    <div style={pageStyle}>
      {/* Minimal Header with Logo */}
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

      {/* Signup Form */}
      <main style={mainStyle}>
        <div style={containerStyle}>
          <div style={formContainerStyle}>
            <h1 style={titleStyle}>Create Your<br />Verity-X Account</h1>
            
            {errors.submit && <div style={errorAlertStyle}>{errors.submit}</div>}
            
            <form onSubmit={handleSubmit} style={formStyle}>
              <div style={inputGroupStyle}>
                <label style={labelStyle}>Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  style={{
                    ...inputStyle,
                    borderColor: errors.name ? '#FF6B6B' : '#ddd'
                  }}
                  placeholder="Enter your full name"
                />
                {errors.name && <span style={errorStyle}>{errors.name}</span>}
              </div>

              <div style={inputGroupStyle}>
                <label style={labelStyle}>Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  style={{
                    ...inputStyle,
                    borderColor: errors.email ? '#FF6B6B' : '#ddd'
                  }}
                  placeholder="Enter your email"
                />
                {errors.email && <span style={errorStyle}>{errors.email}</span>}
              </div>

              <div style={inputGroupStyle}>
                <label style={labelStyle}>Password</label>
                <div style={passwordContainerStyle}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    style={{
                      ...inputStyle,
                      paddingRight: '40px',
                      borderColor: errors.password ? '#FF6B6B' : '#ddd'
                    }}
                    placeholder="Create a password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                     style={eyeButtonStyle} >
                      {showPassword ? <FaEyeSlash/>:<FaEye/>}
                  </button>
                </div>
                
                {/* Password Strength Indicator */}
                {formData.password && (
                  <div style={strengthContainerStyle}>
                    <div style={strengthBarStyle}>
                      <div style={{
                        ...strengthFillStyle,
                        width: `${(passwordStrength.strength / 3) * 100}%`,
                        backgroundColor: passwordStrength.strength === 1 ? '#FF6B6B' : 
                                        passwordStrength.strength === 2 ? '#FFD166' : '#06D6A0'
                      }}></div>
                    </div>
                    <span style={{
                      ...strengthTextStyle,
                      color: passwordStrength.strength === 1 ? '#FF6B6B' : 
                             passwordStrength.strength === 2 ? '#FFD166' : '#06D6A0'
                    }}>
                      {passwordStrength.label}
                    </span>
                  </div>
                )}
                
                {errors.password && <span style={errorStyle}>{errors.password}</span>}
              </div>

              <button type="submit" disabled={loading} style={submitButtonStyle}>
                {loading ? 'Sending OTP...' : 'Create Account'}
              </button>
            </form>

            <div style={linksContainerStyle}>
              <p style={loginTextStyle}>
                Already have an account? <Link to="/login" style={loginLinkStyle}>Log In</Link>
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Email Verification Popup */}
      {showVerification && (
        <div style={popupOverlayStyle}>
          <div style={popupContainerStyle}>
            <img
              src={process.env.PUBLIC_URL + "/verifyemail.png"}
              alt="Verify Email"
              width="80"
              height="80"
              style={popupIconStyle}
            />
            <h2 style={popupTitleStyle}>Verify Your Email</h2>
            <p style={popupTextStyle}>
              We've sent a 6-digit code to <strong>{otpEmail}</strong>.<br />
              Enter it below to verify your account. The code expires in <strong>2 minutes</strong>.
            </p>
            
            {errors.otp && <div style={errorAlertStyle}>{errors.otp}</div>}
            
            <form onSubmit={handleVerification} style={formStyle}>
              <div style={inputGroupStyle}>
                <label style={labelStyle}>Verification Code</label>
                <input
                  type="text"
                  maxLength="6"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                  style={{
                    ...inputStyle,
                    borderColor: errors.otp ? '#FF6B6B' : '#ddd'
                  }}
                  placeholder="Enter 6-digit code"
                />
              </div>

              <button type="submit" disabled={loading} style={submitButtonStyle}>
                {loading ? 'Verifying...' : 'Verify'}
              </button>
            </form>

            <div style={linksContainerStyle}>
              <p style={resendTextStyle}>
                Didn't receive the code? <button 
                  type="button" 
                  onClick={handleResendOtp} 
                  style={resendLinkStyle}
                >
                  Resend
                </button>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Minimal Footer */}
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
  boxSizing: 'border-box',
  transition: 'border-color 0.3s ease'
};

const passwordContainerStyle = {
  position: 'relative'
};

const eyeButtonStyle = {
  position: 'absolute',
  right: '10px',
  top: '50%',
  transform: 'translateY(-50%)',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  fontSize: '1.2rem',
  color: '#747474'
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

const strengthContainerStyle = {
  marginTop: '0.5rem'
};

const strengthBarStyle = {
  width: '100%',
  height: '4px',
  backgroundColor: '#ddd',
  borderRadius: '2px',
  marginBottom: '0.25rem'
};

const strengthFillStyle = {
  height: '100%',
  borderRadius: '2px',
  transition: 'all 0.3s ease'
};

const strengthTextStyle = {
  fontSize: '0.8rem',
  fontWeight: '600'
};

const popupOverlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000
};

const popupContainerStyle = {
  backgroundColor: '#F8F8F8',
  borderRadius: '15px',
  padding: '2.5rem',
  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
  maxWidth: '400px',
  width: '90%'
};

const popupIconStyle = {
  display: 'block',
  margin: '0 auto 1rem'
};

const popupTitleStyle = {
  color: '#013D83',
  fontSize: '1.5rem',
  fontWeight: '700',
  textAlign: 'center',
  marginBottom: '1rem'
};

const popupTextStyle = {
  color: '#747373ff',
  textAlign: 'center',
  marginBottom: '2rem',
  fontSize: '0.9rem',
  lineHeight: '1.4'
};

const resendTextStyle = {
  color: '#747373ff',
  fontSize: '0.9rem',
  margin: '1rem 0 0 0'
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

export default Signup;