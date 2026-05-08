import React from 'react';

function Footer() {
  return (
    <footer style={footerStyle}>
      <div className="container-fluid">
        {/* Main footer content */}
        <div className="d-flex justify-content-between align-items-center py-4">
          {/* Logo */}
          <div>
            <img
              src={process.env.PUBLIC_URL + '/verityx.png'}
              alt="Verity-X Logo"
              width="130"
              height="40"
            />
          </div>

          {/* GitHub only */}
          <div style={socialContainerStyle}>
            <SocialIcon
              src="/github (1).png"
              alt="GitHub"
              href="https://github.com"
            />
          </div>
        </div>

        <div style={dividerStyle} />

        <div style={copyrightStyle}>
          © 2025 Verity-X. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

const SocialIcon = ({ src, alt, href }) => {
  const [hovered, setHovered] = React.useState(false);
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{ display: 'inline-block', transform: hovered ? 'scale(1.15)' : 'scale(1)', transition: 'transform 0.2s' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <img
        src={process.env.PUBLIC_URL + src}
        alt={alt}
        width="26"
        height="26"
        style={{ filter: 'brightness(0) invert(1)' }}
      />
    </a>
  );
};

const footerStyle       = { backgroundColor: '#013D83', color: '#E5E3E3', padding: '0 1rem' };
const socialContainerStyle = { display: 'flex', gap: '1.5rem', paddingRight: '20px' };
const dividerStyle      = { height: '1px', backgroundColor: 'rgba(31,134,255,0.44)', width: '100%', margin: 0 };
const copyrightStyle    = { textAlign: 'center', color: '#E5E3E3', fontWeight: '600', padding: '1.5rem 0', fontSize: '0.9rem' };

export default Footer;