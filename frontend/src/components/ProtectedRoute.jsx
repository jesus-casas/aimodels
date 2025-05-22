import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import useAuthStore from '../store/authStore';

const ProtectedRoute = ({ children, requiredAuth = true, redirectTo = '/' }) => {
  const { isAuthenticated, token } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    console.log('ProtectedRoute - Auth State:', { isAuthenticated, token, path: location.pathname });
  }, [isAuthenticated, token, location.pathname]);

  // If authentication is required and user is not authenticated
  if (requiredAuth && (!isAuthenticated || !token)) {
    console.log('ProtectedRoute - Redirecting to:', redirectTo);
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // If authentication is not required but user is authenticated
  if (!requiredAuth && isAuthenticated && token) {
    console.log('ProtectedRoute - Redirecting to welcome page');
    return <Navigate to="/welcome" replace />;
  }

  return children;
};

export default ProtectedRoute; 