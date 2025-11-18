import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Pages (to be created)
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import StudentDashboard from './pages/student/Dashboard';
import PedagogueDashboard from './pages/pedagogue/Dashboard';
import AdminDashboard from './pages/admin/Dashboard';
import VerificationPage from './pages/VerificationPage';
import NotFoundPage from './pages/NotFoundPage';

// Context
import { AuthProvider } from './contexts/AuthContext';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/student/dashboard" element={<StudentDashboard />} />
            <Route path="/pedagogue/dashboard" element={<PedagogueDashboard />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/verify/:documentId?" element={<VerificationPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
          <ToastContainer position="top-right" autoClose={3000} />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
