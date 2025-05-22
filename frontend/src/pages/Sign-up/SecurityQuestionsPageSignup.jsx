import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';

const SecurityQuestionsPageSignup = () => {
  const [selectedQuestions, setSelectedQuestions] = useState(['', '', '']);
  const [answers, setAnswers] = useState(['', '', '']);
  const [formErrors, setFormErrors] = useState({});
  const [isCheckingState, setIsCheckingState] = useState(true);
  const navigate = useNavigate();
  const { submitSecurityQuestions, isLoading, error, signupInProgress, currentStep } = useAuthStore();

  // Add debugging
  useEffect(() => {
    console.log('SecurityQuestionsPageSignup mounted');
    console.log('Current state:', { signupInProgress, currentStep });
  }, []);

  // Check if we're on the right step
  useEffect(() => {
    const checkState = () => {
      console.log('Checking state:', { signupInProgress, currentStep });
      if (!signupInProgress || currentStep !== 'signup_started') {
        console.log('Invalid state, redirecting to signup');
        navigate('/signup');
      } else {
        console.log('State is valid, showing form');
        setIsCheckingState(false);
      }
    };

    // Check state after a short delay to ensure localStorage is loaded
    const timer = setTimeout(checkState, 100);
    return () => clearTimeout(timer);
  }, [signupInProgress, currentStep, navigate]);

  const handleQuestionChange = (index, questionId) => {
    const newSelectedQuestions = [...selectedQuestions];
    newSelectedQuestions[index] = questionId;
    setSelectedQuestions(newSelectedQuestions);
  };

  const handleAnswerChange = (index, value) => {
    const newAnswers = [...answers];
    newAnswers[index] = value;
    setAnswers(newAnswers);
  };

  const validateForm = () => {
    const errors = {};
    selectedQuestions.forEach((question, index) => {
      if (!question) {
        errors[`question${index}`] = 'Please select a security question';
      }
    });
    answers.forEach((answer, index) => {
      if (!answer.trim()) {
        errors[`answer${index}`] = 'Please provide an answer';
      }
    });
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      console.log('Submitting security questions...');
      
      // Get the userId directly from localStorage parsing the authState
      const authState = JSON.parse(localStorage.getItem('authState')) || {};
      const userId = authState.userId;
      
      if (!userId) {
        console.error('User ID not found in localStorage, redirecting to signup');
        navigate('/signup');
        return;
      }
      
      console.log('Using userId:', userId);
      
      // Format the data as required by the backend
      const securityQuestionsData = {
        userId: userId,
        question1: selectedQuestions[0],
        answer1: answers[0],
        question2: selectedQuestions[1],
        answer2: answers[1],
        question3: selectedQuestions[2],
        answer3: answers[2]
      };

      await submitSecurityQuestions(securityQuestionsData);
      console.log('Security questions submitted successfully');
    } catch (error) {
      console.error('Failed to submit security questions:', error);
    }
  };

  if (isCheckingState) {
    return (
      <div style={styles.container}>
        <div style={styles.formWrapper}>
          <h1 style={styles.title}>Loading...</h1>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.formWrapper}>
        <h1 style={styles.title}>Set Up Your Security Questions</h1>
        {error && <div style={styles.errorMessage}>{error}</div>}
        <form style={styles.form} onSubmit={handleSubmit}>
          {[0, 1, 2].map((index) => (
            <div key={index} style={styles.questionGroup}>
              <select 
                value={selectedQuestions[index]}
                onChange={(e) => handleQuestionChange(index, e.target.value)}
                style={{
                  ...styles.select,
                  ...(formErrors[`question${index}`] ? styles.inputError : {})
                }}
              >
                <option value="">Select a security question</option>
                {securityQuestions.map((q) => (
                  <option 
                    key={q.id} 
                    value={q.id}
                    disabled={selectedQuestions.includes(q.id) && selectedQuestions[index] !== q.id}
                  >
                    {q.question}
                  </option>
                ))}
              </select>
              {formErrors[`question${index}`] && 
                <div style={styles.fieldError}>{formErrors[`question${index}`]}</div>
              }
              <input
                type="text"
                placeholder="Your answer"
                value={answers[index]}
                onChange={(e) => handleAnswerChange(index, e.target.value)}
                style={{
                  ...styles.input,
                  ...(formErrors[`answer${index}`] ? styles.inputError : {})
                }}
              />
              {formErrors[`answer${index}`] && 
                <div style={styles.fieldError}>{formErrors[`answer${index}`]}</div>
              }
            </div>
          ))}
          <p style={styles.warningMessage}>Please save these security questions and answers in a secure location. You'll need them to recover your account if you forget your password.</p>
          <button 
            type="submit" 
            style={styles.button}
            disabled={isLoading}
          >
            {isLoading ? 'Submitting...' : 'Submit'}
          </button>
        </form>
      </div>
    </div>
  );
};

const securityQuestions = [
  { id: "pet", question: "What was the name of your first pet?" },
  { id: "city", question: "What is the name of the city where you were born?" },
  { id: "friend", question: "What was your childhood best friend's name?" },
  { id: "car", question: "What was the make and model of your first car?" },
  { id: "concert", question: "What was the first concert you attended?" },
];

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
  input: {
    padding: '1rem',
    borderRadius: '4px',
    border: '1px solid #ccc',
    fontSize: '1rem',
    transition: 'border-color 0.2s ease',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
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
    fontSize: '1.2rem',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
    marginTop: '1rem',
    ':hover': {
      backgroundColor: '#357ABD',
    },
  },
  questionGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    width: '100%',
    marginBottom: '0.5rem',
  },
  select: {
    padding: '1rem',
    borderRadius: '4px',
    border: '1px solid #ccc',
    fontSize: '1rem',
    transition: 'all 0.2s ease',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
    cursor: 'pointer',
    backgroundColor: 'white',
    appearance: 'none',
    backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 1rem center',
    backgroundSize: '1rem',
    paddingRight: '2.5rem',
    ':hover': {
      borderColor: '#4A90E2',
      backgroundColor: '#f8f9fa',
    },
    ':focus': {
      borderColor: '#4A90E2',
      boxShadow: '0 0 0 3px rgba(74, 144, 226, 0.1)',
    },
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
  errorMessage: {
    color: '#ff3333',
    marginBottom: '1rem',
    textAlign: 'center',
  },
  warningMessage: {
    color: '#666',
    fontSize: '0.9rem',
    textAlign: 'center',
    marginTop: '1rem',
  }
};

export default SecurityQuestionsPageSignup; 