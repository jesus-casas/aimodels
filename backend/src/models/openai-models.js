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
    const { max_tokens, max_output_tokens, max_completion_tokens, ...restOptions } = options;
    const limit = max_completion_tokens ?? max_tokens ?? max_output_tokens;
    const apiOptions = limit != null ? { ...restOptions, max_completion_tokens: limit } : restOptions;
    const response = await axios.post(
      OPENAI_API_URL,
      {
        model,
        messages,
        ...apiOptions,
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

// Streaming: returns async iterable of chunks (chunk.choices?.[0]?.delta?.content).
// Newer models (e.g. gpt-4.1-mini, gpt-5.x) require max_completion_tokens; pass a default so streaming works for all.
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
const DEFAULT_STREAM_MAX_TOKENS = 4096;

async function callOpenAIChatStream(model, messages, options = {}) {
  if (!SUPPORTED_MODELS.includes(model)) {
    throw new Error(`Model ${model} is not supported.`);
  }
  const { max_tokens, max_output_tokens, max_completion_tokens, ...restOptions } = options;
  const limit = max_completion_tokens ?? max_tokens ?? max_output_tokens ?? DEFAULT_STREAM_MAX_TOKENS;
  return openai.chat.completions.create({
    model,
    messages,
    stream: true,
    max_completion_tokens: limit,
    ...restOptions,
  });
}

module.exports = { callOpenAIChat, callOpenAIChatStream, SUPPORTED_MODELS }; 