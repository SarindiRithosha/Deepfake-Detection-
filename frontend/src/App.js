import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './components/Home';
import About from './components/About';
import Detection from './components/Detection';
import Results from './components/Results'; 
import Login from './components/Login';
import Signup from './components/Signup';
import ForgotPassword from './components/ForgotPassword';
import VerifyReset from './components/VerifyReset';
import ResetPassword from './components/ResetPassword';
import UserProfile from './components/UserProfile';  
import AnalysisHistory from './components/AnalysisHistory'; 
import AdminDashboard from './components/admin/AdminDashboard';
import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';
import { useAuth } from './contexts/AuthContext';
import { Navigate } from 'react-router-dom';

function ProtectedAdminRoute({ children }) {
  const { currentUser, userProfile } = useAuth();
  
  if (!currentUser) {
    return <Navigate to="/login" />;
  }
  
  if (currentUser.email !== 'verityx.team@gmail.com') {
    return <Navigate to="/" />;
  }
  
  return children;
}

function AppContent() {
  const location = useLocation();
  const authRoutes = ['/login', '/signup', '/forgot-password', '/verify-reset', '/reset-password', '/admin'];
  const isAuthRoute = authRoutes.includes(location.pathname);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {!isAuthRoute && <Navbar />}
      <main style={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/detect" element={<Detection />} />
          <Route path="/results" element={<Results />} /> 
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/verify-reset" element={<VerifyReset />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/profile" element={<UserProfile />} /> 
          <Route path="/history" element={<AnalysisHistory />} /> 
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin" element={<ProtectedAdminRoute> <AdminDashboard /> </ProtectedAdminRoute> } />
        </Routes>
      </main>
      {!isAuthRoute && <Footer />}
    </div>
  );
}

function App() {
  return (
   <AuthProvider>
      <Router>
        <AppContent />
      </Router>
   </AuthProvider>
  );
}

export default App;
