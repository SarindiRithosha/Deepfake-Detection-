import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { loginUser } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

function Login() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Redirect if already logged in
  React.useEffect(() => {
    if (currentUser) {
      navigate('/');
    }
  }, [currentUser, navigate]);

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
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Incorrect Email Address';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setLoading(false);
      return;
    }

    try {
      if (formData.email === 'verityx.team@gmail.com') {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/auth/admin-login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password
          })
        });

        const result = await response.json();

        if (response.ok) {
          // Store admin session
          localStorage.setItem('adminToken', result.token);
          localStorage.setItem('adminUser', JSON.stringify(result.admin));
          navigate('/admin');
        } else {
          throw new Error(result.detail || 'Admin login failed');
        }
      } else {
        // Regular user login with Firebase
        await loginUser(formData.email, formData.password);
        navigate('/');
      }
    } catch (error) {
      console.error('Login error:', error);
      if (error.code === 'auth/invalid-credential' || error.message.includes('Invalid credentials')) {
        setErrors({ submit: 'Invalid email or password' });
      } else if (error.code === 'auth/user-not-found') {
        setErrors({ submit: 'No account found with this email' });
      } else if (error.code === 'auth/wrong-password') {
        setErrors({ submit: 'Incorrect password' });
      } else {
        setErrors({ submit: error.message || 'Login failed. Please try again.' });
      }
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

      {/* Login Form */}
      <main style={mainStyle}>
        <div style={containerStyle}>
          <div style={formContainerStyle}>
            <h1 style={titleStyle}>Log In to Verity-X</h1>
            <p style={subtitleStyle}>Access your past analysis reports and history.</p>
            
            {errors.submit && <div style={errorAlertStyle}>{errors.submit}</div>}
            
            <form onSubmit={handleSubmit} style={formStyle}>
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
                      borderColor: errors.password ? '#FF6B6B' : '#ddd',
                      paddingRight: '40px'
                    }}
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={eyeButtonStyle}
                  >
                    {showPassword ? <FaEyeSlash/> : <FaEye/>}
                  </button>
                </div>
                {errors.password && <span style={errorStyle}>{errors.password}</span>}
              </div>

              <button type="submit" disabled={loading} style={submitButtonStyle}>
                {loading ? 'Logging In...' : 'Log In'}
              </button>
            </form>

            <div style={linksContainerStyle}>
              <Link to="/forgot-password" style={linkStyle}>
                Forgot Password?
              </Link>
              <p style={signupTextStyle}>
                Don't have an account? <Link to="/signup" style={signupLinkStyle}>Sign Up</Link>
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
  marginTop: '1rem',
  transition: 'background-color 0.3s ease'
};

const linksContainerStyle = {
  textAlign: 'center',
  marginTop: '2rem'
};

const linkStyle = {
  color: '#747373ff',
  textDecoration: 'none',
  fontSize: '0.9rem',
  display: 'block',
  marginBottom: '1rem'
};

const signupTextStyle = {
  color: '#747373ff',
  fontSize: '0.9rem',
  margin: '0'
};

const signupLinkStyle = {
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

export default Login;