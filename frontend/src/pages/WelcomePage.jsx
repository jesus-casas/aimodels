import React from 'react';
import useAuthStore from '../store/authStore';
import { authAPI } from '../services/api';

const WelcomePage = () => {
  const { user, logout } = useAuthStore();

  // Format the last login date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Download Handle for secure download
  const handleDownload = async () => {
    try {
      await authAPI.downloadFile();
    } catch (error) {
      console.error("Download error:", error);
      alert(error.message || "An unexpected error occurred while downloading the file.");
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.navBar}>
        <button style={styles.logoutButton} onClick={logout}>
          Logout
        </button>
      </div>
      <div style={styles.contentWrapper}>
        <div style={styles.checkmark}>✓</div>
        <h1 style={styles.message}>Sign In Successful!</h1>
        <div style={styles.userInfoContainer}>
          <h2 style={styles.greeting}>Hi, {user?.firstName || 'User'} {user?.lastName || ''}</h2>
          <p style={styles.loginInfo}>You have logged in {user?.loginCount || 0} times</p>
          <p style={styles.loginInfo}>Last login date: {formatDate(user?.lastLogin)}</p>
          <button 
            style={styles.downloadButton}
            onClick={handleDownload}
          >
            Download Confidential File
          </button>
        </div>
      </div>
    </div>
  );
};

const styles = {
    container: {
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      width: '100%',
      backgroundColor: 'white',
      position: 'relative',
    },
    navBar: {
      width: '100%',
      height: '70px',
      backgroundColor: 'white',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
      position: 'fixed',
      top: 0,
      left: 0,
      zIndex: 1000,
    },
    logoutButton: {
      position: 'absolute',
      top: '15px',
      right: '30px',
      padding: '0.8rem 1.5rem',
      backgroundColor: '#4A90E2',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '1rem',
      transition: 'background-color 0.2s ease',
      ':hover': {
        backgroundColor: '#357ABD'
      }
    },
    contentWrapper: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      textAlign: 'center',
      marginTop: '-10rem',
      flexGrow: 1,
    },
    message: {
      fontSize: '2rem',
      color: '#333',
      marginBottom: '20px',
    },
    checkmark: {
      color: '#4A90E2',
      fontSize: '4rem',
      marginBottom: '20px',
    },
    userInfoContainer: {
      backgroundColor: '#f8f9fa',
      padding: '2rem',
      borderRadius: '8px',
      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)',
      width: '100%',
      maxWidth: '500px',
      marginTop: '2rem',
    },
    greeting: {
      fontSize: '1.5rem',
      color: '#333',
      marginBottom: '1rem',
    },
    loginInfo: {
      fontSize: '1.2rem',
      color: '#4A90E2',
      margin: '0.5rem 0',
      fontWeight: '500',
    },
    downloadButton: {
      marginTop: '1.5rem',
      padding: '0.8rem 1.5rem',
      backgroundColor: '#4A90E2',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '1.2rem',
      transition: 'background-color 0.2s ease',
    }
};

export default WelcomePage;
