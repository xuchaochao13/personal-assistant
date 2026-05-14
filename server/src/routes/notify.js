const express = require('express');
const router = express.Router();
const { getDb, query, run } = require('../db');
const { authRequired } = require('../middleware/auth');

router.use(authRequired);

// Save subscription
router.post('/subscribe', async (req, res) => {
  await getDb();
  const { template_id } = req.body;
  if (!template_id) return res.status(400).json({ error: '缺少 template_id' });

  const existing = query(
    'SELECT id FROM message_subscriptions WHERE user_id = ? AND template_id = ?',
    [req.user.openid, template_id]
  );
  if (existing.length === 0) {
    run('INSERT INTO message_subscriptions (user_id, template_id) VALUES (?, ?)',
      [req.user.openid, template_id]);
  }
  res.json({ success: true });
});

// Get subscription status
router.get('/subscribe', async (req, res) => {
  await getDb();
  const subs = query(
    'SELECT template_id FROM message_subscriptions WHERE user_id = ?',
    [req.user.openid]
  );
  res.json(subs.map(s => s.template_id));
});

// Test: manually trigger notification check (for debugging)
router.post('/test-send', async (req, res) => {
  try {
    await getDb();
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);

    const { sendScheduleReminder, sendTodoReminder } = require('../services/notify');

    const results = [];

    // Schedule check
    const schedules = query(
      `SELECT s.* FROM schedules s
       INNER JOIN message_subscriptions sub ON s.user_id = sub.user_id
       AND sub.template_id = 'FsdXYQZpHgn-5BnaSq51gVvsikFniEnQE_lBpntTNe0'
       WHERE s.user_id = ? AND s.start_time LIKE ?
       ORDER BY s.start_time ASC LIMIT 5`,
      [req.user.openid, todayStr + '%']
    );

    for (const s of schedules) {
      const msg = await sendScheduleReminder(req.user.openid, s).then(() => 'ok').catch(e => e.message);
      results.push({ type: 'schedule', id: s.id, title: s.title, result: msg });
    }

    // Todo check
    const todos = query(
      `SELECT t.* FROM todos t
       INNER JOIN message_subscriptions sub ON t.user_id = sub.user_id
       AND sub.template_id = '2x2roFHsREZMOhl5MwzY2b2YklrkX7_09PyV4VN7OZ8'
       WHERE t.user_id = ? AND t.completed = 0
       ORDER BY t.created_at DESC LIMIT 5`,
      [req.user.openid]
    );

    for (const t of todos) {
      const msg = await sendTodoReminder(req.user.openid, t).then(() => 'ok').catch(e => e.message);
      results.push({ type: 'todo', id: t.id, title: t.title, result: msg });
    }

    res.json({ tested: results.length, results });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
