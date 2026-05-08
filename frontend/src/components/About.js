import React from 'react';

function About() {
  return (
    <div style={page}>

      {/* ── Title ── */}
      <section style={titleSection}>
        <h1 style={titleStyle}>About Verity-X</h1>
        <p style={subtitleStyle}>Building trust in the digital age through advanced deepfake detection</p>
      </section>

      {/* ── Mission ── */}
      <section style={section}>
        <div style={inner}>
          <h2 style={sectionHead}>Our Mission</h2>
          <div style={divider} />
          <div style={missionBox}>
            <p style={bodyText}>
              Deepfake technology poses a significant and growing challenge to information integrity
              and public trust. Verity-X was created to combat this threat by providing accessible,
              AI-powered detection of synthetically manipulated video content — with explainable
              results that any user can understand, regardless of technical background.
            </p>
            <p style={{ ...bodyText, marginTop: '1rem' }}>
              Our mission is to restore confidence in digital media by empowering individuals with
              tools that were previously available only to forensic researchers and enterprise
              platforms — delivered through a clean, open, and transparent interface.
            </p>
          </div>
        </div>
      </section>

      {/* ── Technology ── */}
      <section style={{ ...section, background: '#F8F8F8' }}>
        <div style={inner}>
          <h2 style={sectionHead}>The Technology</h2>
          <div style={divider} />
          <div style={techGrid}>

            <div style={techCard}>
              <div style={techIconWrap}>
                <img src={process.env.PUBLIC_URL + '/model.png'} alt="AI Model" width="52" height="52" />
              </div>
              <h4 style={techCardTitle}>Detection Model</h4>
              <p style={techText}>
                Verity-X uses an <strong>EfficientNet-B4</strong> convolutional neural network combined
                with temporal mean-max pooling for video-level classification. The model was trained
                using progressive backbone unfreezing and cosine annealing over six structured experiments.
              </p>
              <div style={statStrip}>
                {[['Accuracy', '85.84%'], ['AUC-ROC', '0.9307'], ['EER', '14.61%']].map(([l, v]) => (
                  <div key={l} style={statPill}>
                    <span style={statPillLabel}>{l}</span>
                    <span style={statPillValue}>{v}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={techCard}>
              <div style={techIconWrap}>
                <img src={process.env.PUBLIC_URL + '/data.png'} alt="Data" width="52" height="52" />
              </div>
              <h4 style={techCardTitle}>Training Data</h4>
              <p style={techText}>
                The model was trained on the <strong>DeepFake Detection Challenge (DFDC)</strong> dataset
                across four subsets (Parts 0, 19, 45, 49), providing 2,912 balanced training videos.
                The <strong>Celeb-DF v2</strong> dataset was used in comparative experiments to evaluate
                cross-domain generalisation. A domain-consistent FAKE selection strategy was the key
                finding that enabled the model to meet its accuracy target.
              </p>
            </div>

            <div style={techCard}>
              <div style={techIconWrap}>
                <img src={process.env.PUBLIC_URL + '/model.png'} alt="Grad-CAM" width="52" height="52" />
              </div>
              <h4 style={techCardTitle}>Explainability</h4>
              <p style={techText}>
                Verity-X generates <strong>Grad-CAM</strong> (Gradient-weighted Class Activation Mapping)
                heatmaps for videos classified as deepfakes, highlighting the facial regions that most
                influenced the model's decision. Results include a downloadable PDF forensic report with
                frame-level scores, anomaly descriptions, and model metadata.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* ── Developer ── */}
      <section style={section}>
        <div style={inner}>
          <h2 style={sectionHead}>Meet the Developer</h2>
          <div style={divider} />
          <div style={devCard}>
            <h3 style={devName}>Sarindi Rithosha</h3>
            <p style={devRole}>BSc (Hons) Software Engineering · Plymouth University</p>
            <p style={{ ...bodyText, textAlign: 'justify', maxWidth: '600px' }}>
              Verity-X was developed as a Final Year Individual Project (PUSL3190). The project
              combines full-stack web development with machine learning and computer vision to deliver
              a practical deepfake detection platform — demonstrating skills in React, FastAPI, Firebase,
              and deep learning model training on cloud infrastructure.
            </p>
            <div style={tagRow}>
              {['React.js', 'FastAPI', 'PyTorch', 'EfficientNet-B4', 'Firebase', 'Google Cloud Run'].map(t => (
                <span key={t} style={tag}>{t}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Contact ── */}
      <section style={{ ...section, background: '#F8F8F8' }}>
        <div style={inner}>
          <h2 style={sectionHead}>Contact</h2>
          <div style={divider} />
          <p style={{ ...bodyText, textAlign: 'center', marginBottom: '2rem' }}>
            Have questions about Verity-X? Get in touch.
          </p>
          <div style={contactGrid}>
            <div style={contactCard}>
              <img src={process.env.PUBLIC_URL + '/mail.png'} alt="Email" width="44" height="44" style={contactIcon} />
              <h4 style={contactTitle}>Email</h4>
              <a href="mailto:verityx.team@gmail.com" style={contactLink}>verityx.team@gmail.com</a>
            </div>
            <div style={contactCard}>
              <img src={process.env.PUBLIC_URL + '/github.png'} alt="GitHub" width="44" height="44" style={contactIcon} />
              <h4 style={contactTitle}>GitHub</h4>
              <a href="https://github.com/SarindiRithosha/Deepfake-Detection-" target="_blank" rel="noopener noreferrer" style={contactLink}>
                View the Repository
              </a>
            </div>
          </div>
        </div>
      </section>

      <div style={{ height: '60px', background: '#E5E3E3' }} />
    </div>
  );
}

const page          = { background: '#E5E3E3', fontFamily: "'Segoe UI', sans-serif" };
const titleSection  = { background: '#F8F8F8', padding: '4.5rem 1rem', textAlign: 'center' };
const titleStyle    = { color: '#013D83', fontSize: '2.8rem', fontWeight: 800, margin: '0 0 0.75rem' };
const subtitleStyle = { color: '#374151', fontSize: '1.15rem', margin: 0, opacity: 0.8 };
const section       = { background: '#E5E3E3', padding: '4rem 1rem' };
const inner         = { maxWidth: '1140px', margin: '0 auto' };
const sectionHead   = { color: '#013D83', fontSize: '2.2rem', fontWeight: 700, textAlign: 'center', margin: '0 0 0.75rem' };
const divider       = { height: '3px', width: '70px', background: '#013D83', margin: '0 auto 2.5rem', borderRadius: '2px' };
const bodyText      = { color: '#374151', fontSize: '1rem', lineHeight: 1.75, margin: 0 };
const missionBox    = { background: 'white', borderRadius: '14px', padding: '2.5rem', boxShadow: '0 2px 12px rgba(0,0,0,0.07)', maxWidth: '820px', margin: '0 auto' };
const techGrid      = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: '1.5rem', marginTop: '1rem' };
const techCard      = { background: 'white', borderRadius: '14px', padding: '2rem', boxShadow: '0 2px 8px rgba(0,0,0,0.07)' };
const techIconWrap  = { marginBottom: '1rem' };
const techCardTitle = { color: '#013D83', fontSize: '1.2rem', fontWeight: 700, margin: '0 0 0.75rem' };
const techText      = { ...bodyText, fontSize: '0.9rem' };
const statStrip     = { display: 'flex', gap: '0.5rem', marginTop: '1.1rem', flexWrap: 'wrap' };
const statPill      = { display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#eff6ff', borderRadius: '8px', padding: '0.4rem 0.75rem', flex: 1, minWidth: '70px' };
const statPillLabel = { fontSize: '0.65rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em' };
const statPillValue = { fontSize: '1rem', fontWeight: 700, color: '#013D83' };
const devCard   = { background: 'white', borderRadius: '14px', padding: '3rem 2rem', boxShadow: '0 2px 8px rgba(0,0,0,0.07)', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.6rem' };
const devName   = { color: '#013D83', fontSize: '1.6rem', fontWeight: 700, margin: 0 };
const devRole   = { color: '#6b7280', fontSize: '0.95rem', fontWeight: 500, margin: '0 0 0.5rem' };
const tagRow    = { display: 'flex', flexWrap: 'wrap', gap: '0.4rem', justifyContent: 'center', marginTop: '0.75rem' };
const tag       = { background: '#eff6ff', color: '#013D83', fontSize: '0.75rem', fontWeight: 600, padding: '0.25rem 0.65rem', borderRadius: '20px' };
const contactGrid = { display: 'flex', gap: '1.5rem', justifyContent: 'center', flexWrap: 'wrap' };
const contactCard = { background: 'white', borderRadius: '14px', padding: '2rem', textAlign: 'center', minWidth: '220px', boxShadow: '0 2px 8px rgba(0,0,0,0.07)', flex: '0 1 260px' };
const contactIcon = { marginBottom: '0.75rem' };
const contactTitle= { color: '#013D83', fontSize: '1.15rem', fontWeight: 700, margin: '0 0 0.4rem' };
const contactLink = { color: '#2563eb', fontSize: '0.9rem', textDecoration: 'none' };

export default About;