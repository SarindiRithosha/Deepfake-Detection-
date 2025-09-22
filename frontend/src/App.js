import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './components/Home';
import About from './components/About';
import Detection from './components/Detection';
import Results from './components/Results'; 
import Login from './components/Login';
import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';

function App() {
  return (
    <Router>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Navbar />
        <main style={{ flex: 1 }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/detect" element={<Detection />} />
            <Route path="/results" element={<Results />} /> 
            <Route path="/login" element={<Login />} />

          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;