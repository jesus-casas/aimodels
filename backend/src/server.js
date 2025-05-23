const express = require('express');
const cors = require('cors');
const { validateSignup, validateSecurityQuestions } = require('./middleware/validation');
const { query } = require('./config/db');
const { logDatabaseOperation } = require('./utils/logger');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { sendEmail } = require('./utils/emailTransport');
const initializeDatabase = require('./config/init-db');
const createTestUser = require('./scripts/create-test-user');
const axios = require('axios');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Register Download Route
const downloadRoute = require("./routes/download.route");
app.use("/downloads", downloadRoute);

// Register Chat Route
const chatRoute = require("./routes/chat.route");
app.use("/api/chat", chatRoute);

// Function to schedule resetting of security question attempts after 3 minutes
const scheduleSecurityQuestionsReset = async (userId) => {
  console.log(`Scheduling reset of security question attempts for user ID: ${userId}`);
  setTimeout(async () => {
    try {
      // Reset the lock and attempts count after 3 minutes
      await query(
        'UPDATE users SET is_security_questions_locked = FALSE, remaining_security_question_attempts = 3 WHERE id = $1',
        [userId]
      );
      console.log(`Successfully reset security question attempts for user ID: ${userId}`);
    } catch (error) {
      console.error(`Failed to reset security question attempts for user ID: ${userId}`, error);
    }
  }, 3 * 60 * 1000); // 3 minutes in milliseconds
};

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    // Get user from database
    const result = await query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );
    
    if (result.rows.length === 0) {
      // Log failed attempt for non-existent user
      await query(
        'INSERT INTO login_history (username, ip_address, status, failure_reason, email) VALUES ($1, $2, $3, $4, $5)',
        [username, req.ip, 'failed', 'User not found', username]
      );
      console.log(`Login failed: ${username} - User not found`);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    
    // Verify password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      // Log failed attempt for incorrect password
      await query(
        'INSERT INTO login_history (user_id, username, ip_address, status, failure_reason, email) VALUES ($1, $2, $3, $4, $5, $6)',
        [user.id, username, req.ip, 'failed', 'Invalid password', user.email]
      );
      console.log(`Login failed: ${username} - Invalid password`);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    // Record successful login
    await query(
      'INSERT INTO login_history (user_id, username, ip_address, status, email) VALUES ($1, $2, $3, $4, $5)',
      [user.id, username, req.ip, 'success', user.email]
    );

    // Get login history
    const loginHistoryResult = await query(
      `SELECT 
        COUNT(*) as total_attempts,
        SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as successful_logins,
        MAX(CASE WHEN status = 'success' THEN login_timestamp END) as last_successful_login,
        COUNT(CASE WHEN status = 'failed' AND login_timestamp > NOW() - INTERVAL '24 hours' THEN 1 END) as recent_failed_attempts
       FROM login_history 
       WHERE user_id = $1`,
      [user.id]
    );

    // Get detailed login history
    const detailedHistoryResult = await query(
      `SELECT 
        login_timestamp,
        status,
        failure_reason
       FROM login_history 
       WHERE user_id = $1
       ORDER BY login_timestamp DESC`,
      [user.id]
    );

    const loginHistory = loginHistoryResult.rows[0];
    const successfulLogins = parseInt(loginHistory.successful_logins);
    const lastLogin = loginHistory.last_successful_login;
    const recentFailedAttempts = parseInt(loginHistory.recent_failed_attempts);
    const detailedHistory = detailedHistoryResult.rows;

    // Keep detailed logging in the backend
    logDatabaseOperation('Login', { 
      username: user.username,
      email: user.email,
      successfulLogins,
      lastLogin,
      recentFailedAttempts
    });
    
    // Only send necessary information to frontend
    res.json({
      user: {
        firstName: user.first_name,
        lastName: user.last_name,
        loginCount: successfulLogins,
        lastLogin: lastLogin
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Signup endpoint with validation
app.post('/api/auth/signup', validateSignup, async (req, res) => {
  try {
    const { 
      username,
      email, 
      password,
      confirmPassword,
      firstName, 
      lastName,
      birthday
    } = req.body;
    const recaptchaToken = req.body['g-recaptcha-response'];

    if (!recaptchaToken) {
      return res.status(400).json({ error: 'reCAPTCHA token missing' });
    }
    
    try {
      const secretKey = process.env.RECAPTCHA_SECRET;
      const verificationURL = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${recaptchaToken}`;
    
      const recaptchaResponse = await axios.post(verificationURL);
      if (!recaptchaResponse.data.success) {
        return res.status(403).json({ error: 'Failed reCAPTCHA verification' });
      }
    } catch (err) {
      console.error('Signup reCAPTCHA error:', err.message);
      return res.status(500).json({ error: 'Error verifying reCAPTCHA' });
    }
    // Verify passwords match
    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }

    // Check if username already exists
    const usernameCheck = await query(
      'SELECT id FROM users WHERE username = $1',
      [username]
    );

    if (usernameCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Username already taken' });
    }

    // Check if email already exists
    const emailCheck = await query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (emailCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    
    // Insert user into database
    const result = await query(
      'INSERT INTO users (username, email, password_hash, first_name, last_name, birthday) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [username, email, passwordHash, firstName, lastName, birthday]
    );

    const user = result.rows[0];
    logDatabaseOperation('Signup', { 
      username: user.username,
      email: user.email, 
      firstName, 
      lastName,
      birthday 
    });
    
    res.json({
      success: true,
      message: 'Signup initiated successfully',
      userId: user.id
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Security Questions endpoint (for signup)
app.post('/api/auth/security-questions-signup', validateSecurityQuestions, async (req, res) => {
  try {
    const { 
      userId, 
      question1, 
      answer1, 
      question2, 
      answer2,
      question3,
      answer3
    } = req.body;

    // Hash security questions
    const salt = await bcrypt.genSalt(10);
    const answer1Hash = await bcrypt.hash(answer1, salt);
    const answer2Hash = await bcrypt.hash(answer2, salt);
    const answer3Hash = await bcrypt.hash(answer3, salt);
    
    // Store only the question IDs
    await query(
      'INSERT INTO security_questions (user_id, question1_id, answer1, question2_id, answer2, question3_id, answer3) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [userId, question1, answer1Hash, question2, answer2Hash, question3, answer3Hash]
    );

    logDatabaseOperation('Security Questions Added', { userId });
    
    // Get user email from userId
    const userResult = await query(
      'SELECT email FROM users WHERE id = $1',
      [userId]
    );
    
    if (userResult.rows.length > 0) {
      const email = userResult.rows[0].email;
      
      // Generate verification token
      const verificationToken = jwt.sign(
        { userId },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );
      
      // Delete any existing tokens for this user
      await query(
        'DELETE FROM email_verification_tokens WHERE user_id = $1',
        [userId]
      );
      
      // Store new verification token
      await query(
        'INSERT INTO email_verification_tokens (user_id, token, expires_at) VALUES ($1, $2, NOW() + INTERVAL \'24 hours\')',
        [userId, verificationToken]
      );
      
      // Create verification link
      const verificationLink = `${process.env.FRONTEND_URL}/confirm-email?token=${verificationToken}`;
      
      // Send verification email with confirmation type
      await sendEmail(email, verificationLink, 'confirmation');
      
      // Email confirmation sent after security questions
      logDatabaseOperation('Email Confirmation Sent', { userId, emailAddress: email });
    }
    
    res.json({
      success: true,
      message: 'Security questions submitted successfully'
    });
  } catch (error) {
    console.error('Security questions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Email verification endpoint (for signup)
app.post('/api/auth/verify-email-signup', async (req, res) => {
  try {
    const { token, email } = req.body;
    
    // If token is provided, this is a verification attempt
    if (token) {
      try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId;

        // Check if token exists and is valid
        const tokenResult = await query(
          'SELECT * FROM email_verification_tokens WHERE user_id = $1 AND token = $2 AND expires_at > NOW()',
          [userId, token]
        );

        if (tokenResult.rows.length === 0) {
          return res.status(400).json({ error: 'Invalid or expired token' });
        }

        // Update user's email verification status
        await query(
          'UPDATE users SET is_email_verified = true WHERE id = $1',
          [userId]
        );

        // Delete used token
        await query(
          'DELETE FROM email_verification_tokens WHERE user_id = $1 AND token = $2',
          [userId, token]
        );

        // Get user email for logging
        const userResult = await query(
          'SELECT email FROM users WHERE id = $1',
          [userId]
        );
        
        const email = userResult.rows.length > 0 ? userResult.rows[0].email : 'unknown';
        
        logDatabaseOperation('Email Confirmed', { userId, emailAddress: email });
        
        return res.json({
          success: true,
          message: 'Email confirmed successfully'
        });
      } catch (error) {
        console.error('Token verification error:', error);
        return res.status(400).json({ error: 'Invalid or expired token' });
      }
    }

    // If email is provided, this is a resend request
    if (email) {
      try {
        // Get user ID from email
        const userResult = await query(
          'SELECT id FROM users WHERE email = $1',
          [email]
        );

        if (userResult.rows.length === 0) {
          return res.status(404).json({ error: 'User not found' });
        }

        const userId = userResult.rows[0].id;

        // Generate new verification token
        const verificationToken = jwt.sign(
          { userId },
          process.env.JWT_SECRET,
          { expiresIn: '24h' }
        );

        // Delete any existing tokens for this user
        await query(
          'DELETE FROM email_verification_tokens WHERE user_id = $1',
          [userId]
        );

        // Store new verification token
        await query(
          'INSERT INTO email_verification_tokens (user_id, token, expires_at) VALUES ($1, $2, NOW() + INTERVAL \'24 hours\')',
          [userId, verificationToken]
        );

        // Create verification link
        const verificationLink = `${process.env.FRONTEND_URL}/confirm-email?token=${verificationToken}`;

        // Send verification email with resend confirmation type
        await sendEmail(email, verificationLink, 'resendConfirmation');

        logDatabaseOperation('Verification Email Resent', { userId, emailAddress: email });
        
        return res.json({
          success: true,
          message: 'Verification email resent successfully'
        });
      } catch (error) {
        console.error('Resend verification error:', error);
        return res.status(500).json({ error: 'Failed to resend verification email' });
      }
    }

    return res.status(400).json({ error: 'Invalid request' });
  } catch (error) {
    console.error('Email verification error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// New endpoint to confirm email
app.post('/api/auth/confirm-email', async (req, res) => {
  try {
    const { token } = req.body;

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    // Check if token exists and is valid
    const tokenResult = await query(
      'SELECT * FROM email_verification_tokens WHERE user_id = $1 AND token = $2 AND expires_at > NOW()',
      [userId, token]
    );

    if (tokenResult.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }

    // Update user's email verification status
    await query(
      'UPDATE users SET is_email_verified = true WHERE id = $1',
      [userId]
    );

    // Delete used token
    await query(
      'DELETE FROM email_verification_tokens WHERE user_id = $1 AND token = $2',
      [userId, token]
    );

    // Get user email for logging
    const userResult = await query(
      'SELECT email FROM users WHERE id = $1',
      [userId]
    );
    
    const email = userResult.rows.length > 0 ? userResult.rows[0].email : 'unknown';
    
    logDatabaseOperation('Email Confirmed', { userId, emailAddress: email });
    
    res.json({
      success: true,
      message: 'Email confirmed successfully'
    });
  } catch (error) {
    console.error('Email confirmation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Password reset request endpoint
app.post('/api/auth/request-password-reset', async (req, res) => {
  try {
    const { email } = req.body;
    
    // Generate reset token
    const token = jwt.sign(
      { email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    // Check if user exists
    const userResult = await query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );
    
    // If user doesn't exist, log it server-side but return success response
    if (userResult.rows.length === 0) {
      console.log(`Password reset attempted for nonexistent email: ${email}`);
      // Return success anyway for security (don't reveal if user exists)
      return res.json({
        success: true,
        emailExists: false,
        message: 'If your email is registered, you will receive reset instructions'
      });
    }
    
    const userId = userResult.rows[0].id;
    
    // Store reset token
    await query(
      'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, NOW() + INTERVAL \'1 hour\')',
      [userId, token]
    );

    logDatabaseOperation('Password Reset Requested', { userId, emailAddress: email });
    
    res.json({
      success: true,
      emailExists: true,
      message: 'If your email is registered, you will receive reset instructions'
    });
  } catch (error) {
    console.error('Password reset request error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Security Questions endpoint (for password reset)
app.post('/api/auth/security-questions-reset', async (req, res) => {
  try {
    const { email, securityAnswers } = req.body;
    
    // First, check if the user exists and get their lockout status
    const userResult = await query(
      'SELECT id, is_security_questions_locked, remaining_security_question_attempts FROM users WHERE email = $1',
      [email]
    );
    
    if (userResult.rows.length === 0) {
      // Log failed attempt on server side only
      console.log(`Security questions attempted for nonexistent email: ${email}`);
      await query(
        'INSERT INTO password_reset_attempts (email, status, failure_reason) VALUES ($1, $2, $3)',
        [email, 'failed', 'User not found']
      );
      
      // Return generic response (don't reveal user doesn't exist)
      return res.status(200).json({ 
        success: false,
        attemptsLeft: 2
      });
    }
    
    const user = userResult.rows[0];
    const userId = user.id; // Get userId from the user object
    
    // Check if account is already locked
    if (user.is_security_questions_locked) {
      await query(
        'INSERT INTO password_reset_attempts (user_id, email, status, failure_reason) VALUES ($1, $2, $3, $4)',
        [userId, email, 'failed', 'Account locked due to too many failed attempts']
      );
      
      return res.status(429).json({ 
        locked: true,
        remainingTime: 180 // 3 minutes in seconds
      });
    }
    
    // Get user's security questions
    const result = await query(
      `SELECT sq.* FROM security_questions sq 
       WHERE sq.user_id = $1`,
      [userId]
    );
    
    if (result.rows.length === 0) {
      // Log failed attempt on server side only
      console.log(`Security questions not found for user: ${email}`);
      await query(
        'INSERT INTO password_reset_attempts (user_id, email, status, failure_reason) VALUES ($1, $2, $3, $4)',
        [userId, email, 'failed', 'Security questions not found']
      );
      
      return res.status(200).json({ 
        success: false,
        attemptsLeft: user.remaining_security_question_attempts - 1
      });
    }
    
    const questions = result.rows[0];
    
    // Verify answers using question IDs
    let correctAnswers = 0;
    
    // Check each answer
    for (const { questionId, answer } of securityAnswers) {
      if (
        (questions.question1_id === questionId && bcrypt.compare(answer, questions.answer1)) ||
        (questions.question2_id === questionId && bcrypt.compare(answer, questions.answer2)) ||
        (questions.question3_id === questionId && bcrypt.compare(answer, questions.answer3))
      ) {
        correctAnswers++;
      }
    }
    
    // Require at least 2 correct answers
    if (correctAnswers < 2) {
      // Decrement the attempts counter
      const remainingAttempts = Math.max(0, user.remaining_security_question_attempts - 1);
      let isLocked = false;
      
      if (remainingAttempts === 0) {
        isLocked = true;
        // Schedule reset after 3 minutes
        scheduleSecurityQuestionsReset(userId);
      }
      
      // Update the user's attempts counter and lock status
      await query(
        'UPDATE users SET remaining_security_question_attempts = $1, is_security_questions_locked = $2 WHERE id = $3',
        [remainingAttempts, isLocked, userId]
      );
      
      // Log failed attempt
      await query(
        'INSERT INTO password_reset_attempts (user_id, email, status, failure_reason) VALUES ($1, $2, $3, $4)',
        [userId, email, 'failed', 'Incorrect security answers']
      );
      
      if (isLocked) {
        return res.status(429).json({ 
          locked: true,
          remainingTime: 180 // 3 minutes in seconds
        });
      } else {
        return res.status(200).json({ 
          success: false,
          attemptsLeft: remainingAttempts
        });
      }
    }

    // Reset the attempts counter on successful verification
    await query(
      'UPDATE users SET remaining_security_question_attempts = 3, is_security_questions_locked = FALSE WHERE id = $1',
      [userId]
    );
    
    // Log successful attempt
    await query(
      'INSERT INTO password_reset_attempts (user_id, email, status) VALUES ($1, $2, $3)',
      [userId, email, 'success']
    );

    // Security questions verified
    logDatabaseOperation('Security Questions Verified', { userId, emailAddress: email });
    
    res.json({
      success: true
    });
  } catch (error) {
    console.error('Security questions verification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Reset password endpoint
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { newPassword, email } = req.body;
    
    if (!email) {
      return res.status(400).json({ success: false });
    }

    // Get user ID
    const userResult = await query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );
    
    if (userResult.rows.length === 0) {
      console.log(`Password reset attempted for nonexistent email: ${email}`);
      return res.status(200).json({ success: false });
    }
    
    const userId = userResult.rows[0].id;
    
    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);
    
    // Update password
    await query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [passwordHash, userId]
    );

    // Log the password reset with more details
    logDatabaseOperation('Password Reset Successfully Completed', { 
      userId,
      emailAddress: email,
      timestamp: new Date().toISOString()
    });
    
    res.json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ success: false });
  }
});

// Logout endpoint
app.post('/api/auth/logout', (req, res) => {
  logDatabaseOperation('Logout', {});
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

// Check lockout status endpoint
app.post('/api/auth/check-lockout', async (req, res) => {
  try {
    const { email } = req.body;
    
    // Check user's lockout status directly from users table
    const userResult = await query(
      'SELECT id, is_security_questions_locked FROM users WHERE email = $1',
      [email]
    );
    
    if (userResult.rows.length === 0) {
      // Don't reveal that the user doesn't exist
      return res.json({ locked: false });
    }
    
    const user = userResult.rows[0];
    
    if (user.is_security_questions_locked) {
      return res.json({ 
        locked: true,
        remainingTime: 180 // 3 minutes in seconds
      });
    }
    
    res.json({ locked: false });
  } catch (error) {
    console.error('Check lockout error:', error);
    res.status(500).json({ success: false });
  }
});

const PORT = process.env.PORT || 3001;

(async () => {
  try {
    await initializeDatabase();    // Step 1: Reset DB
    await createTestUser();        // Step 2: Insert test user

    const PORT = process.env.PORT || 3001;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Startup failed:', err);
    process.exit(1);
  }
})();
