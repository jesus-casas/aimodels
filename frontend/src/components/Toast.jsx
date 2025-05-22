import React from 'react';

const Toast = ({ message, type, onClose }) => {
  if (!message) return null;

  const baseStyles = {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    padding: '15px 25px',
    borderRadius: '4px',
    color: 'white',
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
    maxWidth: '400px',
    minWidth: '300px'
  };

  const typeStyles = {
    success: {
      backgroundColor: '#4CAF50',
    },
    error: {
      backgroundColor: '#f44336',
    },
    warning: {
      backgroundColor: '#ff9800',
    },
    info: {
      backgroundColor: '#2196F3',
    }
  };

  const styles = {
    ...baseStyles,
    ...typeStyles[type]
  };

  return (
    <div style={styles}>
      <span>{message}</span>
      <button 
        onClick={onClose}
        style={{
          background: 'none',
          border: 'none',
          color: 'white',
          cursor: 'pointer',
          padding: '0 5px',
          fontSize: '18px'
        }}
      >
        ×
      </button>
    </div>
  );
};

export default Toast; 