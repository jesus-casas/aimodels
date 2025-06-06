const API_BASE_URL = 
  process.env.NODE_ENV === 'development'
    ? 'http://localhost:3001/api' 
    : 'https://auth-backend-7pl7.onrender.com/api';

const BASE_URL = 
  process.env.NODE_ENV === 'development'
    ? 'http://localhost:3001'
    : 'https://auth-backend-7pl7.onrender.com';

// Helper function to handle API responses
const handleResponse = async (response) => {
  if (!response.ok) {
    const errorData = await response.json();
    let errorMessage = 'API request failed';
    
    if (errorData.error) {
      // For authentication errors, provide a generic message
      if (response.status === 401) {
        if (errorData.remainingAttempts !== undefined) {
          if (errorData.remainingAttempts === 0) {
            // When no attempts left, treat it as a lockout
            const error = new Error('Too many failed attempts');
            error.status = 429;
            error.data = errorData;
            throw error;
          }
          errorMessage = `Verification failed. ${errorData.remainingAttempts} attempts remaining.`;
        } else {
          errorMessage = 'Verification failed. Please try again.';
        }
      } else if (response.status === 429) {
        errorMessage = 'Too many attempts. Please try again later.';
      } else {
        errorMessage = 'An unexpected error occurred. Please try again.';
      }
    }
    
    const error = new Error(errorMessage);
    error.status = response.status;
    error.data = errorData;
    throw error;
  }
  return response.json();
};

// Auth API endpoints
export const authAPI = {
  // Login
  login: async (credentials) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: credentials.username,
        password: credentials.password
      }),
    });
    return handleResponse(response);
  },

  // Signup
  signup: async (userData) => {
    const response = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    return handleResponse(response);
  },

  // Security Questions (Signup)
  submitSecurityQuestionsSignup: async (answers) => {
    const response = await fetch(`${API_BASE_URL}/auth/security-questions-signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(answers),
    });
    return handleResponse(response);
  },

  // Email Verification (Signup)
  verifyEmailSignup: async (token) => {
    const response = await fetch(`${API_BASE_URL}/auth/verify-email-signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
    });
    return handleResponse(response);
  },

  // Resend Verification Email
  resendVerificationEmail: async (email) => {
    const response = await fetch(`${API_BASE_URL}/auth/verify-email-signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });
    return handleResponse(response);
  },

  // Password Reset Request
  requestPasswordReset: async (email) => {
    const response = await fetch(`${API_BASE_URL}/auth/request-password-reset`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });
    return handleResponse(response);
  },

  // Security Questions (Password Reset)
  verifySecurityQuestions: async (answers) => {
    const response = await fetch(`${API_BASE_URL}/auth/security-questions-reset`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: localStorage.getItem('recoveryEmail'),
        securityAnswers: answers
      }),
    });
    return handleResponse(response);
  },

  // Email Verification (Password Reset)
  verifyEmailReset: async (token) => {
    const response = await fetch(`${API_BASE_URL}/auth/verify-email-reset`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
    });
    return handleResponse(response);
  },

  // Reset Password
  resetPassword: async (newPassword) => {
    const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        newPassword,
        email: localStorage.getItem('recoveryEmail')
      }),
    });
    return handleResponse(response);
  },

  // Check account lockout status
  checkAccountLockout: async (email) => {
    const response = await fetch(`${API_BASE_URL}/auth/check-lockout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });
    return handleResponse(response);
  },

  logout: async () => {
    const response = await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    return handleResponse(response);
  },

  // Download confidential file
  downloadFile: async () => {
    const token = JSON.parse(localStorage.getItem("authState"))?.token;
    if (!token) throw new Error("No authentication token found");

    const response = await fetch(`${BASE_URL}/downloads`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Download failed');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "company_confidential_file.txt";  // Set the default filename
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};

// Temp Chat API endpoints for anonymous users
export const tempChatAPI = {
  // Create a new temp chat
  createChat: async ({ session_id, title }) => {
    const response = await fetch(`${API_BASE_URL}/tempchat/chats`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id, title })
    });
    return handleResponse(response);
  },

  // Get all chats for a session
  getChats: async (session_id) => {
    const response = await fetch(`${API_BASE_URL}/tempchat/chats/${session_id}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    return handleResponse(response);
  },

  // Add a message to a temp chat
  addMessage: async ({ chat_id, role, content }) => {
    const response = await fetch(`${API_BASE_URL}/tempchat/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id, role, content })
    });
    return handleResponse(response);
  },

  // Get all messages for a temp chat
  getMessages: async (chat_id) => {
    const response = await fetch(`${API_BASE_URL}/tempchat/messages/${chat_id}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    return handleResponse(response);
  },

  // Delete a chat and its messages
  deleteChat: async (chat_id) => {
    const response = await fetch(`${API_BASE_URL}/tempchat/chats/${chat_id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' }
    });
    return handleResponse(response);
  },

  // Multi-turn chat completion for anonymous users
  completeChat: async ({ chat_id, role, content, model }) => {
    const response = await fetch(`${API_BASE_URL}/tempchat/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id, role, content, model: model.toLowerCase() })
    });
    return handleResponse(response);
  },

  // Multi-turn chat completion for anonymous users (streaming)
  completeChatStream: async ({ chat_id, role, content, model }) => {
    const response = await fetch(`${API_BASE_URL}/tempchat/complete/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id, role, content, model: model.toLowerCase() })
    });
    if (!response.ok) {
      throw new Error('Streaming request failed');
    }
    return response.body.getReader(); // Return the ReadableStreamDefaultReader
  },
}; 
