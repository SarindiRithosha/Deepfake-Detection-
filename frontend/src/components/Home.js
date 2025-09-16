import React from 'react';
import { Link } from 'react-router-dom';

function Home() {
  return (
    <div>
      {/* ===== HERO SECTION ===== */}
      <section style={heroStyle}>
        <div className="container">
          <div className="row justify-content-center text-center">
            <div className="col-lg-8">
              <h1 style={heroTitleStyle}>
                Verify Reality.<br />
                <span style={heroTitleBlueStyle}>Uncover Deepfakes.</span>
              </h1>
              <p style={heroSubtitleStyle}>
                Powered by Verity-X's advanced AI, built on DFDC and Celeb-DF v2 datasets<br />
                for unparalleled accuracy in deepfake detection.
              </p>
              <Link to="/detect" style={ctaButtonStyle}>
                <img 
                  src={process.env.PUBLIC_URL + "/search.png"} 
                  alt="Search" 
                  width="20" 
                  height="20" 
                  style={{ marginRight: '10px' }}
                />
                Detect a Deepfake
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS SECTION ===== */}
      <section style={howItWorksStyle}>
        <div className="container">
          <h2 style={sectionTitleStyle}>How It Works</h2>
          <div className="row">
            {/* Step 1 */}
            <div className="col-md-4 text-center mb-4">
              <img src={process.env.PUBLIC_URL + "/video uploaff.png"} alt="Upload" width="80" height="80" style={iconStyle} />
              <h4 style={stepTitleStyle}>Upload Your Video</h4>
              <p style={descriptionStyle}>
                Simply drag and drop your video file or paste a URL. Our system supports all major video formats for seamless analysis.
              </p>
            </div>
            {/* Step 2 */}
            <div className="col-md-4 text-center mb-4">
              <img src={process.env.PUBLIC_URL + "/analysis.png"} alt="AI Analysis" width="80" height="80" style={iconStyle} />
              <h4 style={stepTitleStyle}>AI Analysis</h4>
              <p style={descriptionStyle}>
                Our advanced AI algorithms examine facial movements and temporal inconsistencies to detect manipulation.
              </p>
            </div>
            {/* Step 3 */}
            <div className="col-md-4 text-center mb-4">
              <img src={process.env.PUBLIC_URL + "/report.png"} alt="Report" width="80" height="80" style={iconStyle} />
              <h4 style={stepTitleStyle}>Get a Detailed Report</h4>
              <p style={descriptionStyle}>
                Receive a comprehensive report with confidence scores, visual heatmaps, and detailed explanations of our findings.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== WHY US SECTION ===== */}
      <section style={whyUsStyle}>
        <div className="container">
          <h2 style={sectionTitleStyle}>Why Choose Verity-X?</h2>
          <div className="row">
            {/* Card 1 */}
            <div className="col-md-4 mb-4">
              <div style={cardStyle}>
                <img src={process.env.PUBLIC_URL + "/accuracy.png"} alt="Accuracy" width="80" height="80" style={iconStyle} />
                <h4 style={stepTitleStyle}>The Accuracy</h4>
                <p style={descriptionStyle}>
                  Trained on the most comprehensive datasets with state-of-the-art deep learning models achieving 93% accuracy.
                </p>
              </div>
            </div>
            {/* Card 2 */}
            <div className="col-md-4 mb-4">
              <div style={cardStyle}>
                <img src={process.env.PUBLIC_URL + "/bulb.png"} alt="Explainable AI" width="80" height="80" style={iconStyle} />
                <h4 style={stepTitleStyle}>Explainable AI Reports</h4>
                <p style={descriptionStyle}>
                  Understand exactly why our AI made its decision with visual explanations and detailed confidence metrics.
                </p>
              </div>
            </div>
            {/* Card 3 */}
            <div className="col-md-4 mb-4">
              <div style={cardStyle}>
                <img src={process.env.PUBLIC_URL + "/user exp.png"} alt="User Experience" width="80" height="80" style={iconStyle} />
                <h4 style={stepTitleStyle}>Intuitive User Experience</h4>
                <p style={descriptionStyle}>
                  A simple interface allows anyone to verify videos in just a few clicks.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== TESTIMONIALS SECTION ===== */}
      <section style={testimonialsStyle}>
        <div className="container">
          <h2 style={sectionTitleStyle}>What Our Users Say</h2>
          <div className="row">
            {/* Testimonial 1 */}
            <div className="col-md-4 mb-4">
              <div style={testimonialCardStyle}>
                <p style={testimonialTextStyle}>"A terrific piece of praise"</p>
                <div className="d-flex align-items-center">
                  <img src={process.env.PUBLIC_URL + "/Avatar.png"} alt="User" width="40" height="40" />
                  <span style={{ marginLeft: '10px', fontWeight: '600' }}>User Name</span>
                </div>
              </div>
            </div>
            {/* Testimonial 2 */}
            <div className="col-md-4 mb-4">
              <div style={testimonialCardStyle}>
                <p style={testimonialTextStyle}>"A fantastic bit of feedback"</p>
                <div className="d-flex align-items-center">
                  <img src={process.env.PUBLIC_URL + "/Avatar.png"} alt="User" width="40" height="40" />
                  <span style={{ marginLeft: '10px', fontWeight: '600' }}>User Name</span>
                </div>
              </div>
            </div>
            {/* Testimonial 3 */}
            <div className="col-md-4 mb-4">
              <div style={testimonialCardStyle}>
                <p style={testimonialTextStyle}>"A genuinely glowing review"</p>
                <div className="d-flex align-items-center">
                  <img src={process.env.PUBLIC_URL + "/Avatar.png"} alt="User" width="40" height="40" />
                  <span style={{ marginLeft: '10px', fontWeight: '600' }}>User Name</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div style={gapStyle}></div>


      {/* ===== CTA SECTION ===== */}
      <section style={ctaSectionStyle}>
        <div className="container">
          <div className="row justify-content-center text-center">
            <div className="col-lg-8">
              <h2 style={ctaTitleStyle}>Ready to Detect Deepfakes?</h2>
              <p style={ctaTextStyle}>
                Join thousands of users who trust Verity-X for reliable deepfake detection.
              </p>
              <Link to="/detect" style={ctaButtonStyle2}>
                Start Detection Now
              </Link>
            </div>
          </div>
        </div>
        {/* Horizontal Line Separator */}
        <div style={dividerStyle}></div>
      </section>
    </div>
  );
}

// ===== STYLES =====

// Hero Section
const heroStyle = {
  backgroundColor: '#E5E3E3',
  padding: '6rem 0',
  textAlign: 'center'
};

const heroTitleStyle = {
  fontSize: '3.5rem',
  fontWeight: '700',
  marginBottom: '1.5rem',
  color: '#000'
};

const heroTitleBlueStyle = {
  color: '#013D83'
};

const heroSubtitleStyle = {
  fontSize: '1.2rem',
  color: 'rgba(0, 0, 0, 0.75)',
  marginBottom: '2.5rem',
  lineHeight: '1.6'
};

const ctaButtonStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  backgroundColor: '#013D83',
  color: 'white',
  padding: '12px 30px',
  borderRadius: '8px',
  textDecoration: 'none',
  fontWeight: '600',
  fontSize: '1.1rem',
  transition: 'all 0.3s ease'
};

// How It Works Section
const howItWorksStyle = {
  backgroundColor: '#F8F8F8',
  padding: '5rem 0'
};

// Why Us Section
const whyUsStyle = {
  backgroundColor: '#E5E3E3',
  padding: '5rem 0'
};

// Common Section Styles
const sectionTitleStyle = {
  color: '#013D83',
  textAlign: 'center',
  marginBottom: '3rem',
  fontWeight: '700',
  fontSize: '2.5rem'
};

const iconStyle = {
  marginBottom: '1.5rem'
};

const stepTitleStyle = {
  color: '#000',
  fontWeight: '600',
  marginBottom: '1rem',
  fontSize: '1.3rem'
};

const descriptionStyle = {
  color: '#000',
  lineHeight: '1.6'
};

// Card Styles
const cardStyle = {
  backgroundColor: '#F8F8F8',
  borderRadius: '35px',
  padding: '2.5rem 2rem',
  height: '100%',
  textAlign: 'center',
  boxShadow: '0 5px 15px rgba(0,0,0,0.08)'
};

// Testimonials Section
const testimonialsStyle = {
  backgroundColor: '#F8F8F8',
  padding: '5rem 0'
};

const testimonialCardStyle = {
  backgroundColor: 'white',
  borderRadius: '20px',
  padding: '2rem',
  height: '100%',
  boxShadow: '0 5px 15px rgba(0,0,0,0.08)'
};

const testimonialTextStyle = {
  color: '#000',
  fontStyle: 'italic',
  marginBottom: '1.5rem',
  fontSize: '1.1rem'
};

// Gap Style
const gapStyle = {
  height: '61px', 
  backgroundColor: '#E5E3E3',
  width: '100%'
};

// CTA Section
const ctaSectionStyle = {
  backgroundColor: '#013D83',
  padding: '5rem 0 0 0',
  position: 'relative'
};

const ctaTitleStyle = {
  color: 'white',
  fontWeight: '700',
  marginBottom: '1rem',
  fontSize: '2.5rem'
};

const ctaTextStyle = {
  color: 'white',
  marginBottom: '2rem',
  fontSize: '1.2rem'
};

const ctaButtonStyle2 = {
  display: 'inline-block',
  backgroundColor: 'white',
  color: '#013D83',
  padding: '12px 30px',
  borderRadius: '8px',
  textDecoration: 'none',
  fontWeight: '600',
  fontSize: '1.1rem',
  transition: 'all 0.3s ease'
};

// Divider Style (reused from Footer)
const dividerStyle = {
  height: '1px',
  backgroundColor: 'rgba(31, 134, 255, 0.44)',
  width: '100%',
  margin: '4rem 0 0 0'
};

// Add hover effects
ctaButtonStyle[':hover'] = {
  transform: 'translateY(-2px)',
  boxShadow: '0 5px 15px rgba(0,0,0,0.2)',
  color: 'white'
};

ctaButtonStyle2[':hover'] = {
  transform: 'translateY(-2px)',
  boxShadow: '0 5px 15px rgba(0,0,0,0.2)',
  color: '#013D83'
};

export default Home;