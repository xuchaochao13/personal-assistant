const express = require('express');
const router = express.Router();
const { getDb, query, run } = require('../db');
const { authRequired } = require('../middleware/auth');

router.use(authRequired);

router.get('/', async (req, res) => {
  await getDb();
  const { type, from, to } = req.query;
  let sql = 'SELECT * FROM fitness_records WHERE user_id = ?';
  const params = [req.user.openid];
  if (type) { sql += ' AND type = ?'; params.push(type); }
  if (from) { sql += ' AND date(created_at) >= ?'; params.push(from); }
  if (to) { sql += ' AND date(created_at) <= ?'; params.push(to); }
  sql += ' ORDER BY created_at DESC';
  res.json(query(sql, params));
});

router.get('/stats', async (req, res) => {
  await getDb();
  const total = query(
    'SELECT COUNT(*) as sessions, SUM(duration) as total_minutes FROM fitness_records WHERE user_id = ?',
    [req.user.openid]
  )[0];
  const byType = query(
    'SELECT type, COUNT(*) as count, SUM(duration) as total_minutes FROM fitness_records WHERE user_id = ? GROUP BY type',
    [req.user.openid]
  );
  res.json({ ...total, by_type: byType });
});

router.post('/', async (req, res) => {
  await getDb();
  const { type, duration, intensity = 2, detail = {}, note = '' } = req.body;
  if (!type || !duration) return res.status(400).json({ error: '类型和时长必填' });
  const result = run(
    'INSERT INTO fitness_records (user_id, type, duration, intensity, detail, note) VALUES (?, ?, ?, ?, ?, ?)',
    [req.user.openid, type, duration, intensity, JSON.stringify(detail), note]
  );
  res.status(201).json(query('SELECT * FROM fitness_records WHERE id = ?', [result.lastInsertRowid])[0]);
});

router.delete('/:id', async (req, res) => {
  await getDb();
  const r = run('DELETE FROM fitness_records WHERE id = ? AND user_id = ?', [req.params.id, req.user.openid]);
  if (r.changes === 0) return res.status(404).json({ error: '未找到' });
  res.json({ success: true });
});

module.exports = router;
