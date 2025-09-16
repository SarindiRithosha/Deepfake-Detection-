import React from 'react';

function Footer() {
  return (
    <footer style={footerStyle}>
      <div className="container-fluid">
        {/* Main footer content - Logo and Socials */}
        <div className="d-flex justify-content-between align-items-center py-4">
          {/* Logo on the left */}
          <div>
            <img 
              src={process.env.PUBLIC_URL + "/verityx.png"} 
              alt="Verity-X Logo" 
              width="130" 
              height="40" 
            />
          </div>

          {/* Social media icons on the right */}
          <div style={socialContainerStyle}>
            <a href="#" style={socialLinkStyle}>
              <img 
                src={process.env.PUBLIC_URL + "/facebook.png"} 
                alt="Facebook" 
                width="24" 
                height="24" 
                style={iconStyle}
              />
            </a>
            <a href="#" style={socialLinkStyle}>
              <img 
                src={process.env.PUBLIC_URL + "/linkedin.png"} 
                alt="LinkedIn" 
                width="24" 
                height="24" 
                style={iconStyle}
              />
            </a>
            <a href="#" style={socialLinkStyle}>
              <img 
                src={process.env.PUBLIC_URL + "/github (1).png"} 
                alt="GitHub" 
                width="24" 
                height="24" 
                style={iconStyle}
              />
            </a>
          </div>
        </div>

        {/* Horizontal line with specified color and opacity */}
        <div style={dividerStyle}></div>

        {/* Copyright text */}
        <div style={copyrightStyle}>
          © 2025 Verity-X. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

// CSS Styles
const footerStyle = {
  backgroundColor: '#013D83', // Navy blue background
  color: '#E5E3E3', // Light grey text color
  padding: '0 1rem',
};

const socialContainerStyle = {
  display: 'flex',
  gap: '1.5rem', // Space between social icons
  paddingRight: '20px',
};

const socialLinkStyle = {
  display: 'inline-block',
  transition: 'transform 0.2s ease-in-out',
};

const iconStyle = {
  filter: 'brightness(0) invert(1)', // Makes the icons white
  transition: 'transform 0.2s ease-in-out',
};

// Hover effect for social icons
socialLinkStyle[':hover'] = {
  transform: 'scale(1.1)',
};

const dividerStyle = {
  height: '1px',
  backgroundColor: 'rgba(31, 134, 255, 0.44)', // #1F86FF with 44% opacity
  width: '100%',
  margin: '0',
};

const copyrightStyle = {
  textAlign: 'center',
  color: '#E5E3E3',
  fontWeight: '600', // Semi-bold
  padding: '1.5rem 0',
  fontSize: '0.9rem',
};

// Add hover effects using JavaScript mouse events
const SocialIcon = ({ src, alt, href }) => {
  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <a 
      href={href} 
      style={{...socialLinkStyle, transform: isHovered ? 'scale(1.1)' : 'scale(1)'}}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <img 
        src={process.env.PUBLIC_URL + src} 
        alt={alt} 
        width="24" 
        height="24" 
        style={{
          ...iconStyle,
          transform: isHovered ? 'scale(1.1)' : 'scale(1)'
        }}
      />
    </a>
  );
};

export default Footer;