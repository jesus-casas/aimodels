import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';

const RouteGuard = ({ 
  children, 
  requiredStep, 
  redirectTo = '/login',
  allowedSteps = [],
  requiredFlowState = null,
  allowedFlowStates = []
}) => {
  const { 
    currentStep,
    signupInProgress,
    signupSecurityQuestionsSubmitted,
    signupEmailVerified,
    passwordRecoveryInProgress,
    securityVerified,
    recoveryEmailVerified,
    account_locked,
    isAuthenticated,
    token
  } = useAuthStore();

  useEffect(() => {
    console.log('RouteGuard - State:', {
      currentStep,
      requiredStep,
      requiredFlowState,
      isAuthenticated,
      token,
      flowStates: {
        signupInProgress,
        signupSecurityQuestionsSubmitted,
        signupEmailVerified,
        passwordRecoveryInProgress,
        securityVerified,
        recoveryEmailVerified,
        account_locked
      }
    });
  }, [
    currentStep,
    signupInProgress,
    signupSecurityQuestionsSubmitted,
    signupEmailVerified,
    passwordRecoveryInProgress,
    securityVerified,
    recoveryEmailVerified,
    account_locked,
    isAuthenticated,
    token
  ]);

  // Helper function to check flow state
  const checkFlowState = () => {
    if (!requiredFlowState && !allowedFlowStates.length) return true;
    
    const currentFlowStates = {
      signupInProgress,
      signupSecurityQuestionsSubmitted,
      signupEmailVerified,
      passwordRecoveryInProgress,
      securityVerified,
      recoveryEmailVerified,
      account_locked
    };

    if (requiredFlowState) {
      const isValid = currentFlowStates[requiredFlowState];
      console.log('RouteGuard - Flow State Check:', { requiredFlowState, isValid });
      return isValid;
    }

    const isValid = allowedFlowStates.some(state => currentFlowStates[state]);
    console.log('RouteGuard - Allowed Flow States Check:', { allowedFlowStates, isValid });
    return isValid;
  };

  // Check if current step is allowed
  const isStepAllowed = () => {
    if (!requiredStep && !allowedSteps.length) return true;
    if (allowedSteps.includes(currentStep)) return true;
    const isValid = currentStep === requiredStep;
    console.log('RouteGuard - Step Check:', { currentStep, requiredStep, isValid });
    return isValid;
  };

  // Allow access if:
  // 1. No specific step is required AND no flow state is required
  // 2. Current step is in allowed steps AND flow state is valid
  // 3. Current step matches required step AND flow state is valid
  const shouldAllowAccess = (!requiredStep && !requiredFlowState) || 
    (isStepAllowed() && checkFlowState());

  console.log('RouteGuard - Access Decision:', { shouldAllowAccess });

  if (shouldAllowAccess) {
    return children;
  }

  // Redirect to specified route if conditions not met
  console.log('RouteGuard - Redirecting to:', redirectTo);
  return <Navigate to={redirectTo} replace />;
};

export default RouteGuard; 