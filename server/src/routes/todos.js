const express = require('express');
const router = express.Router();
const { getDb, query, run } = require('../db');
const { authRequired } = require('../middleware/auth');

router.use(authRequired);

router.get('/', async (req, res) => {
  await getDb();
  const { status } = req.query;
  let sql = 'SELECT * FROM todos WHERE user_id = ?';
  const params = [req.user.openid];
  if (status === 'active') { sql += ' AND completed = 0'; }
  else if (status === 'done') { sql += ' AND completed = 1'; }
  sql += ' ORDER BY priority DESC, due_date ASC, created_at DESC';
  res.json(query(sql, params));
});

router.post('/', async (req, res) => {
  await getDb();
  const { title, priority = 2, due_date } = req.body;
  if (!title) return res.status(400).json({ error: '标题不能为空' });
  const result = run(
    'INSERT INTO todos (user_id, title, priority, due_date) VALUES (?, ?, ?, ?)',
    [req.user.openid, title, priority, due_date || null]
  );
  const todo = query('SELECT * FROM todos WHERE id = ?', [result.lastInsertRowid])[0];
  res.status(201).json(todo);
});

router.put('/:id', async (req, res) => {
  await getDb();
  const todo = query('SELECT * FROM todos WHERE id = ? AND user_id = ?', [req.params.id, req.user.openid])[0];
  if (!todo) return res.status(404).json({ error: '未找到' });

  const { title, completed, priority, due_date } = req.body;
  run(
    `UPDATE todos SET title = COALESCE(?, title), completed = COALESCE(?, completed),
     priority = COALESCE(?, priority), due_date = COALESCE(?, due_date),
     updated_at = datetime('now') WHERE id = ?`,
    [title ?? null, completed ?? null, priority ?? null, due_date ?? null, req.params.id]
  );
  res.json(query('SELECT * FROM todos WHERE id = ?', [req.params.id])[0]);
});

router.delete('/:id', async (req, res) => {
  await getDb();
  const result = run('DELETE FROM todos WHERE id = ? AND user_id = ?', [req.params.id, req.user.openid]);
  if (result.changes === 0) return res.status(404).json({ error: '未找到' });
  res.json({ success: true });
});

module.exports = router;
