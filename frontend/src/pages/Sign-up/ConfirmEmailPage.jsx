import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../../store/authStore';

const ConfirmEmailPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { verifySignupEmail, isLoading, error } = useAuthStore();
  const [resendStatus, setResendStatus] = useState({ success: false, error: null });
  const [email, setEmail] = useState(localStorage.getItem('signupEmail') || '');
  
  useEffect(() => {
    const verifyEmail = async () => {
      const token = new URLSearchParams(location.search).get('token');
      if (token) {
        try {
          await verifySignupEmail(token);
          // Dispatch toast event before navigation
          window.dispatchEvent(new CustomEvent('showToast', {
            detail: {
              message: 'Thank you! Your email has been successfully confirmed. Please login.',
              type: 'success'
            }
          }));
          // Navigate to login page
          navigate('/login');
        } catch (error) {
          // Dispatch error toast before navigation
          window.dispatchEvent(new CustomEvent('showToast', {
            detail: {
              message: 'Failed to verify email. Please try again.',
              type: 'error'
            }
          }));
          navigate('/login');
        }
      }
    };

    verifyEmail();
  }, [location, navigate, verifySignupEmail]);

  const handleResendEmail = async () => {
    try {
      setResendStatus({ success: false, error: null });
      await authAPI.resendVerificationEmail(email);
      setResendStatus({ success: true, error: null });
    } catch (error) {
      setResendStatus({ success: false, error: error.message });
    }
  };

  const handleReturnToLogin = () => {
    navigate('/login');
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Confirm Your Email</h1>
        <div style={styles.iconContainer}>
          <span style={styles.emailIcon}>✉️</span>
        </div>
        <p style={styles.message}>
          We've sent a confirmation email to your address.
        </p>
        <p style={styles.instruction}>
          Please check your inbox and spam/junk folders to verify your account.
        </p>
        <p style={styles.redirectInfo}>
          After confirming your email, you will be automatically redirected to the login page.
        </p>
        
        {/* Resend Email Button */}
        <button 
          style={styles.resendButton}
          onClick={handleResendEmail}
          disabled={isLoading}
        >
          {isLoading ? 'Sending...' : 'Resend Verification Email'}
        </button>

        {resendStatus.success && (
          <p style={styles.successMessage}>Verification email resent successfully!</p>
        )}
        {resendStatus.error && (
          <p style={styles.errorMessage}>{resendStatus.error}</p>
        )}

        {/* Return to Login Button */}
        <button 
          style={styles.returnButton}
          onClick={handleReturnToLogin}
        >
          Return to Login
        </button>
      </div>
    </div>
  );
};

const styles = {
    container: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        backgroundColor: '#f5f5f5',
    },
    card: {
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
        padding: '40px',
        width: '90%',
        maxWidth: '500px',
        textAlign: 'center',
    },
    title: {
        color: '#333',
        marginBottom: '20px',
    },
    iconContainer: {
        margin: '20px 0',
    },
    emailIcon: {
        fontSize: '50px',
    },
    message: {
        fontSize: '18px',
        fontWeight: 'bold',
        margin: '15px 0',
    },
    instruction: {
        fontSize: '16px',
        color: '#555',
        marginBottom: '15px',
    },
    redirectInfo: {
        fontSize: '16px',
        color: '#555',
        marginBottom: '30px',
        fontStyle: 'italic',
    },
    resendButton: {
        backgroundColor: '#4285f4',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        padding: '12px 24px',
        fontSize: '16px',
        cursor: 'pointer',
        transition: 'background-color 0.3s',
        marginBottom: '20px',
        width: '100%',
    },
    returnButton: {
        backgroundColor: 'transparent',
        color: '#4285f4',
        border: '1px solid #4285f4',
        borderRadius: '4px',
        padding: '12px 24px',
        fontSize: '16px',
        cursor: 'pointer',
        transition: 'background-color 0.3s',
        width: '100%',
    },
    successMessage: {
        color: '#4CAF50',
        margin: '10px 0',
    },
    errorMessage: {
        color: '#f44336',
        margin: '10px 0',
    }
};

export default ConfirmEmailPage;