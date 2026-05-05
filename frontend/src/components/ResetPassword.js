import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { FaEye, FaEyeSlash } from 'react-icons/fa'; 

function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');

  useEffect(() => {
    if (location.state?.email) {
      setEmail(location.state.email);
    } else {
      navigate('/forgot-password');
    }
  }, [location, navigate]);

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
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          new_password: formData.password
        })
      });

      const data = await response.json();

      if (response.ok) {
        navigate('/login');
      } else {
        setErrors({ submit: data.detail });
      }
    } catch (error) {
      setErrors({ submit: 'Password reset failed. Please try again.' });
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
            
            {errors.submit && <div style={errorAlertStyle}>{errors.submit}</div>}
            
            <form onSubmit={handleSubmit} style={formStyle}>
              <div style={inputGroupStyle}>
                <label style={labelStyle}>New Password</label>
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
                    placeholder="Enter new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={eyeButtonStyle}>
                    {showPassword ? <FaEyeSlash />:<FaEye/>}
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

              <div style={inputGroupStyle}>
                <label style={labelStyle}>Confirm Password</label>
                <div style={passwordContainerStyle}>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    style={{
                      ...inputStyle,
                      paddingRight: '40px',
                      borderColor: errors.confirmPassword ? '#FF6B6B' : '#ddd'
                    }}
                    placeholder="Confirm new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}                    
                    style={eyeButtonStyle}>
                    {showConfirmPassword ? <FaEyeSlash />:<FaEye/>}
                  </button>
                </div>
                {errors.confirmPassword && <span style={errorStyle}>{errors.confirmPassword}</span>}
              </div>

              <button type="submit" disabled={loading} style={submitButtonStyle}>
                {loading ? 'Resetting Password...' : 'Change Password'}
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

      <footer style={footerStyle}>
        <p style={footerTextStyle}>© 2025 Verity-X. All rights reserved.</p>
      </footer>
    </div>
  );
}

// Add error alert style to your existing styles
const errorAlertStyle = {
  backgroundColor: '#FFE6E6',
  color: '#D8000C',
  padding: '10px',
  borderRadius: '5px',
  marginBottom: '1rem',
  fontSize: '0.9rem',
  textAlign: 'center'
};

// Your existing styles remain exactly the same:
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

export default ResetPassword;