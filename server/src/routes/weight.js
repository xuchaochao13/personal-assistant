const express = require('express');
const router = express.Router();
const { getDb, query, run } = require('../db');
const { authRequired } = require('../middleware/auth');

router.use(authRequired);

router.get('/', async (req, res) => {
  await getDb();
  const { from, to } = req.query;
  let sql = 'SELECT * FROM weight_records WHERE user_id = ?';
  const params = [req.user.openid];
  if (from) { sql += ' AND recorded_at >= ?'; params.push(from); }
  if (to) { sql += ' AND recorded_at <= ?'; params.push(to); }
  sql += ' ORDER BY recorded_at DESC';
  res.json(query(sql, params));
});

router.get('/stats', async (req, res) => {
  await getDb();
  const stats = query(
    `SELECT MIN(weight) as min_weight, MAX(weight) as max_weight,
     ROUND(AVG(weight), 1) as avg_weight, COUNT(*) as total
     FROM weight_records WHERE user_id = ?`,
    [req.user.openid]
  )[0];
  const trend = query(
    'SELECT recorded_at, weight FROM weight_records WHERE user_id = ? ORDER BY recorded_at ASC LIMIT 90',
    [req.user.openid]
  );
  res.json({ ...stats, trend });
});

router.post('/', async (req, res) => {
  await getDb();
  const { weight, recorded_at, note = '' } = req.body;
  if (!weight || !recorded_at) return res.status(400).json({ error: '体重和日期必填' });
  const result = run('INSERT INTO weight_records (user_id, weight, recorded_at, note) VALUES (?, ?, ?, ?)',
    [req.user.openid, weight, recorded_at, note]);
  res.status(201).json(query('SELECT * FROM weight_records WHERE id = ?', [result.lastInsertRowid])[0]);
});

router.delete('/:id', async (req, res) => {
  await getDb();
  const r = run('DELETE FROM weight_records WHERE id = ? AND user_id = ?', [req.params.id, req.user.openid]);
  if (r.changes === 0) return res.status(404).json({ error: '未找到' });
  res.json({ success: true });
});

module.exports = router;
