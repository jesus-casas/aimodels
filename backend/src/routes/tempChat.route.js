const express = require('express');
const router = express.Router();
const { query } = require('../config/db');
const { callOpenAIChat, callOpenAIChatStream, SUPPORTED_MODELS } = require('../models/openai-models');

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

// CREATE A TITLE FOR THE CHAT ------------------------------------------------------------
async function generateChatTitle(message) {
  const titlePrompt = [
    {
      role: "system",
      content: "Generate a concise, descriptive title (max 5 words) for a chat based on the user's first message. The title should capture the main topic or question."
    },
    {
      role: "user",
      content: message
    }
  ];

  try {
    const result = await callOpenAIChat('gpt-4o-mini', titlePrompt, { max_tokens: 20 });
    return result.choices[0].message.content.trim();
  } catch (err) {
    console.error('Error generating chat title:', err);
    return 'New Chat'; // Fallback title
  }
}
// -----------------------------------------------------------------------------------------

// Multi-turn chat completion for anonymous users
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
    // 1. Check if this is the first message and generate title if needed
    const { rows: messageCount } = await query(
      'SELECT COUNT(*) as count FROM temp_chat_messages WHERE chat_id = $1',
      [chat_id]
    );
    
    console.log('Message count:', messageCount[0].count);
    
    if (parseInt(messageCount[0].count) === 0) {
      console.log('Generating new title for first message');
      // This is the first message, generate and update title
      const newTitle = await generateChatTitle(content);
      console.log('Generated title:', newTitle);
      await query(
        'UPDATE temp_chats SET title = $1 WHERE id = $2',
        [newTitle, chat_id]
      );
    }

    // 2. Save user message
    await query(
      'INSERT INTO temp_chat_messages (chat_id, role, content) VALUES ($1, $2, $3)',
      [chat_id, role, content]
    );
    await query(
      'UPDATE temp_chats SET last_activity = NOW() WHERE id = $1',
      [chat_id]
    );

    // 3. Load full message history
    const { rows: messages } = await query(
      'SELECT role, content FROM temp_chat_messages WHERE chat_id = $1 ORDER BY timestamp ASC',
      [chat_id]
    );

    // 4. Call OpenAI API with full history
    const openaiResult = await callOpenAIChat(model, messages);
    const aiContent = openaiResult.choices[0].message.content;

    // 5. Save assistant response
    await query(
      'INSERT INTO temp_chat_messages (chat_id, role, content) VALUES ($1, $2, $3)',
      [chat_id, 'assistant', aiContent]
    );
    await query(
      'UPDATE temp_chats SET last_activity = NOW() WHERE id = $1',
      [chat_id]
    );

    // 6. Return assistant response
    res.json({ role: 'assistant', content: aiContent });
  } catch (err) {
    console.error('Error in /complete:', err);
    res.status(500).json({ error: err.message });
  }
});

// Streaming multi-turn chat completion for anonymous users (SSE)
router.post('/complete/stream', async (req, res) => {
  const { chat_id, role, content, model } = req.body;
  if (!chat_id || !role || !content || !model) {
    return res.status(400).json({ error: 'chat_id, role, content, and model are required' });
  }
  if (!SUPPORTED_MODELS.includes(model)) {
    return res.status(400).json({ error: 'Unsupported model.' });
  }
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  try {
    // 1. Check if this is the first message and generate title if needed
    const { rows: messageCount } = await query(
      'SELECT COUNT(*) as count FROM temp_chat_messages WHERE chat_id = $1',
      [chat_id]
    );
    if (parseInt(messageCount[0].count) === 0) {
      const newTitle = await generateChatTitle(content);
      await query(
        'UPDATE temp_chats SET title = $1 WHERE id = $2',
        [newTitle, chat_id]
      );
    }
    // 2. Save user message
    await query(
      'INSERT INTO temp_chat_messages (chat_id, role, content) VALUES ($1, $2, $3)',
      [chat_id, role, content]
    );
    await query(
      'UPDATE temp_chats SET last_activity = NOW() WHERE id = $1',
      [chat_id]
    );
    // 3. Load full message history
    const { rows: messages } = await query(
      'SELECT role, content FROM temp_chat_messages WHERE chat_id = $1 ORDER BY timestamp ASC',
      [chat_id]
    );
    // 4. Stream OpenAI API response
    const stream = await callOpenAIChatStream(model, messages);
    let aiContent = '';
    for await (const chunk of stream) {
      const delta = chunk.choices?.[0]?.delta?.content || '';
      if (delta) {
        aiContent += delta;
        res.write(`data: ${JSON.stringify({ delta })}\n\n`);
      }
    }
    // 5. Save assistant response
    await query(
      'INSERT INTO temp_chat_messages (chat_id, role, content) VALUES ($1, $2, $3)',
      [chat_id, 'assistant', aiContent]
    );
    await query(
      'UPDATE temp_chats SET last_activity = NOW() WHERE id = $1',
      [chat_id]
    );
    // 6. Signal completion
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err) {
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
    res.end();
  }
});

// Delete a chat and its messages
router.delete('/chats/:chat_id', async (req, res) => {
  const { chat_id } = req.params;
  try {
    // Delete messages first (due to foreign key constraint)
    await query('DELETE FROM temp_chat_messages WHERE chat_id = $1', [chat_id]);
    // Then delete the chat
    await query('DELETE FROM temp_chats WHERE id = $1', [chat_id]);
    res.json({ message: 'Chat deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete all chats and messages for a session
router.delete('/chats/session/:session_id', async (req, res) => {
  const { session_id } = req.params;
  try {
    // Get all chat IDs for this session
    const { rows: chats } = await query('SELECT id FROM temp_chats WHERE session_id = $1', [session_id]);
    const chatIds = chats.map(c => c.id);
    // Delete all messages for these chats
    if (chatIds.length > 0) {
      await query('DELETE FROM temp_chat_messages WHERE chat_id = ANY($1)', [chatIds]);
      await query('DELETE FROM temp_chats WHERE session_id = $1', [session_id]);
    }
    res.json({ message: 'All chats for session deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Compare mode: Non-streaming completion for two models simultaneously
router.post('/complete/compare', async (req, res) => {
  const { chat_id, role, content, model1, model2 } = req.body;
  if (!chat_id || !role || !content || !model1 || !model2) {
    return res.status(400).json({ error: 'chat_id, role, content, model1, and model2 are required' });
  }
  if (!SUPPORTED_MODELS.includes(model1) || !SUPPORTED_MODELS.includes(model2)) {
    return res.status(400).json({ error: 'Unsupported model(s).' });
  }
  try {
    // 1. Check if this is the first message and generate title if needed
    const { rows: messageCount } = await query(
      'SELECT COUNT(*) as count FROM temp_chat_messages WHERE chat_id = $1',
      [chat_id]
    );
    
    if (parseInt(messageCount[0].count) === 0) {
      const newTitle = await generateChatTitle(content);
      await query(
        'UPDATE temp_chats SET title = $1 WHERE id = $2',
        [newTitle, chat_id]
      );
    }

    // 2. Save user message
    await query(
      'INSERT INTO temp_chat_messages (chat_id, role, content) VALUES ($1, $2, $3)',
      [chat_id, role, content]
    );
    await query(
      'UPDATE temp_chats SET last_activity = NOW() WHERE id = $1',
      [chat_id]
    );

    // 3. Load full message history
    const { rows: messages } = await query(
      'SELECT role, content FROM temp_chat_messages WHERE chat_id = $1 ORDER BY timestamp ASC',
      [chat_id]
    );

    // 4. Call both OpenAI APIs simultaneously
    const [result1, result2] = await Promise.all([
      callOpenAIChat(model1, messages),
      callOpenAIChat(model2, messages)
    ]);

    const aiContent1 = result1.choices[0].message.content;
    const aiContent2 = result2.choices[0].message.content;

    // 5. Save both assistant responses (we'll save them with a marker or in separate fields)
    // For now we will save model1's response as the main assistant message
    // and model2's response separately. 
    // TODO: Store both in the database with model identifiers.
    await query(
      'INSERT INTO temp_chat_messages (chat_id, role, content) VALUES ($1, $2, $3)',
      [chat_id, 'assistant', aiContent1]
    );
    // Note: We're saving model1's response as the main one. Model2's response
    // will be sent to the client but not saved 
    await query(
      'UPDATE temp_chats SET last_activity = NOW() WHERE id = $1',
      [chat_id]
    );

    // 6. Return both responses
    res.json({ 
      model1: { role: 'assistant', content: aiContent1 },
      model2: { role: 'assistant', content: aiContent2 }
    });
  } catch (err) {
    console.error('Error in /complete/compare:', err);
    res.status(500).json({ error: err.message });
  }
});

// Compare mode: Streaming completion for two models simultaneously
router.post('/complete/compare/stream', async (req, res) => {
  const { chat_id, role, content, model1, model2 } = req.body;
  if (!chat_id || !role || !content || !model1 || !model2) {
    return res.status(400).json({ error: 'chat_id, role, content, model1, and model2 are required' });
  }
  if (!SUPPORTED_MODELS.includes(model1) || !SUPPORTED_MODELS.includes(model2)) {
    return res.status(400).json({ error: 'Unsupported model(s).' });
  }
  
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  try {
    // 1. Check if this is the first message and generate title if needed
    const { rows: messageCount } = await query(
      'SELECT COUNT(*) as count FROM temp_chat_messages WHERE chat_id = $1',
      [chat_id]
    );
    if (parseInt(messageCount[0].count) === 0) {
      const newTitle = await generateChatTitle(content);
      await query(
        'UPDATE temp_chats SET title = $1 WHERE id = $2',
        [newTitle, chat_id]
      );
    }
    
    // 2. Save user message
    await query(
      'INSERT INTO temp_chat_messages (chat_id, role, content) VALUES ($1, $2, $3)',
      [chat_id, role, content]
    );
    await query(
      'UPDATE temp_chats SET last_activity = NOW() WHERE id = $1',
      [chat_id]
    );
    
    // 3. Load full message history
    const { rows: messages } = await query(
      'SELECT role, content FROM temp_chat_messages WHERE chat_id = $1 ORDER BY timestamp ASC',
      [chat_id]
    );
    
    // 4. Start both streams simultaneously
    const stream1 = await callOpenAIChatStream(model1, messages);
    const stream2 = await callOpenAIChatStream(model2, messages);
    
    let aiContent1 = '';
    let aiContent2 = '';
    let stream1Done = false;
    let stream2Done = false;
    
    // Process both streams concurrently
    const processStream1 = async () => {
      try {
        for await (const chunk of stream1) {
          const delta = chunk.choices?.[0]?.delta?.content || '';
          if (delta) {
            aiContent1 += delta;
            res.write(`data: ${JSON.stringify({ model: 'model1', delta })}\n\n`);
          }
        }
        stream1Done = true;
        res.write(`data: ${JSON.stringify({ model: 'model1', done: true })}\n\n`);
      } catch (err) {
        stream1Done = true;
        res.write(`data: ${JSON.stringify({ model: 'model1', error: err.message })}\n\n`);
      }
    };
    
    const processStream2 = async () => {
      try {
        for await (const chunk of stream2) {
          const delta = chunk.choices?.[0]?.delta?.content || '';
          if (delta) {
            aiContent2 += delta;
            res.write(`data: ${JSON.stringify({ model: 'model2', delta })}\n\n`);
          }
        }
        stream2Done = true;
        res.write(`data: ${JSON.stringify({ model: 'model2', done: true })}\n\n`);
      } catch (err) {
        stream2Done = true;
        res.write(`data: ${JSON.stringify({ model: 'model2', error: err.message })}\n\n`);
      }
    };
    
    // Process both streams in parallel
    await Promise.all([processStream1(), processStream2()]);
    
    // 5. Save assistant responses (saving model1's as the main one)
    if (aiContent1) {
      await query(
        'INSERT INTO temp_chat_messages (chat_id, role, content) VALUES ($1, $2, $3)',
        [chat_id, 'assistant', aiContent1]
      );
    }
    await query(
      'UPDATE temp_chats SET last_activity = NOW() WHERE id = $1',
      [chat_id]
    );
    
    // 6. Signal completion
    res.write(`data: ${JSON.stringify({ allDone: true })}\n\n`);
    res.end();
  } catch (err) {
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
    res.end();
  }
});

module.exports = router; 