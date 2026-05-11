const express = require('express');
const router = express.Router();
const { getDb, query, run } = require('../db');
const { authRequired } = require('../middleware/auth');

router.use(authRequired);

router.get('/', async (req, res) => {
  await getDb();
  const rows = query('SELECT * FROM memos WHERE user_id = ? ORDER BY updated_at DESC', [req.user.openid]);
  res.json(rows.map(r => ({ ...r, tags: JSON.parse(r.tags) })));
});

router.post('/', async (req, res) => {
  await getDb();
  const { title, content = '', tags = [] } = req.body;
  if (!title) return res.status(400).json({ error: '标题不能为空' });
  const result = run('INSERT INTO memos (user_id, title, content, tags) VALUES (?, ?, ?, ?)',
    [req.user.openid, title, content, JSON.stringify(tags)]);
  const memo = query('SELECT * FROM memos WHERE id = ?', [result.lastInsertRowid])[0];
  res.status(201).json({ ...memo, tags: JSON.parse(memo.tags) });
});

router.put('/:id', async (req, res) => {
  await getDb();
  const m = query('SELECT * FROM memos WHERE id = ? AND user_id = ?', [req.params.id, req.user.openid])[0];
  if (!m) return res.status(404).json({ error: '未找到' });
  const { title, content, tags } = req.body;
  run(
    `UPDATE memos SET title = COALESCE(?, title), content = COALESCE(?, content),
     tags = COALESCE(?, tags), updated_at = datetime('now') WHERE id = ?`,
    [title ?? null, content ?? null, tags ? JSON.stringify(tags) : null, req.params.id]
  );
  const updated = query('SELECT * FROM memos WHERE id = ?', [req.params.id])[0];
  res.json({ ...updated, tags: JSON.parse(updated.tags) });
});

router.delete('/:id', async (req, res) => {
  await getDb();
  const r = run('DELETE FROM memos WHERE id = ? AND user_id = ?', [req.params.id, req.user.openid]);
  if (r.changes === 0) return res.status(404).json({ error: '未找到' });
  res.json({ success: true });
});

module.exports = router;
