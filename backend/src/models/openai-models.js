const { OpenAI } = require("openai");
const axios = require('axios');

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

// Supported models
const SUPPORTED_MODELS = [
  'gpt-5.2',
  'gpt-5-mini',
  'gpt-5-nano',
  'gpt-5.2-pro',
  'gpt-4.1-mini'
];

/**
 * Call any OpenAI chat model with the given messages and options.
 * @param {string} model - The OpenAI model name (must be in SUPPORTED_MODELS)
 * @param {Array} messages - The conversation history
 * @param {Object} options - Additional OpenAI API options
 */
async function callOpenAIChat(model, messages, options = {}) {
  if (!SUPPORTED_MODELS.includes(model)) {
    throw new Error(`Model ${model} is not supported.`);
  }
  try {
    const response = await axios.post(
      OPENAI_API_URL,
      {
        model,
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
    console.error(`Error calling OpenAI model ${model}:`, error.response?.data || error.message);
    throw error;
  }
}

// Streaming support (optional, for future use)
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
async function callOpenAIChatStream(model, messages) {
  if (!SUPPORTED_MODELS.includes(model)) {
    throw new Error(`Model ${model} is not supported.`);
  }
  return openai.chat.completions.create({
    model,
    messages,
    stream: true,
  });
}

module.exports = { callOpenAIChat, callOpenAIChatStream, SUPPORTED_MODELS }; 