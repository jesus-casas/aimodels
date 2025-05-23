const express = require('express');
const router = express.Router();

const { callGpt4o, callGpt4oStream } = require('../models/gpt-4o');
const { callO3 } = require('../models/o3');
const { callO4Mini } = require('../models/o4-mini');
const { callO4MiniHigh } = require('../models/o4-mini-high');

const modelMap = {
  'gpt-4o': callGpt4o,
  'o3': callO3,
  'o4-mini': callO4Mini,
  'o4-mini-high': callO4MiniHigh,
};

// Non-streaming chat completion endpoint
router.post('/', async (req, res) => {
  const { model, messages, ...options } = req.body;
  if (!model || !messages) {
    return res.status(400).json({ error: 'Model and messages are required.' });
  }
  const modelFn = modelMap[model];
  if (!modelFn) {
    return res.status(400).json({ error: 'Unsupported model.' });
  }
  try {
    const result = await modelFn(messages, options);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message || 'AI model error.' });
  }
});

// Streaming endpoint for gpt-4o
router.post('/stream', async (req, res) => {
  const { model, messages } = req.body;
  if (model !== 'gpt-4o') {
    return res.status(400).json({ error: 'Streaming only supported for gpt-4o.' });
  }
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();
  try {
    const stream = await callGpt4oStream(messages);
    for await (const chunk of stream) {
      res.write(`data: ${JSON.stringify(chunk)}\n\n`);
    }
    res.end();
  } catch (err) {
    res.write(`event: error\ndata: ${JSON.stringify({ error: err.message })}\n\n`);
    res.end();
  }
});

module.exports = router; 