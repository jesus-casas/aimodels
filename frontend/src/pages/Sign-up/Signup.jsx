import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import { validateField, passwordRequirements } from '../../utils/validation';
import ReCAPTCHA from 'react-google-recaptcha';

const Signup = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    birthday: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [password, setPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const navigate = useNavigate();
  const { signupAndRedirect, isLoading, error } = useAuthStore();
  const [recaptchaToken, setRecaptchaToken] = useState('');
  const [recaptchaError, setRecaptchaError] = useState('');
  
  const passwordValidation = Object.keys(passwordRequirements).reduce((acc, key) => ({
    ...acc,
    [key]: key === 'match' 
      ? passwordRequirements[key](formData.password, formData.confirmPassword)
      : passwordRequirements[key](formData.password)
  }), {});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (name === 'password') {
      setPassword(value);
    }
    // Validate field if it's been touched
    if (touched[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: validateField(name, value, formData)
      }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched(prev => ({
      ...prev,
      [name]: true
    }));
    setFormErrors(prev => ({
      ...prev,
      [name]: validateField(name, value, formData)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate all fields
    const errors = {};
    Object.keys(formData).forEach(key => {
      const error = validateField(key, formData[key], formData);
      if (error) errors[key] = error;
    });

    setFormErrors(errors);
    setTouched(Object.keys(formData).reduce((acc, key) => ({...acc, [key]: true}), {}));

    // If there are any errors, don't submit
    if (Object.keys(errors).length > 0) {
      return;
    }

    try {
      // Format birthday from MM/DD/YYYY to YYYY-MM-DD
      const [month, day, year] = formData.birthday.split('/');
      const formattedData = {
        ...formData,
        birthday: `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
      };

      console.log('Submitting signup data:', formattedData);
      if (!recaptchaToken) {
        setRecaptchaError('Please complete the reCAPTCHA.');
        return;
      } else {
        setRecaptchaError('');
      }      
      
      await signupAndRedirect({
        ...formattedData,
        'g-recaptcha-response': recaptchaToken
      });
    } catch (error) {
      console.error('Signup failed:', error);
    }
  };

  const handleShowPassword = (e) => {
    e.preventDefault();
    setShowPasswords(true);
  };

  const handleHidePassword = () => {
    setShowPasswords(false);
  };

  const handleLogin = () => {
    navigate('/');
  };

  const getInputStyle = (name) => ({
    ...styles.input,
    ...(name === 'firstName' || name === 'lastName' ? styles.nameInput : {}),
    ...(touched[name] && formErrors[name] ? styles.inputError : {})
  });

  return (
    <div style={styles.container}>
      <div style={styles.formWrapper}>
        <h1 style={styles.title}>Sign Up</h1>
        {error && <div style={styles.errorMessage}>{error}</div>}
        <form style={styles.form} onSubmit={handleSubmit}>
          <div style={styles.nameContainer}>
            <div style={styles.inputWrapper}>
              <input
                type="text"
                name="firstName"
                placeholder="First Name"
                style={getInputStyle('firstName')}
                value={formData.firstName}
                onChange={handleChange}
                onBlur={handleBlur}
                disabled={isLoading}
              />
              {touched.firstName && formErrors.firstName && 
                <div style={styles.fieldError}>{formErrors.firstName}</div>
              }
            </div>
            <div style={styles.inputWrapper}>
              <input
                type="text"
                name="lastName"
                placeholder="Last Name"
                style={getInputStyle('lastName')}
                value={formData.lastName}
                onChange={handleChange}
                onBlur={handleBlur}
                disabled={isLoading}
              />
              {touched.lastName && formErrors.lastName && 
                <div style={styles.fieldError}>{formErrors.lastName}</div>
              }
            </div>
          </div>

          <div style={styles.inputWrapper}>
            <input
              type="text"
              name="username"
              placeholder="Username"
              style={getInputStyle('username')}
              value={formData.username}
              onChange={handleChange}
              onBlur={handleBlur}
              disabled={isLoading}
            />
            {touched.username && formErrors.username && 
              <div style={styles.fieldError}>{formErrors.username}</div>
            }
          </div>

          <div style={styles.inputWrapper}>
            <input
              type="email"
              name="email"
              placeholder="Email"
              style={getInputStyle('email')}
              value={formData.email}
              onChange={handleChange}
              onBlur={handleBlur}
              disabled={isLoading}
            />
            {touched.email && formErrors.email && 
              <div style={styles.fieldError}>{formErrors.email}</div>
            }
          </div>

          <div style={styles.inputWrapper}>
            <input
              type={showPasswords ? "text" : "password"}
              name="password"
              placeholder="Password"
              style={getInputStyle('password')}
              value={formData.password}
              onChange={handleChange}
              onBlur={handleBlur}
              disabled={isLoading}
            />
            {touched.password && formErrors.password && 
              <div style={styles.fieldError}>{formErrors.password}</div>
            }
          </div>

          <div style={styles.requirementsList}>
            <div style={styles.requirementsGrid}>
              {Object.entries({
                '+12 Characters': 'length',
                'Uppercase': 'uppercase',
                'Lowercase': 'lowercase',
                'Number': 'number',
                'Special Character': 'special',
                'Passwords Match': 'match',
              }).map(([text, key]) => (
                <div key={key} style={styles.requirementItem}>
                  <span style={{
                    ...styles.checkmark,
                    color: passwordValidation[key] ? '#4CAF50' : '#aaa'
                  }}>
                    ✓
                  </span>
                  <span style={{
                    ...styles.requirementText,
                    fontWeight: passwordValidation[key] ? '600' : '400',
                    color: passwordValidation[key] ? '#333' : '#666'
                  }}>
                    {text}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div style={styles.inputWrapper}>
            <input
              type={showPasswords ? "text" : "password"}
              name="confirmPassword"
              placeholder="Confirm Password"
              style={getInputStyle('confirmPassword')}
              value={formData.confirmPassword}
              onChange={handleChange}
              onBlur={handleBlur}
              disabled={isLoading}
            />
            {touched.confirmPassword && formErrors.confirmPassword && 
              <div style={styles.fieldError}>{formErrors.confirmPassword}</div>
            }
          </div>

          <button
            type="button"
            style={styles.showPasswordButton}
            onMouseDown={handleShowPassword}
            onMouseUp={handleHidePassword}
            onMouseLeave={handleHidePassword}
          >
            show password
          </button>

          <div style={styles.inputWrapper}>
            <p style={styles.birthdayLabel}>Birthday</p>
            <input
              type="text"
              name="birthday"
              placeholder="MM/DD/YYYY"
              style={getInputStyle('birthday')}
              value={formData.birthday}
              onChange={handleChange}
              onBlur={handleBlur}
              disabled={isLoading}
            />
            {touched.birthday && formErrors.birthday && 
              <div style={styles.fieldError}>{formErrors.birthday}</div>
            }
          </div>
          <ReCAPTCHA
             sitekey="6LeSNyArAAAAAOP9Q5b5483PhaEGTKlwYsWalyIJ"
             onChange={(token) => setRecaptchaToken(token)}
          />
          {recaptchaError && <div style={styles.fieldError}>{recaptchaError}</div>}
          <button 
            type="submit" 
            style={styles.button}
            disabled={isLoading}
          >
            {isLoading ? 'Signing up...' : 'Sign Up'}
          </button>
          <p style={styles.loginText}>
            Already have an account? {' '}
            <span 
              style={styles.loginLink}
              onClick={handleLogin}
              role="button"
              tabIndex={0}
            >
              Login
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
    backgroundColor: 'white',
    padding: '2.5rem',
    borderRadius: '10px',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
    width: '100%',
    maxWidth: '440px',
    marginTop: '-5rem',
  },
  title: {
    fontSize: '2rem',
    color: '#333',
    marginBottom: '2rem',
    textAlign: 'center',
    margin: '0 0 2rem 0',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  input: {
    padding: '1rem',
    borderRadius: '4px',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: '#ccc',
    fontSize: '1rem',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
  },
  button: {
    padding: '1rem',
    backgroundColor: '#4A90E2',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '1rem',
    cursor: 'pointer',
    width: '100%',
    marginTop: '0.5rem',
  },
  loginText: {
    marginTop: '1rem',
    textAlign: 'center',
    color: '#333',
    margin: '1rem 0 0 0',
  },
  loginLink: {
    color: '#007bff',
    textDecoration: 'none',
    cursor: 'pointer',
  },
  nameContainer: {
    display: 'flex',
    gap: '1rem',
    width: '100%',
  },
  nameInput: {
    flex: 1,
  },
  birthdayLabel: {
    color: '#333',
    fontSize: '0.9rem',
    margin: '0 0 0.5rem 0',
  },
  requirementsList: {
    margin: '-0.5rem 0 0.5rem 0',
    padding: '0 0.5rem',
  },
  requirementsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '0.2rem 1rem',
  },
  requirementItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.8rem',
  },
  checkmark: {
    transition: 'color 0.2s ease',
  },
  requirementText: {
    transition: 'all 0.2s ease',
  },
  showPasswordButton: {
    background: 'none',
    border: 'none',
    color: '#666',
    fontSize: '0.8rem',
    cursor: 'pointer',
    padding: '0',
    marginTop: '-0.5rem',
    marginBottom: '-0.5rem',
    alignSelf: 'flex-start',
    textAlign: 'left',
  },
  errorMessage: {
    color: 'red',
    marginBottom: '1rem',
    textAlign: 'center',
  },
  inputWrapper: {
    width: '100%',
    marginBottom: '0.5rem',
  },
  inputError: {
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: '#ff3333',
    backgroundColor: '#fff8f8',
  },
  fieldError: {
    color: '#ff3333',
    fontSize: '0.8rem',
    marginTop: '0.25rem',
    marginLeft: '0.25rem',
  }
};

export default Signup;
