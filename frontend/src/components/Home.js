import React from 'react';
import { Link } from 'react-router-dom';

function Home() {
  return (
    <div>

      {/* ── HERO ── */}
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
                for reliable deepfake detection.
              </p>
              <Link to="/detect" style={ctaButtonStyle}>
                <img
                  src={process.env.PUBLIC_URL + '/search.png'}
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

      {/* ── HOW IT WORKS ── */}
      <section style={howItWorksStyle}>
        <div className="container">
          <h2 style={sectionTitleStyle}>How It Works</h2>
          <div className="row">
            <div className="col-md-4 text-center mb-4">
              <img src={process.env.PUBLIC_URL + '/video uploaff.png'} alt="Upload" width="80" height="80" style={iconStyle} />
              <h4 style={stepTitleStyle}>Upload Your Video</h4>
              <p style={descriptionStyle}>
                Drag and drop your video file or paste a URL. Supports all major video formats for seamless analysis.
              </p>
            </div>
            <div className="col-md-4 text-center mb-4">
              <img src={process.env.PUBLIC_URL + '/analysis.png'} alt="AI Analysis" width="80" height="80" style={iconStyle} />
              <h4 style={stepTitleStyle}>AI Analysis</h4>
              <p style={descriptionStyle}>
                Our advanced AI examines facial movements and temporal inconsistencies frame by frame to detect manipulation.
              </p>
            </div>
            <div className="col-md-4 text-center mb-4">
              <img src={process.env.PUBLIC_URL + '/report.png'} alt="Report" width="80" height="80" style={iconStyle} />
              <h4 style={stepTitleStyle}>Get a Detailed Report</h4>
              <p style={descriptionStyle}>
                Receive a comprehensive report with confidence scores, visual heatmaps, and a downloadable PDF.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── WHY VERITY-X ── */}
      <section style={whyUsStyle}>
        <div className="container">
          <h2 style={sectionTitleStyle}>Why Choose Verity-X?</h2>
          <div className="row">
            <div className="col-md-4 mb-4">
              <div style={cardStyle}>
                <img src={process.env.PUBLIC_URL + '/accuracy.png'} alt="Accuracy" width="80" height="80" style={iconStyle} />
                <h4 style={stepTitleStyle}>Research-Backed Accuracy</h4>
                <p style={descriptionStyle}>
                  Trained on the DFDC benchmark dataset with EfficientNet-B4, achieving 85.84% accuracy and AUC-ROC of 0.9307.
                </p>
              </div>
            </div>
            <div className="col-md-4 mb-4">
              <div style={cardStyle}>
                <img src={process.env.PUBLIC_URL + '/bulb.png'} alt="Explainable AI" width="80" height="80" style={iconStyle} />
                <h4 style={stepTitleStyle}>Explainable AI Reports</h4>
                <p style={descriptionStyle}>
                  Understand exactly why our AI made its decision with Grad-CAM heatmaps and detailed confidence metrics.
                </p>
              </div>
            </div>
            <div className="col-md-4 mb-4">
              <div style={cardStyle}>
                <img src={process.env.PUBLIC_URL + '/user exp.png'} alt="User Experience" width="80" height="80" style={iconStyle} />
                <h4 style={stepTitleStyle}>Intuitive User Experience</h4>
                <p style={descriptionStyle}>
                  A clean, simple interface allows anyone to verify videos in just a few clicks — no technical knowledge needed.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── MODEL STATS STRIP (replaces testimonials) ── */}
      <section style={statsStyle}>
        <div className="container">
          <h2 style={{ ...sectionTitleStyle, color: '#013D83' }}>Verity-X by the Numbers</h2>
          <div style={statsGrid}>
            {[
              { value: '85.84%', label: 'Classification Accuracy' },
              { value: '0.9307', label: 'AUC-ROC Score' },
              { value: '16',     label: 'Frames Analysed per Video' },
              { value: '438',    label: 'Benchmark Test Videos' },
              { value: '6',      label: 'Experiments Conducted' },
              { value: '14.61%', label: 'Equal Error Rate' },
            ].map(s => (
              <div key={s.label} style={statCard}>
                <p style={statValue}>{s.value}</p>
                <p style={statLabel}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div style={gapStyle} />

      {/* ── CTA ── */}
      <section style={ctaSectionStyle}>
        <div className="container">
          <div className="row justify-content-center text-center">
            <div className="col-lg-8">
              <h2 style={ctaTitleStyle}>Ready to Detect Deepfakes?</h2>
              <p style={ctaTextStyle}>
                Start analysing videos instantly — no account required.
              </p>
              <Link to="/detect" style={ctaButtonStyle2}>
                Start Detection Now
              </Link>
            </div>
          </div>
        </div>
        <div style={dividerStyle} />
      </section>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const heroStyle         = { backgroundColor: '#E5E3E3', padding: '6rem 0', textAlign: 'center' };
const heroTitleStyle    = { fontSize: '3.5rem', fontWeight: '700', marginBottom: '1.5rem', color: '#000' };
const heroTitleBlueStyle= { color: '#013D83' };
const heroSubtitleStyle = { fontSize: '1.2rem', color: 'rgba(0,0,0,0.75)', marginBottom: '2.5rem', lineHeight: '1.6' };
const ctaButtonStyle    = { display: 'inline-flex', alignItems: 'center', backgroundColor: '#013D83', color: 'white', padding: '12px 30px', borderRadius: '8px', textDecoration: 'none', fontWeight: '600', fontSize: '1.1rem' };
const howItWorksStyle   = { backgroundColor: '#F8F8F8', padding: '5rem 0' };
const whyUsStyle        = { backgroundColor: '#E5E3E3', padding: '5rem 0' };
const sectionTitleStyle = { color: '#013D83', textAlign: 'center', marginBottom: '3rem', fontWeight: '700', fontSize: '2.5rem' };
const iconStyle         = { marginBottom: '1.5rem' };
const stepTitleStyle    = { color: '#000', fontWeight: '600', marginBottom: '1rem', fontSize: '1.3rem' };
const descriptionStyle  = { color: '#000', lineHeight: '1.6' };
const cardStyle         = { backgroundColor: '#F8F8F8', borderRadius: '35px', padding: '2.5rem 2rem', height: '100%', textAlign: 'center', boxShadow: '0 5px 15px rgba(0,0,0,0.08)' };

// Stats strip
const statsStyle  = { backgroundColor: '#F8F8F8', padding: '5rem 0' };
const statsGrid   = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1.25rem', marginTop: '1rem' };
const statCard    = { background: 'white', borderRadius: '14px', padding: '1.75rem 1rem', textAlign: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.07)' };
const statValue   = { color: '#013D83', fontSize: '2rem', fontWeight: '800', margin: '0 0 0.3rem' };
const statLabel   = { color: '#6b7280', fontSize: '0.82rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 };

const gapStyle          = { height: '61px', backgroundColor: '#E5E3E3', width: '100%' };
const ctaSectionStyle   = { backgroundColor: '#013D83', padding: '5rem 0 0 0' };
const ctaTitleStyle     = { color: 'white', fontWeight: '700', marginBottom: '1rem', fontSize: '2.5rem' };
const ctaTextStyle      = { color: 'white', marginBottom: '2rem', fontSize: '1.2rem' };
const ctaButtonStyle2   = { display: 'inline-block', backgroundColor: 'white', color: '#013D83', padding: '12px 30px', borderRadius: '8px', textDecoration: 'none', fontWeight: '600', fontSize: '1.1rem' };
const dividerStyle      = { height: '1px', backgroundColor: 'rgba(31,134,255,0.44)', width: '100%', margin: '4rem 0 0 0' };

export default Home;