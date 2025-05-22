export const passwordRequirements = {
  length: (password) => password.length >= 12,
  uppercase: (password) => /[A-Z]/.test(password),
  lowercase: (password) => /[a-z]/.test(password),
  number: (password) => /[0-9]/.test(password),
  special: (password) => /[!@#$%^&*(),.?":{}|<>]/.test(password),
  match: (password, confirmPassword) => {
    if (!password || !confirmPassword) return false;
    return password === confirmPassword;
  },
};

export const validateField = (name, value, formData = {}) => {
  let error = '';
  switch (name) {
    case 'firstName':
    case 'lastName':
    case 'username':
    case 'email':
    case 'password':
    case 'confirmPassword':
    case 'birthday':
      if (!value.trim()) error = 'Required';
      break;
    case 'confirmPassword':
      if (!value.trim()) error = 'Required';
      else if (!passwordRequirements.match(formData.password, value)) error = 'Passwords do not match';
      break;
    default:
      break;
  }
  return error;
}; 