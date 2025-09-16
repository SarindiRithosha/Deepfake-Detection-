import React from 'react';
import { Link } from 'react-router-dom';

// Navbar functional component
function Navbar() {
  return (
    <nav className="navbar navbar-expand-lg" style={navStyle}>
      <div className="container-fluid">
        {/* Logo on the left */}
        <Link className="navbar-brand" to="/">
          <img 
            src={process.env.PUBLIC_URL + "/verityx.png"} 
            alt="Verity-X Logo" 
            width="130" 
            height="40" 
            className="d-inline-block align-text-top" 
          />
        </Link>

        {/* This button is for toggling the menu on mobile screens */}
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

        {/* Navigation Links and Login - aligned to the right */}
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
            <li className="nav-item">
              {/* Login Button with icon */}
              <button className="btn btn-link nav-link" style={linkStyle}>
                <img 
                  src={process.env.PUBLIC_URL + "/user-interface (1).png"} 
                  alt="Login" 
                  width="24" 
                  height="24" 
                />
              </button>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}

// Inline CSS Styles
const navStyle = {
  backgroundColor: '#013D83', 
  padding: '1.2rem 1rem',
};

const linkStyle = {
  color: 'white', 
  fontWeight: '500',
  margin: '0 0.5rem',
  textDecoration: 'none' 
};

// Make the component available to other files
export default Navbar;