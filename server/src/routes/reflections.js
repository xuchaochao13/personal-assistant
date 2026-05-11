const express = require('express');
const router = express.Router();
const { getDb, query, run } = require('../db');
const { authRequired } = require('../middleware/auth');

router.use(authRequired);

router.get('/', async (req, res) => {
  await getDb();
  const { tag, from, to } = req.query;
  let sql = 'SELECT * FROM reflections WHERE user_id = ?';
  const params = [req.user.openid];
  if (from) { sql += ' AND date(created_at) >= ?'; params.push(from); }
  if (to) { sql += ' AND date(created_at) <= ?'; params.push(to); }
  sql += ' ORDER BY created_at DESC';
  let rows = query(sql, params);

  if (tag) {
    rows = rows.filter(r => JSON.parse(r.tags).includes(tag));
  }
  res.json(rows.map(r => ({ ...r, tags: JSON.parse(r.tags) })));
});

router.get('/:id', async (req, res) => {
  await getDb();
  const r = query('SELECT * FROM reflections WHERE id = ? AND user_id = ?', [req.params.id, req.user.openid])[0];
  if (!r) return res.status(404).json({ error: '未找到' });
  res.json({ ...r, tags: JSON.parse(r.tags) });
});

router.post('/', async (req, res) => {
  await getDb();
  const { title, content = '', mood = 3, tags = [] } = req.body;
  if (!title) return res.status(400).json({ error: '标题不能为空' });
  const result = run(
    'INSERT INTO reflections (user_id, title, content, mood, tags) VALUES (?, ?, ?, ?, ?)',
    [req.user.openid, title, content, mood, JSON.stringify(tags)]
  );
  const reflection = query('SELECT * FROM reflections WHERE id = ?', [result.lastInsertRowid])[0];
  res.status(201).json({ ...reflection, tags: JSON.parse(reflection.tags) });
});

router.put('/:id', async (req, res) => {
  await getDb();
  const r = query('SELECT * FROM reflections WHERE id = ? AND user_id = ?', [req.params.id, req.user.openid])[0];
  if (!r) return res.status(404).json({ error: '未找到' });
  const { title, content, mood, tags } = req.body;
  run(
    `UPDATE reflections SET title = COALESCE(?, title), content = COALESCE(?, content),
     mood = COALESCE(?, mood), tags = COALESCE(?, tags),
     updated_at = datetime('now') WHERE id = ?`,
    [title ?? null, content ?? null, mood ?? null, tags ? JSON.stringify(tags) : null, req.params.id]
  );
  const updated = query('SELECT * FROM reflections WHERE id = ?', [req.params.id])[0];
  res.json({ ...updated, tags: JSON.parse(updated.tags) });
});

router.delete('/:id', async (req, res) => {
  await getDb();
  const r = run('DELETE FROM reflections WHERE id = ? AND user_id = ?', [req.params.id, req.user.openid]);
  if (r.changes === 0) return res.status(404).json({ error: '未找到' });
  res.json({ success: true });
});

module.exports = router;
