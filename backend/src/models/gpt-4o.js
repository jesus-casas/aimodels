const { OpenAI } = require("openai");
const axios = require('axios');

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

async function callGpt4o(messages, options = {}) {
  try {
    const response = await axios.post(
      OPENAI_API_URL,
      {
        model: 'gpt-4o',
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
    console.error('Error calling OpenAI GPT-4o:', error.response?.data || error.message);
    throw error;
  }
}

// Streaming support
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
async function callGpt4oStream(messages) {
  return openai.chat.completions.create({
    model: 'gpt-4o',
    messages,
    stream: true,
  });
}

module.exports = { callGpt4o, callGpt4oStream }; 