import React from 'react';

function About() {
  return (
    <div style={pageStyle}>
      
      {/* ===== TITLE SECTION ===== */}
      <section style={titleSectionStyle}>
        <div style={containerStyle}>
          <h1 style={titleStyle}>About Verity-X</h1>
          <p style={subtitleStyle}>
            Building trust in the digital age through advanced deepfake detection
          </p>
        </div>
      </section>

      {/* ===== MISSION SECTION ===== */}
      <section style={missionSectionStyle}>
        <div style={containerStyle}>
          <h2 style={sectionTitleStyle}>Our Mission</h2>
          <div style={dividerStyle}></div>
          <div style={missionBoxStyle}>
            <p style={missionTextStyle}>
              In an era where digital manipulation has become increasingly sophisticated, the threat
              of deepfakes poses a significant challenge to information integrity and public trust.
              Verity-X was created to combat this growing menace by providing reliable, accurate 
              detection of manipulated media content.<br /><br />
              Our mission is to restore confidence in digital media by empowering users with cutting-
              edge AI technology that can distinguish between authentic and artificially generated 
              content. We believe that truth and transparency are fundamental to a healthy digital ecosystem.
            </p>
          </div>
        </div>
      </section>

      {/* ===== TECHNOLOGY SECTION ===== */}
      <section style={techSectionStyle}>
        <div style={containerStyle}>
          <h2 style={sectionTitleStyle}>The Technology Behind Verity-X</h2>
          <div style={dividerStyle}></div>
          <div style={techBoxesContainer}>
            {/* Model Box */}
            <div style={techBoxStyle}>
              <div style={techHeaderStyle}>
                <img
                  src={process.env.PUBLIC_URL + "/model.png"}
                  alt="AI Model"
                  width="60"
                  height="60"
                  style={techIconStyle}
                />
                <h4 style={techSubtitleStyle}>The Model</h4>
              </div>
              <p style={techTextStyle}>
                Verity-X leverages a sophisticated Convolutional Neural 
                Network (CNN) architecture built upon transfer learning 
                principles. Our model utilizes the proven XceptionNet 
                architecture as its foundation, fine-tuned specifically for 
                deepfake detection tasks to achieve exceptional accuracy 
                and reliability in identifying manipulated content.
              </p>
            </div>

            {/* Data Box */}
            <div style={techBoxStyle}>
              <div style={techHeaderStyle}>
                <img
                  src={process.env.PUBLIC_URL + "/data.png"}
                  alt="Data"
                  width="60"
                  height="60"
                  style={techIconStyle}
                />
                <h4 style={techSubtitleStyle}>The Data</h4>
              </div>
              <p style={techTextStyle}>
                Quality data is the cornerstone of effective machine learning. 
                Verity-X was trained and rigorously tested on industry-
                standard datasets including <strong style={boldStyle}>DFDC (Preview)</strong> and <strong style={boldStyle}>Celeb-
                DF v2 datasets</strong>, ensuring robust performance across diverse 
                scenarios and maintaining the highest standards of detection 
                accuracy.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== DEVELOPER SECTION ===== */}
      <section style={devSectionStyle}>
        <div style={containerStyle}>
          <h2 style={sectionTitleStyle}>Meet the Developer</h2>
          <div style={dividerStyle}></div>
          <div style={devBoxStyle}>
            <img
              src={process.env.PUBLIC_URL + "/Avatar.png"}
              alt="Developer Avatar"
              width="120"
              height="120"
              style={avatarStyle}
            />
            <h3 style={devNameStyle}>Sarindi Rithosha</h3>
            <p style={devRoleStyle}>Final Year Student, Software Engineering</p>
            <p style={devTextStyle}>
              As a software engineering student, I developed Verity-X as my final-year project to tackle the escalating threat of deepfakes. This project is a culmination of my academic journey, where I've leveraged key principles of agile development, DevOps practices, and full-stack architecture. By integrating a robust backend API with a dynamic frontend UI, I've combined my skills in machine learning (ML), computer vision, and cybersecurity into a practical, scalable solution. Verity-X not only demonstrates my proficiency in these technical domains but also my commitment to applying technology to solve critical real-world problems.
            </p>
          </div>
        </div>
      </section>

      {/* ===== CONTACT SECTION ===== */}
      <section style={contactSectionStyle}>
        <div style={containerStyle}>
          <h2 style={sectionTitleStyle}>Contact Us</h2>
          <div style={dividerStyle}></div>
          <p style={contactIntroStyle}>
            Have questions about Verity-X or interested in collaboration? We'd love to hear from you.
          </p>
          <div style={contactBoxesContainer}>
            {/* Email Box */}
            <div style={contactBoxStyle}>
              <img
                src={process.env.PUBLIC_URL + "/mail.png"}
                alt="Email"
                width="50"
                height="50"
                style={contactIconStyle}
              />
              <h4 style={contactSubtitleStyle}>Email</h4>
              <p style={contactTextStyle}>sarindi@verity-x.com</p>
            </div>

            {/* LinkedIn Box */}
            <div style={contactBoxStyle}>
              <img
                src={process.env.PUBLIC_URL + "/linkendin1.png"}
                alt="LinkedIn"
                width="50"
                height="50"
                style={contactIconStyle}
              />
              <h4 style={contactSubtitleStyle}>LinkedIn</h4>
              <p style={contactTextStyle}>Connect with us</p>
            </div>

            {/* GitHub Box */}
            <div style={contactBoxStyle}>
              <img
                src={process.env.PUBLIC_URL + "/github.png"}
                alt="GitHub"
                width="50"
                height="50"
                style={contactIconStyle}
              />
              <h4 style={contactSubtitleStyle}>GitHub</h4>
              <p style={contactTextStyle}>View Our Code</p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== GAP BEFORE FOOTER ===== */}
      <div style={gapStyle}></div>
    </div>
  );
}

// ===== STYLES =====

const pageStyle = {
  backgroundColor: '#E5E3E3',
};

const containerStyle = {
  maxWidth: '1200px',
  margin: '0 auto',
  padding: '0 1rem',
};

// Title Section
const titleSectionStyle = {
  backgroundColor: '#F8F8F8',
  padding: '4rem 0',
  textAlign: 'center',
};

const titleStyle = {
  color: '#013D83',
  fontSize: '3rem',
  fontWeight: '700',
  marginBottom: '1rem',
};

const subtitleStyle = {
  color: '#000',
  fontSize: '1.3rem',
  opacity: '0.8',
  margin: '0',
};

// Mission Section
const missionSectionStyle = {
  backgroundColor: '#E5E3E3',
  padding: '4rem 0',
};

const missionBoxStyle = {
  backgroundColor: '#F8F8F8',
  borderRadius: '15px',
  padding: '3rem',
  marginTop: '2rem',
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  marginRight: '7rem',
  marginLeft: '7rem',
};

const missionTextStyle = {
  color: '#000',
  fontSize: '1.1rem',
  lineHeight: '1.8',
  textAlign: 'left',
  margin: '0',
};

// Technology Section
const techSectionStyle = {
  backgroundColor: '#F8F8F8',
  padding: '4rem 0',
};

const techBoxesContainer = {
  display: 'flex',
  gap: '2rem',
  marginTop: '2rem',
  flexWrap: 'wrap',
  justifyContent: 'center',
};

const techBoxStyle = {
  backgroundColor: '#E5E3E3',
  borderRadius: '15px',
  padding: '2rem',
  flex: '1',
  minWidth: '300px',
  maxWidth: '500px',
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
};

const techHeaderStyle = {
  display: 'flex',
  alignItems: 'center',
  marginBottom: '1.5rem',
};

const techIconStyle = {
  marginRight: '1rem',
};

const techSubtitleStyle = {
  color: '#013D83',
  fontSize: '1.5rem',
  fontWeight: '700',
  margin: '0',
};

const techTextStyle = {
  color: '#000',
  fontSize: '1rem',
  lineHeight: '1.6',
  textAlign: 'left',
  margin: '0',
};

const boldStyle = {
  fontWeight: '700',
  color: '#000',
};

// Developer Section
const devSectionStyle = {
  backgroundColor: '#E5E3E3',
  padding: '4rem 0',
};

const devBoxStyle = {
  backgroundColor: '#F8F8F8',
  borderRadius: '15px',
  padding: '3rem',
  marginTop: '2rem',
  textAlign: 'center',
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
};

const avatarStyle = {
  borderRadius: '50%',
  marginBottom: '1.5rem',
  border: '4px solid #E5E3E3',
};

const devNameStyle = {
  color: '#013D83',
  fontSize: '2rem',
  fontWeight: '700',
  margin: '0 0 0.5rem 0',
};

const devRoleStyle = {
  color: '#A9D6E5',
  fontSize: '1.2rem',
  fontWeight: '600',
  margin: '0 0 1.5rem 0',
};

const devTextStyle = {
  color: '#000',
  fontSize: '1.1rem',
  lineHeight: '1.7',
  textAlign: 'center',
  margin: '0',
};

// Contact Section
const contactSectionStyle = {
  backgroundColor: '#F8F8F8',
  padding: '4rem 0',
};

const contactIntroStyle = {
  color: '#000',
  fontSize: '1.1rem',
  textAlign: 'center',
  margin: '2rem 0 3rem 0',
  opacity: '0.8',
};

const contactBoxesContainer = {
  display: 'flex',
  gap: '2rem',
  justifyContent: 'center',
  flexWrap: 'wrap',
};

const contactBoxStyle = {
  backgroundColor: '#E5E3E3',
  borderRadius: '15px',
  padding: '2rem',
  textAlign: 'center',
  minWidth: '250px',
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  transition: 'transform 0.3s ease',
};

contactBoxStyle[':hover'] = {
  transform: 'translateY(-5px)',
};

const contactIconStyle = {
  marginBottom: '1rem',
};

const contactSubtitleStyle = {
  color: '#013D83',
  fontSize: '1.3rem',
  fontWeight: '700',
  margin: '0 0 0.5rem 0',
};

const contactTextStyle = {
  color: '#000',
  fontSize: '1rem',
  margin: '0',
  opacity: '0.8',
};

// Common Styles
const sectionTitleStyle = {
  color: '#013D83',
  fontSize: '2.5rem',
  fontWeight: '700',
  textAlign: 'center',
  margin: '0 0 1rem 0',
};

const dividerStyle = {
  height: '3px',
  width: '80px',
  backgroundColor: '#013D83',
  margin: '0 auto 2rem auto',
};

// Gap before footer
const gapStyle = {
  height: '60px',
  backgroundColor: '#E5E3E3',
  width: '100%',
};

export default About;