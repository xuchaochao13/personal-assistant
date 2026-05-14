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

module.exports = router;
