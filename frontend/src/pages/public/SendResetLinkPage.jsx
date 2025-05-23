import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';

const SendResetLinkPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const authStore = useAuthStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await authStore.startPasswordRecovery(email);
      // Only navigate if the email exists and response is successful
      if (response && response.success && response.emailExists) {
        navigate('/security-questions');
      } else {
        // Generic message for security reasons
        setMessage('If this account exists, you will receive instructions on how to reset your password via email.');
      }
    } catch (error) {
      // Show the same message regardless of success/failure for security
      setMessage('If this account exists, you will receive instructions on how to reset your password via email.');
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.formWrapper}>
        <h1 style={styles.title}>Forgot Password</h1>
        <form style={styles.form} onSubmit={handleSubmit}>
          <p style={styles.loginText}>
            Enter your e-mail address, and we'll give you reset instructions.
          </p>
          <input
            type="email"
            placeholder="Enter your email"
            style={styles.input}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          {message && <p style={styles.message}>{message}</p>}
          <button style={styles.button}>
            Request Password Reset
          </button>
          <p onClick={() => navigate('/login')} style={{...styles.loginText, cursor: 'pointer', color: '#007bff'}}>
            Back to Login
          </p>
        </form>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    width: '100%',
    backgroundColor: '#f5f5f5',
  },
  formWrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '2.5rem',
    marginTop: '-10rem',
    width: '100%',
    maxWidth: '440px',
    backgroundColor: 'white',
    borderRadius: '10px',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
  },
  title: {
    fontSize: '2rem',
    color: '#333',
    marginBottom: '1rem',
    textAlign: 'center',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    gap: '1rem',
  },
  input: {
    padding: '1rem',
    borderRadius: '4px',
    border: '1px solid #ccc',
    fontSize: '1rem',
    transition: 'border-color 0.2s ease',
    outline: 'none',
    ':focus': {
      borderColor: '#4A90E2',
    },
  },
  button: {
    padding: '1rem',
    backgroundColor: '#4A90E2',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '1rem',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
    marginTop: '0.5rem',
    width: '100%',
    ':hover': {
      backgroundColor: '#357ABD',
    },
  },
  signupText: {
    marginTop: '1rem',
    textAlign: 'center',
    color: '#333',
  },
  signupLink: {
    color: '#007bff',
    textDecoration: 'none',
    cursor: 'pointer',
  },
  loginText: {
    marginTop: '1rem',
    textAlign: 'center',
    color: '#333',
  },
  loginLink: {
    color: '#007bff',
    textDecoration: 'none',
    cursor: 'pointer',
  },
  message: {
    color: '#4A90E2',
    textAlign: 'center',
    marginTop: '1rem',
    fontSize: '0.9rem',
  },
};

export default SendResetLinkPage;