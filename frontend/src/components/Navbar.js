import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function Navbar() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
      setShowDropdown(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleDropdownToggle = () => {
    setShowDropdown(!showDropdown);
  };

  return (
    <nav className="navbar navbar-expand-lg" style={navStyle}>
      <div className="container-fluid">
        <Link className="navbar-brand" to="/">
          <img 
            src={process.env.PUBLIC_URL + "/verityx.png"} 
            alt="Verity-X Logo" 
            width="130" 
            height="40" 
            className="d-inline-block align-text-top" 
          />
        </Link>

        <button 
          className="navbar-toggler" 
          type="button" 
          data-bs-toggle="collapse" 
          data-bs-target="#navbarNav" 
          aria-controls="navbarNav" 
          aria-expanded="false" 
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse justify-content-end" id="navbarNav">
          <ul className="navbar-nav">
            <li className="nav-item">
              <Link className="nav-link" to="/" style={linkStyle}>Home</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/about" style={linkStyle}>About</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/detect" style={linkStyle}>Detect</Link>
            </li>
            <li className="nav-item dropdown" ref={dropdownRef}>
              {currentUser ? (
                <div className="nav-item dropdown">
                  <button 
                    className="nav-link dropdown-toggle d-flex align-items-center" 
                    style={{...linkStyle, background: 'none', border: 'none'}}
                    onClick={handleDropdownToggle}
                  >
                    <img 
                      src={process.env.PUBLIC_URL + "/user-interface (1).png"} 
                      alt="User" 
                      width="24" 
                      height="24" 
                      className="me-2"
                    />
                    {currentUser.email}
                  </button>
                  {showDropdown && (
                    <div className="dropdown-menu show" style={dropdownStyle}>
                      <Link 
                        className="dropdown-item" 
                        to="/profile"
                        onClick={() => setShowDropdown(false)}
                        style={dropdownItemStyle}
                      >
                        User Profile
                      </Link>
                      <Link 
                        className="dropdown-item" 
                        to="/history"
                        onClick={() => setShowDropdown(false)}
                        style={dropdownItemStyle}
                      >
                        Analysis History
                      </Link>
                      <hr style={dropdownDividerStyle} />
                      <button 
                        className="dropdown-item" 
                        onClick={handleLogout}
                        style={logoutButtonStyle}
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link to="/login" className="nav-link" style={linkStyle}>
                  <img 
                    src={process.env.PUBLIC_URL + "/user-interface (1).png"} 
                    alt="Login" 
                    width="24" 
                    height="24" 
                  />
                </Link>
              )}
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}

const navStyle = {
  backgroundColor: '#013D83', 
  padding: '1.2rem 1rem',
};

const linkStyle = {
  color: 'white', 
  fontWeight: '500',
  margin: '0 0.5rem',
  textDecoration: 'none',
  display: 'flex',
  alignItems: 'center'
};

const dropdownStyle = {
  position: 'absolute',
  right: '0',
  top: '100%',
  backgroundColor: 'white',
  borderRadius: '8px',
  boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
  minWidth: '220px',
  padding: '0.5rem 0',
  border: 'none',
  zIndex: 1000
};

const dropdownItemStyle = {
  padding: '0.75rem 1rem',
  color: '#333',
  textDecoration: 'none',
  display: 'block',
  transition: 'background-color 0.3s ease',
  fontSize: '0.9rem',
  border: 'none',
  background: 'none',
  width: '100%',
  textAlign: 'left'
};

const dropdownDividerStyle = {
  margin: '0.5rem 0',
  borderTop: '1px solid #dee2e6'
};

const logoutButtonStyle = {
  ...dropdownItemStyle,
  color: '#dc3545'
};

export default Navbar;