const express = require('express');
const router = express.Router();
const { query } = require('../config/db');
const { callOpenAIChat, SUPPORTED_MODELS } = require('../models/openai-models');

// Create a new user chat
router.post('/chats', async (req, res) => {
  const { user_id, title } = req.body;
  if (!user_id || !title) {
    return res.status(400).json({ error: 'user_id and title are required' });
  }
  try {
    const result = await query(
      'INSERT INTO user_chats (user_id, title) VALUES ($1, $2) RETURNING *',
      [user_id, title]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all chats for a user
router.get('/chats/:user_id', async (req, res) => {
  const { user_id } = req.params;
  try {
    const result = await query(
      'SELECT * FROM user_chats WHERE user_id = $1 ORDER BY created_at DESC',
      [user_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add a message to a user chat
router.post('/messages', async (req, res) => {
  const { chat_id, role, content } = req.body;
  if (!chat_id || !role || !content) {
    return res.status(400).json({ error: 'chat_id, role, and content are required' });
  }
  try {
    const result = await query(
      'INSERT INTO user_chat_messages (chat_id, role, content) VALUES ($1, $2, $3) RETURNING *',
      [chat_id, role, content]
    );
    // Update updated_at on the parent chat
    await query(
      'UPDATE user_chats SET updated_at = NOW() WHERE id = $1',
      [chat_id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all messages for a user chat
router.get('/messages/:chat_id', async (req, res) => {
  const { chat_id } = req.params;
  try {
    const result = await query(
      'SELECT * FROM user_chat_messages WHERE chat_id = $1 ORDER BY timestamp ASC',
      [chat_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Multi-turn chat completion for permanent users
// POST /complete: Save user message, call OpenAI with full history, save assistant response
router.post('/complete', async (req, res) => {
  const { chat_id, role, content, model } = req.body;
  if (!chat_id || !role || !content || !model) {
    return res.status(400).json({ error: 'chat_id, role, content, and model are required' });
  }
  if (!SUPPORTED_MODELS.includes(model)) {
    return res.status(400).json({ error: 'Unsupported model.' });
  }
  try {
    // 1. Save user message
    await query(
      'INSERT INTO user_chat_messages (chat_id, role, content) VALUES ($1, $2, $3)',
      [chat_id, role, content]
    );
    await query(
      'UPDATE user_chats SET updated_at = NOW() WHERE id = $1',
      [chat_id]
    );

    // 2. Load full message history
    const { rows: messages } = await query(
      'SELECT role, content FROM user_chat_messages WHERE chat_id = $1 ORDER BY timestamp ASC',
      [chat_id]
    );

    // 3. Call OpenAI API with full history
    const openaiResult = await callOpenAIChat(model, messages);
    const aiContent = openaiResult.choices[0].message.content;

    // 4. Save assistant response
    await query(
      'INSERT INTO user_chat_messages (chat_id, role, content) VALUES ($1, $2, $3)',
      [chat_id, 'assistant', aiContent]
    );
    await query(
      'UPDATE user_chats SET updated_at = NOW() WHERE id = $1',
      [chat_id]
    );

    // 5. Return assistant response
    res.json({ role: 'assistant', content: aiContent });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router; 