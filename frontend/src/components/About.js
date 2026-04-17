import React from 'react';

function About() {
  return (
    <div style={page}>

      {/* Title */}
      <section style={titleSection}>
        <h1 style={titleStyle}>About Verity-X</h1>
        <p style={subtitleStyle}>Building trust in the digital age through advanced deepfake detection</p>
      </section>

      {/* Mission */}
      <section style={section}>
        <div style={inner}>
          <h2 style={sectionHead}>Our Mission</h2>
          <div style={divider}/>
          <div style={missionBox}>
            <p style={bodyText}>
              In an era where digital manipulation has become increasingly sophisticated, deepfake
              technology poses a significant challenge to information integrity and public trust. Verity-X
              was created to combat this growing threat by providing reliable, accurate detection of
              synthetically manipulated video content.
            </p>
            <p style={{ ...bodyText, marginTop:'1rem' }}>
              Our mission is to restore confidence in digital media by empowering users with cutting-edge
              AI technology that can distinguish between authentic and artificially generated content. We
              believe that truth and transparency are fundamental to a healthy digital ecosystem.
            </p>
          </div>
        </div>
      </section>

      {/* Technology */}
      <section style={{ ...section, background:'#F8F8F8' }}>
        <div style={inner}>
          <h2 style={sectionHead}>The Technology Behind Verity-X</h2>
          <div style={divider}/>
          <div style={techGrid}>

            <div style={techCard}>
              <div style={techIconWrap}>
                <img src={process.env.PUBLIC_URL+'/model.png'} alt="AI Model" width="52" height="52"/>
              </div>
              <h4 style={techCardTitle}>The Model</h4>
              <p style={techText}>
                Verity-X uses an <strong>EfficientNet-B4</strong> convolutional neural network as a spatial
                feature extractor, combined with a temporal mean-max pooling head for video-level
                classification. The architecture was trained using a progressive backbone unfreezing
                schedule and cosine learning rate annealing.
              </p>
              <div style={statStrip}>
                {[['Accuracy','85.84%'],['AUC-ROC','0.9307'],['EER','14.61%']].map(([l,v])=>(
                  <div key={l} style={statPill}>
                    <span style={statPillLabel}>{l}</span>
                    <span style={statPillValue}>{v}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={techCard}>
              <div style={techIconWrap}>
                <img src={process.env.PUBLIC_URL+'/data.png'} alt="Data" width="52" height="52"/>
              </div>
              <h4 style={techCardTitle}>The Data</h4>
              <p style={techText}>
                The model was trained and evaluated on the industry-standard{' '}
                <strong>DeepFake Detection Challenge (DFDC)</strong> dataset, specifically using four
                strategic subsets (Parts 0, 19, 45, and 49) for a total of 2,912 balanced training
                videos. The <strong>Celeb-DF v2</strong> dataset was also used in comparative experiments
                to evaluate cross-domain generalisation.
              </p>
            </div>

            <div style={techCard}>
              <div style={techIconWrap}>
                <img src={process.env.PUBLIC_URL+'/model.png'} alt="Grad-CAM" width="52" height="52"/>
              </div>
              <h4 style={techCardTitle}>Explainability</h4>
              <p style={techText}>
                Verity-X generates <strong>Grad-CAM (Gradient-weighted Class Activation Mapping)</strong>{' '}
                heatmaps for videos classified as deepfakes. These heatmaps highlight the specific facial
                regions that most influenced the model's prediction, providing users with interpretable
                evidence rather than a black-box verdict.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Developer */}
      <section style={section}>
        <div style={inner}>
          <h2 style={sectionHead}>Meet the Developer</h2>
          <div style={divider}/>
          <div style={devCard}>
            <img src={process.env.PUBLIC_URL+'/Avatar.png'} alt="Developer"
              width="110" height="110" style={avatar}/>
            <h3 style={devName}>Sarindi Rithosha</h3>
            <p style={devRole}>Final Year Student · Software Engineering · Plymouth University</p>
            <p style={{ ...bodyText, textAlign:'justify', maxWidth:'680px' }}>
              Verity-X was developed as a Final Year Individual Project (PUSL3190) at Plymouth University. The project combines full-stack web development, machine learning, and computer vision to
              deliver a practical, scalable deepfake detection solution. It demonstrates proficiency in
              agile development, FastAPI backend engineering, React frontend architecture, Firebase
              integration, and deep learning model training on cloud infrastructure.
            </p>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section style={{ ...section, background:'#F8F8F8' }}>
        <div style={inner}>
          <h2 style={sectionHead}>Contact</h2>
          <div style={divider}/>
          <p style={{ ...bodyText, textAlign:'center', marginBottom:'2rem' }}>
            Have questions about Verity-X or interested in collaboration? Get in touch.
          </p>
          <div style={contactGrid}>

            <div style={contactCard}>
              <img src={process.env.PUBLIC_URL+'/mail.png'} alt="Email" width="44" height="44" style={contactIcon}/>
              <h4 style={contactTitle}>Email</h4>
              <a href="mailto:sarindi@verity-x.com" style={contactLink}>sarindi@verity-x.com</a>
            </div>

            <div style={contactCard}>
              <img src={process.env.PUBLIC_URL+'/github.png'} alt="GitHub" width="44" height="44" style={contactIcon}/>
              <h4 style={contactTitle}>GitHub</h4>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" style={contactLink}>
                View the Repository
              </a>
            </div>

          </div>
        </div>
      </section>

      <div style={{ height:'60px', background:'#E5E3E3' }}/>
    </div>
  );
}

const page         = { background:'#E5E3E3', fontFamily:"'Segoe UI',sans-serif" };
const titleSection = { background:'#F8F8F8', padding:'4.5rem 1rem', textAlign:'center' };
const titleStyle   = { color:'#013D83', fontSize:'2.8rem', fontWeight:800, margin:'0 0 0.75rem' };
const subtitleStyle= { color:'#374151', fontSize:'1.15rem', margin:0, opacity:0.8 };
const section      = { background:'#E5E3E3', padding:'4rem 1rem' };
const inner        = { maxWidth:'1140px', margin:'0 auto' };
const sectionHead  = { color:'#013D83', fontSize:'2.2rem', fontWeight:700, textAlign:'center', margin:'0 0 0.75rem' };
const divider      = { height:'3px', width:'70px', background:'#013D83', margin:'0 auto 2.5rem', borderRadius:'2px' };
const bodyText     = { color:'#374151', fontSize:'1rem', lineHeight:1.75, margin:0 };
const missionBox   = { background:'white', borderRadius:'14px', padding:'2.5rem', boxShadow:'0 2px 12px rgba(0,0,0,0.07)', maxWidth:'820px', margin:'0 auto' };
const techGrid     = { display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(290px,1fr))', gap:'1.5rem', marginTop:'1rem' };
const techCard     = { background:'white', borderRadius:'14px', padding:'2rem', boxShadow:'0 2px 8px rgba(0,0,0,0.07)' };
const techIconWrap = { marginBottom:'1rem' };
const techCardTitle= { color:'#013D83', fontSize:'1.2rem', fontWeight:700, margin:'0 0 0.75rem' };
const techText     = { ...bodyText, fontSize:'0.9rem' };
const statStrip    = { display:'flex', gap:'0.5rem', marginTop:'1.1rem', flexWrap:'wrap' };
const statPill     = { display:'flex', flexDirection:'column', alignItems:'center', background:'#eff6ff', borderRadius:'8px', padding:'0.4rem 0.75rem', flex:1, minWidth:'70px' };
const statPillLabel= { fontSize:'0.65rem', color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.06em' };
const statPillValue= { fontSize:'1rem', fontWeight:700, color:'#013D83' };
const devCard      = { background:'white', borderRadius:'14px', padding:'3rem 2rem', boxShadow:'0 2px 8px rgba(0,0,0,0.07)', textAlign:'center', display:'flex', flexDirection:'column', alignItems:'center', gap:'0.5rem' };
const avatar       = { borderRadius:'50%', border:'4px solid #E5E3E3', marginBottom:'0.5rem' };
const devName      = { color:'#013D83', fontSize:'1.6rem', fontWeight:700, margin:0 };
const devRole      = { color:'#A9D6E5', fontSize:'0.95rem', fontWeight:600, margin:'0 0 0.75rem' };
const contactGrid  = { display:'flex', gap:'1.5rem', justifyContent:'center', flexWrap:'wrap' };
const contactCard  = { background:'white', borderRadius:'14px', padding:'2rem', textAlign:'center', minWidth:'220px', boxShadow:'0 2px 8px rgba(0,0,0,0.07)', flex:'0 1 260px' };
const contactIcon  = { marginBottom:'0.75rem' };
const contactTitle = { color:'#013D83', fontSize:'1.15rem', fontWeight:700, margin:'0 0 0.4rem' };
const contactLink  = { color:'#2563eb', fontSize:'0.9rem', textDecoration:'none' };

export default About;