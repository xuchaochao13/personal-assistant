const express = require('express');
const router = express.Router();
const { getDb, query, run } = require('../db');
const { authRequired } = require('../middleware/auth');

router.use(authRequired);

router.get('/', async (req, res) => {
  await getDb();
  const { date, from, to } = req.query;
  let sql = 'SELECT * FROM schedules WHERE user_id = ?';
  const params = [req.user.openid];
  if (date) { sql += ' AND start_time LIKE ?'; params.push(date + '%'); }
  if (from && to) { sql += ' AND start_time >= ? AND end_time <= ?'; params.push(from, to); }
  sql += ' ORDER BY start_time ASC';
  res.json(query(sql, params));
});

router.post('/', async (req, res) => {
  await getDb();
  const { title, description, start_time, end_time, repeat = 'none', remind_before = 15 } = req.body;
  if (!title || !start_time || !end_time) return res.status(400).json({ error: '标题和时间必填' });
  const result = run(
    'INSERT INTO schedules (user_id, title, description, start_time, end_time, repeat, remind_before) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [req.user.openid, title, description || '', start_time, end_time, repeat, remind_before]
  );
  res.status(201).json(query('SELECT * FROM schedules WHERE id = ?', [result.lastInsertRowid])[0]);
});

router.put('/:id', async (req, res) => {
  await getDb();
  const s = query('SELECT * FROM schedules WHERE id = ? AND user_id = ?', [req.params.id, req.user.openid])[0];
  if (!s) return res.status(404).json({ error: '未找到' });
  const { title, description, start_time, end_time, repeat, remind_before } = req.body;
  run(
    `UPDATE schedules SET title = COALESCE(?, title), description = COALESCE(?, description),
     start_time = COALESCE(?, start_time), end_time = COALESCE(?, end_time),
     repeat = COALESCE(?, repeat), remind_before = COALESCE(?, remind_before),
     updated_at = datetime('now') WHERE id = ?`,
    [title ?? null, description ?? null, start_time ?? null, end_time ?? null, repeat ?? null, remind_before ?? null, req.params.id]
  );
  res.json(query('SELECT * FROM schedules WHERE id = ?', [req.params.id])[0]);
});

router.delete('/:id', async (req, res) => {
  await getDb();
  const r = run('DELETE FROM schedules WHERE id = ? AND user_id = ?', [req.params.id, req.user.openid]);
  if (r.changes === 0) return res.status(404).json({ error: '未找到' });
  res.json({ success: true });
});

module.exports = router;
