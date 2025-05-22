const validateSignup = (req, res, next) => {
  const { 
    username,
    email, 
    password,
    confirmPassword,
    firstName, 
    lastName,
    birthday
  } = req.body;

  // Check if all required fields are present
  if (!username || !email || !password || !confirmPassword || !firstName || !lastName || !birthday) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  // Validate username (alphanumeric, 3-20 characters)
  if (!/^[a-zA-Z0-9]{3,20}$/.test(username)) {
    return res.status(400).json({ error: 'Username must be 3-20 alphanumeric characters' });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  // Validate password (at least 12 characters)
  if (password.length < 12) {
    return res.status(400).json({ error: 'Password must be at least 12 characters long' });
  }

  // Validate password match
  if (password !== confirmPassword) {
    return res.status(400).json({ error: 'Passwords do not match' });
  }

  // Validate names (no numbers or special characters)
  const nameRegex = /^[a-zA-Z\s-]{2,30}$/;
  if (!nameRegex.test(firstName) || !nameRegex.test(lastName)) {
    return res.status(400).json({ error: 'Names can only contain letters, spaces, and hyphens (2-30 characters)' });
  }

  // Validate birthday format (YYYY-MM-DD)
  const birthdayRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!birthdayRegex.test(birthday)) {
    return res.status(400).json({ error: 'Invalid birthday format (YYYY-MM-DD)' });
  }

  // Validate birthday is in the past
  const birthdayDate = new Date(birthday);
  if (birthdayDate > new Date()) {
    return res.status(400).json({ error: 'Birthday must be in the past' });
  }

  next();
};

const validateSecurityQuestions = (req, res, next) => {
  const { 
    userId,
    question1,
    answer1,
    question2,
    answer2,
    question3,
    answer3
  } = req.body;

  // Check if all required fields are present
  if (!userId || !question1 || !answer1 || !question2 || !answer2 || !question3 || !answer3) {
    return res.status(400).json({ error: 'All security questions and answers are required' });
  }

  // Validate question IDs
  const validQuestionIds = ['pet', 'city', 'friend', 'car', 'concert'];
  const questions = [question1, question2, question3];
  
  // Check if all questions are valid
  if (!questions.every(q => validQuestionIds.includes(q))) {
    return res.status(400).json({ error: 'Invalid security question ID' });
  }

  // Check for duplicate questions
  if (new Set(questions).size !== questions.length) {
    return res.status(400).json({ error: 'Duplicate security questions are not allowed' });
  }

  // Validate answers (not empty and reasonable length)
  const answers = [answer1, answer2, answer3];
  if (!answers.every(a => a && a.length >= 2 && a.length <= 50)) {
    return res.status(400).json({ error: 'Answers must be between 2 and 50 characters' });
  }

  next();
};

module.exports = { validateSignup, validateSecurityQuestions };