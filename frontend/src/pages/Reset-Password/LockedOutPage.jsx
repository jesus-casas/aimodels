import React from 'react';
import { useNavigate } from 'react-router-dom';
import lockIcon from '../../images/locked-svgrepo.svg';

const LockedOutPage = () => {
  const navigate = useNavigate();

  const handleBackToLogin = () => {
    navigate('/login');
  };

  return (
    <div style={styles.container}>
      <div style={styles.formWrapper}>
        <div style={styles.lockIcon}>
          <img src={lockIcon} alt="Lock" style={styles.icon} />
        </div>
        <h1 style={styles.title}>Account Temporarily Locked</h1>
        <p style={styles.message}>Too many failed attempts</p>
        <p style={styles.timer}>Try again in 3 minutes</p>
        <button onClick={handleBackToLogin} style={styles.button}>
          Back to Login
        </button>
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
  lockIcon: {
    marginBottom: '1rem',
  },
  icon: {
    width: '64px',
    height: '64px',
    fill: '#4A90E2',
  },
  title: {
    fontSize: '1.8rem',
    color: '#333',
    marginBottom: '1rem',
    textAlign: 'center',
  },
  message: {
    fontSize: '1.2rem',
    color: '#666',
    marginBottom: '1rem',
    textAlign: 'center',
  },
  timer: {
    fontSize: '1.4rem',
    color: '#4A90E2',
    fontWeight: '600',
    textAlign: 'center',
  },
  button: {
    padding: '1rem',
    backgroundColor: '#4A90E2',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '1.2rem',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
    marginTop: '2rem',
    width: '100%',
    ':hover': {
      backgroundColor: '#357ABD',
    },
  },
};

export default LockedOutPage;
