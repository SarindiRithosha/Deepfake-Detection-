// Import necessary dependencies and components
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer'; // Import the Footer
import Home from './components/Home';
import About from './components/About';
import Detection from './components/Detection';

// Import the global Bootstrap CSS
import 'bootstrap/dist/css/bootstrap.min.css';
// Import our global styles (Inter font, background color)
import './index.css';

// Main App component
function App() {
  return (
    <Router>
      <div style={appStyle}>
        {/* The Navbar will appear on every page */}
        <Navbar />
        
        {/* Main content area */}
        <main style={mainStyle}>
          {/* Define the routes for different pages */}
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/detect" element={<Detection />} />
          </Routes>
        </main>
        
        {/* The Footer will appear on every page */}
        <Footer />
      </div>
    </Router>
  );
}

// CSS Styles for layout
const appStyle = {
  display: 'flex',
  flexDirection: 'column',
  minHeight: '100vh', // Full viewport height
};

const mainStyle = {
  flex: '1', // Takes up all available space
};

export default App;