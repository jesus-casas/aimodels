const axios = require('axios');

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

async function callO4Mini(messages, options = {}) {
  try {
    const response = await axios.post(
      OPENAI_API_URL,
      {
        model: 'o4-mini',
        messages,
        ...options,
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error calling OpenAI o4-mini:', error.response?.data || error.message);
    throw error;
  }
}

module.exports = { callO4Mini }; 