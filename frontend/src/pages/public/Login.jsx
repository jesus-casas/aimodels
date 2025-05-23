import React, { useState, useEffect } from 'react';
import useAuthStore from '../../store/authStore';
import { useNavigate, useLocation } from 'react-router-dom';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [inputErrors, setInputErrors] = useState({});
  const { loginAndRedirect, isLoading, error } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const emailVerified = params.get('emailVerified');
    
    if (emailVerified === 'true') {
      window.dispatchEvent(new CustomEvent('showToast', {
        detail: {
          message: 'Thank you! Your email has been successfully confirmed. Please login.',
          type: 'success'
        }
      }));
      // Clean up the URL
      navigate('/', { replace: true });
    } else if (emailVerified === 'false') {
      window.dispatchEvent(new CustomEvent('showToast', {
        detail: {
          message: 'Failed to verify email. Please try again.',
          type: 'error'
        }
      }));
      // Clean up the URL
      navigate('/', { replace: true });
    }
  }, [location, navigate]);

  useEffect(() => {
    if (error) {
      // Show a generic error message for all authentication failures
      setInputErrors({
        username: '',
        password: 'Invalid credentials. Please try again.'
      });
    } else {
      setInputErrors({});
    }
  }, [error]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setInputErrors({});
    await loginAndRedirect({
      username: username,
      password: password
    });
  };

  const handleForgotPassword = () => {
    navigate('/send-reset-link');
  };

  const handleSignup = () => {
    navigate('/signup');
  };

  const getInputStyle = (field) => ({
    ...styles.input,
    ...(inputErrors[field] ? styles.inputError : {})
  });

  return (
    <div style={styles.container}>
      <div style={styles.formWrapper}>
        <h1 style={styles.title}>Login</h1>
        <form style={styles.form} onSubmit={handleSubmit}>
          <div style={styles.inputWrapper}>
            <input
              type="text"
              placeholder="Username"
              style={getInputStyle('username')}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isLoading}
            />
            {inputErrors.username && <div style={styles.fieldError}>{inputErrors.username}</div>}
          </div>
          <div style={styles.inputWrapper}>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              style={getInputStyle('password')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
            {inputErrors.password && <div style={styles.fieldError}>{inputErrors.password}</div>}
          </div>
          <div style={styles.passwordActionsContainer}>
            <button
              type="button"
              style={styles.showPasswordButton}
              onMouseDown={() => setShowPassword(true)}
              onMouseUp={() => setShowPassword(false)}
              onMouseLeave={() => setShowPassword(false)}
            >
              show password
            </button>
            <span 
              style={styles.loginLink}
              onClick={handleForgotPassword}
              role="button"
              tabIndex={0}
            >
              Forgot Password?
            </span>
          </div>
          <button 
            type="submit" 
            style={styles.button}
            disabled={isLoading}
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
          <p style={styles.signupText}>
            Don't have an account? {' '}
            <span 
              style={styles.signupLink}
              onClick={handleSignup}
              role="button"
              tabIndex={0}
            >
              Sign up
            </span>
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
    marginBottom: '2rem',
    textAlign: 'center',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    gap: '1rem',
  },
  inputWrapper: {
    width: '100%',
    marginBottom: '0.5rem',
  },
  input: {
    padding: '1rem',
    borderRadius: '4px',
    border: '1px solid #ccc',
    fontSize: '1rem',
    transition: 'border-color 0.2s ease',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
  },
  inputError: {
    borderColor: '#ff3333',
    backgroundColor: '#fff8f8',
  },
  fieldError: {
    color: '#ff3333',
    fontSize: '0.8rem',
    marginTop: '0.25rem',
    marginLeft: '0.25rem',
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
    width: '100%',
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
  passwordActionsContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  loginLink: {
    color: '#007bff',
    textDecoration: 'none',
    cursor: 'pointer',
  },
  showPasswordButton: {
    background: 'none',
    border: 'none',
    color: '#666',
    fontSize: '0.9rem',
    cursor: 'pointer',
    padding: '0',
    textAlign: 'left',
  },
  errorMessage: {
    color: '#ff3333',
    marginBottom: '1rem',
    textAlign: 'center',
    backgroundColor: '#fff8f8',
    padding: '0.5rem',
    borderRadius: '4px',
    border: '1px solid #ff3333',
  }
};

export default Login;
