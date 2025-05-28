import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Toast from './components/Toast';

// Private
import WelcomePage from './pages/private/WelcomePage';

// Public Pages:
import Signup from './pages/public/Signup';
import Login from './pages/public/Login';
import SendResetLinkPage from './pages/public/SendResetLinkPage';
import LockedOutPage from './pages/public/LockedOutPage';
import Chat from './pages/public/Chat';

// Sign up flow:
import ConfirmEmail from './pages/private/Sign-up/ConfirmEmailPage';
import SecurityQuestionsPageSignup from './pages/private/Sign-up/SecurityQuestionsPageSignup';

// Reset Password flow:
import SecurityQuestions from './pages/private/Reset-Password/SecurityQuestionsPage';
import ResetPassword from './pages/private/Reset-Password/ResetPasswordPage';

// Auth Provider
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import RouteGuard from './components/RouteGuard';
import useAuthStore from './store/authStore';

const AppContent = () => {
  const { isAuthenticated, token } = useAuthStore();
  const [toast, setToast] = useState(null);
  const location = useLocation();

  useEffect(() => {
    console.log('AppContent - Route Change:', {
      path: location.pathname,
      isAuthenticated,
      hasToken: !!token
    });
  }, [location.pathname, isAuthenticated, token]);

  useEffect(() => {
    const handleToast = (event) => {
      setToast(event.detail);
    };

    window.addEventListener('showToast', handleToast);
    return () => window.removeEventListener('showToast', handleToast);
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  return (
    <>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={
          <ProtectedRoute requiredAuth={false} redirectTo="/welcome">
            <Login />
          </ProtectedRoute>
        } />
        <Route path="/login" element={<Navigate to="/" replace />} />
        <Route path="/signup" element={
          <ProtectedRoute requiredAuth={false} redirectTo="/welcome">
            <Signup />
          </ProtectedRoute>
        } />
        <Route path="/send-reset-link" element={
          <ProtectedRoute requiredAuth={false} redirectTo="/welcome">
            <SendResetLinkPage />
          </ProtectedRoute>
        } />
        <Route path="/locked-out" element={<LockedOutPage />} />
        <Route path="/chat" element={<Chat />} />
        {/* Protected Routes */}
        <Route path="/welcome" element={
          <ProtectedRoute>
            <WelcomePage />
          </ProtectedRoute>
        } />

        {/* Signup Flow Routes */}
        <Route path="/security-questions-signup" element={
          <RouteGuard 
            requiredFlowState="signupInProgress"
            requiredStep="signup_started"
            redirectTo="/signup"
          >
            <SecurityQuestionsPageSignup />
          </RouteGuard>
        } />
        <Route path="/confirm-email" element={
          <RouteGuard 
            requiredFlowState="signupSecurityQuestionsSubmitted"
            requiredStep="security_questions_submitted"
            redirectTo="/security-questions-signup"
          >
            <ConfirmEmail />
          </RouteGuard>
        } />

        {/* Password Recovery Flow Routes */}
        <Route path="/security-questions" element={
          <RouteGuard 
            requiredFlowState="passwordRecoveryInProgress"
            requiredStep="recovery_started"
            redirectTo="/send-reset-link"
          >
            <SecurityQuestions />
          </RouteGuard>
        } />
        <Route path="/reset-password" element={
          <RouteGuard 
            requiredFlowState="securityVerified"
            requiredStep="security_verified"
            redirectTo="/security-questions"
          >
            <ResetPassword />
          </RouteGuard>
        } />

        {/* Catch-all route - redirects any undefined routes to base */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <div className="app-container">
          <AppContent />
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App;