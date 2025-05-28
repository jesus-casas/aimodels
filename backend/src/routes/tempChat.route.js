const express = require('express');
const router = express.Router();
const { query } = require('../config/db');

// Create a new temp chat
router.post('/chats', async (req, res) => {
  const { session_id, title } = req.body;
  if (!session_id || !title) {
    return res.status(400).json({ error: 'session_id and title are required' });
  }
  try {
    const result = await query(
      'INSERT INTO temp_chats (session_id, title) VALUES ($1, $2) RETURNING *',
      [session_id, title]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all chats for a session
router.get('/chats/:session_id', async (req, res) => {
  const { session_id } = req.params;
  try {
    const result = await query(
      'SELECT * FROM temp_chats WHERE session_id = $1 ORDER BY created_at DESC',
      [session_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add a message to a temp chat
router.post('/messages', async (req, res) => {
  const { chat_id, role, content } = req.body;
  if (!chat_id || !role || !content) {
    return res.status(400).json({ error: 'chat_id, role, and content are required' });
  }
  try {
    const result = await query(
      'INSERT INTO temp_chat_messages (chat_id, role, content) VALUES ($1, $2, $3) RETURNING *',
      [chat_id, role, content]
    );
    // Update last_activity on the parent chat
    await query(
      'UPDATE temp_chats SET last_activity = NOW() WHERE id = $1',
      [chat_id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all messages for a temp chat
router.get('/messages/:chat_id', async (req, res) => {
  const { chat_id } = req.params;
  try {
    const result = await query(
      'SELECT * FROM temp_chat_messages WHERE chat_id = $1 ORDER BY timestamp ASC',
      [chat_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router; 