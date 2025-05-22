import { create } from 'zustand';
import { authAPI } from '../services/api';

// Load initial state from localStorage
const loadState = () => {
  try {
    const serializedState = localStorage.getItem('authState');
    if (serializedState === null) {
      return undefined;
    }
    return JSON.parse(serializedState);
  } catch (err) {
    return undefined;
  }
};

// Save state to localStorage
const saveState = (state) => {
  try {
    const serializedState = JSON.stringify(state);
    localStorage.setItem('authState', serializedState);
  } catch (err) {
    // Handle errors here
  }
};

const useAuthStore = create((set, get) => ({
  // Core auth state
  isAuthenticated: loadState()?.isAuthenticated || false,
  user: loadState()?.user || null,
  token: loadState()?.token || null,
  currentStep: loadState()?.currentStep || null,
  isLoading: false,
  error: null,
  account_locked: loadState()?.account_locked || false,

  // Signup flow states
  signupInProgress: loadState()?.signupInProgress || false,
  signupSecurityQuestionsSubmitted: loadState()?.signupSecurityQuestionsSubmitted || false,
  signupEmailVerified: loadState()?.signupEmailVerified || false,

  // Password recovery flow states
  passwordRecoveryInProgress: loadState()?.passwordRecoveryInProgress || false,
  securityVerified: loadState()?.securityVerified || false,
  recoveryEmailVerified: loadState()?.recoveryEmailVerified || false,

  // State setters with persistence
  setStep: (step) => {
    set({ currentStep: step });
    saveState(get());
  },
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),

  // Login Flow Actions
  loginAndRedirect: async (credentials) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authAPI.login(credentials);
      
      if (!response || !response.token) {
        throw new Error('Invalid login response');
      }

      // Update auth state
      const newState = {
        isAuthenticated: true,
        user: response.user,
        token: response.token,
        currentStep: 'authenticated',
        isLoading: false
      };
      set(newState);
      saveState(newState);

      // Handle navigation in the store
      window.location.href = '/welcome';
    } catch (error) {
      const errorState = { 
        error: error.message || 'Login failed', 
        isLoading: false,
        isAuthenticated: false,
        user: null,
        token: null
      };
      set(errorState);
      saveState(errorState);
    }
  },

  logout: async () => {
    try {
      // Call logout endpoint
      await authAPI.logout();
      
      // Clear localStorage
      localStorage.removeItem('authState');
      
      // Reset all state
      const resetState = {
        isAuthenticated: false,
        user: null,
        token: null,
        currentStep: null,
        // Reset all flow states
        signupInProgress: false,
        signupSecurityQuestionsSubmitted: false,
        signupEmailVerified: false,
        passwordRecoveryInProgress: false,
        securityVerified: false,
        recoveryEmailVerified: false,
        isLoading: false,
        error: null
      };
      
      set(resetState);

      // Handle navigation
      window.location.href = '/';
    } catch (error) {
      console.error('Logout failed:', error);
    }
  },

  // Signup Flow Actions
  signupAndRedirect: async (userData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authAPI.signup(userData);
      
      if (!response || !response.success) {
        throw new Error('Invalid signup response');
      }

      // Update auth state
      const newState = {
        signupInProgress: true,
        currentStep: 'signup_started',
        isLoading: false,
        error: null,
        userId: response.userId
      };
      
      // Save state to localStorage
      set(newState);
      saveState(newState);

      // Navigate to security questions page
      window.location.replace('/security-questions-signup');
    } catch (error) {
      const errorState = { 
        error: error.message || 'Signup failed', 
        isLoading: false,
        signupInProgress: false
      };
      set(errorState);
      saveState(errorState);
    }
  },

  submitSecurityQuestions: async (answers) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authAPI.submitSecurityQuestionsSignup(answers);
      if (!response || !response.success) {
        throw new Error('Failed to submit security questions');
      }

      // Get current state to maintain signup progress
      const currentState = get();

      // Update auth state while maintaining signup progress
      const newState = {
        ...currentState,
        signupInProgress: true,
        signupSecurityQuestionsSubmitted: true,
        currentStep: 'security_questions_submitted',
        error: null,
        isLoading: false
      };
      
      // Save state to localStorage
      set(newState);
      saveState(newState);

      // Navigate to confirm email page
      window.location.replace('/confirm-email');
    } catch (error) {
      const errorState = {
        error: error.message || 'Failed to submit security questions',
        isLoading: false
      };
      set(errorState);
      saveState(errorState);
    }
  },

  verifySignupEmail: async (token) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authAPI.verifyEmailSignup(token);
      if (!response || !response.success) {
        throw new Error('Failed to verify email');
      }
      set({ 
        signupEmailVerified: true,
        currentStep: 'email_verified',
        error: null,
        isLoading: false
      });
    } catch (error) {
      set({ 
        error: error.message || 'Failed to verify email',
        isLoading: false
      });
    }
  },

  completeSignup: () => {
    set({ 
      signupInProgress: false,
      signupSecurityQuestionsSubmitted: false,
      signupEmailVerified: false,
      currentStep: 'signup_completed',
      error: null
    });
  },

  // Password Recovery Flow Actions
  startPasswordRecovery: async (email) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authAPI.requestPasswordReset(email);
      
      // Store the recovery email only if it exists
      if (response && response.success && response.emailExists) {
        localStorage.setItem('recoveryEmail', email);
        set({ 
          passwordRecoveryInProgress: true,
          currentStep: 'recovery_started',
          error: null,
          isLoading: false
        });
      } else {
        set({ isLoading: false });
      }
      
      return response;
    } catch (error) {
      set({ 
        error: error.message || 'Failed to initiate password recovery',
        isLoading: false
      });
      return { success: false, error: error.message };
    }
  },

  verifySecurity: async (answers) => {
    try {
      const response = await authAPI.verifySecurityQuestions(answers);
      return response;
    } catch (error) {
      // Return the error response without throwing
      return error.response?.data || { success: false, attemptsLeft: 0 };
    }
  },

  // Add new method for handling security questions verification flow
  handleSecurityQuestionsVerification: async (answers) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authAPI.verifySecurityQuestions(answers);
      
      if (response.success) {
        // Set security verified state
        const newState = { 
          securityVerified: true,
          currentStep: 'security_verified',
          isLoading: false
        };
        set(newState);
        
        // Manually save state to localStorage
        const currentState = get();
        saveState(currentState);
        
        // Navigate to reset password page
        setTimeout(() => {
          window.location.href = '/reset-password';
        }, 200);
        
        return { success: true };
      } else if (response.attemptsLeft === 0) {
        // Account is locked, navigate to locked out page
        set({ isLoading: false });
        window.location.replace('/locked-out');
        return { success: false, locked: true };
      } else {
        // Return attempts info without navigation
        set({ isLoading: false });
        return { 
          success: false, 
          error: `Verification failed. ${response.attemptsLeft} ${response.attemptsLeft === 1 ? 'attempt' : 'attempts'} remaining.`,
          attemptsLeft: response.attemptsLeft 
        };
      }
    } catch (error) {
      set({ isLoading: false });
      return { 
        success: false, 
        error: error.message || 'An unexpected error occurred. Please try again.' 
      };
    }
  },

  verifyRecoveryEmail: async (token) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authAPI.verifyEmailReset(token);
      if (!response || !response.success) {
        throw new Error('Failed to verify recovery email');
      }
      set({ 
        recoveryEmailVerified: true,
        currentStep: 'recovery_email_verified',
        error: null,
        isLoading: false
      });
    } catch (error) {
      set({ 
        error: error.message || 'Failed to verify recovery email',
        isLoading: false
      });
    }
  },

  // Add method to check if account is locked for security questions
  checkLockoutStatus: async () => {
    try {
      const email = localStorage.getItem('recoveryEmail');
      if (!email) {
        return { locked: false, error: 'No recovery email found' };
      }
      
      const response = await authAPI.checkAccountLockout(email);
      return response;
    } catch (error) {
      console.error('Failed to check account lockout status:', error);
      return { locked: false, error: error.message };
    }
  },

  resetPassword: async (newPassword) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authAPI.resetPassword(newPassword);
      if (!response || !response.success) {
        throw new Error('Failed to reset password');
      }
      
      // Update state
      set({
        passwordRecoveryInProgress: false,
        securityVerified: false,
        recoveryEmailVerified: false,
        currentStep: 'password_reset_completed',
        isLoading: false
      });
      
      // Navigate to login page
      window.location.href = '/login';
      return true;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      return false;
    }
  },

  // User management
  updateUser: (userData) => {
    set({
      user: userData,
      error: null
    });
  },

  // Auth state checks
  isLoggedIn: () => get().isAuthenticated,
  hasToken: () => !!get().token,
  getUser: () => get().user,

  // Flow state checks
  isSignupInProgress: () => get().signupInProgress,
  hasSubmittedSecurityQuestions: () => get().signupSecurityQuestionsSubmitted,
  isSignupEmailVerified: () => get().signupEmailVerified,
  isPasswordRecoveryInProgress: () => get().passwordRecoveryInProgress,
  isSecurityVerified: () => get().securityVerified,
  isRecoveryEmailVerified: () => get().recoveryEmailVerified,

  // Error handling
  clearError: () => set({ error: null }),

  // Reset state
  reset: () => set({
    isAuthenticated: false,
    user: null,
    token: null,
    currentStep: null,
    isLoading: false,
    error: null,
    // Reset all flow states
    signupInProgress: false,
    signupSecurityQuestionsSubmitted: false,
    signupEmailVerified: false,
    passwordRecoveryInProgress: false,
    securityVerified: false,
    recoveryEmailVerified: false
  })
}));

export default useAuthStore; 