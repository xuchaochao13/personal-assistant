const express = require('express');
const router = express.Router();
const { getDb, query, run } = require('../db');
const { authRequired } = require('../middleware/auth');
const { streamChat } = require('../services/ai');

router.use(authRequired);

router.post('/', async (req, res) => {
  const { session_id: sid, message } = req.body;
  if (!message) return res.status(400).json({ error: '消息不能为空' });

  await getDb();
  const sessionId = sid || `sess_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  run('INSERT INTO chat_history (user_id, session_id, role, content) VALUES (?, ?, ?, ?)',
    [req.user.openid, sessionId, 'user', message]);

  const history = query(
    'SELECT role, content FROM chat_history WHERE user_id = ? AND session_id = ? ORDER BY created_at ASC LIMIT 40',
    [req.user.openid, sessionId]
  );

  const messages = [
    {
      role: 'system',
      content: `你是用户的私人AI助理。你可以帮助用户管理待办事项、日程、备忘录、体重、健身和反思记录。请用中文回复，简洁实用。`,
    },
    ...history.map(h => ({ role: h.role, content: h.content })),
  ];

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });

  let fullResponse = '';

  try {
    for await (const chunk of streamChat(messages)) {
      fullResponse += chunk;
      res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
    }
    run('INSERT INTO chat_history (user_id, session_id, role, content) VALUES (?, ?, ?, ?)',
      [req.user.openid, sessionId, 'assistant', fullResponse]);
    res.write(`data: ${JSON.stringify({ session_id: sessionId, done: true })}\n\n`);
  } catch (err) {
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
  }
  res.end();
});

router.get('/sessions', async (req, res) => {
  await getDb();
  const sessions = query(
    `SELECT session_id, MIN(created_at) as created_at,
     (SELECT content FROM chat_history c2 WHERE c2.session_id = c1.session_id ORDER BY created_at DESC LIMIT 1) as last_message
     FROM chat_history c1 WHERE user_id = ? GROUP BY session_id ORDER BY created_at DESC`,
    [req.user.openid]
  );
  res.json(sessions);
});

router.get('/sessions/:id', async (req, res) => {
  await getDb();
  const messages = query(
    'SELECT * FROM chat_history WHERE user_id = ? AND session_id = ? ORDER BY created_at ASC',
    [req.user.openid, req.params.id]
  );
  res.json(messages);
});

router.delete('/sessions/:id', async (req, res) => {
  await getDb();
  run('DELETE FROM chat_history WHERE user_id = ? AND session_id = ?', [req.user.openid, req.params.id]);
  res.json({ success: true });
});

module.exports = router;
