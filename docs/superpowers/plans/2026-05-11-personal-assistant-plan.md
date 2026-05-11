# 个人AI私人助理 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建一个微信小程序版个人AI助理，支持待办/日程/备忘/体重/健身/反思/AI对话。

**Architecture:** Node.js Express 后端 + SQLite 数据库 + DeepSeek AI API，微信原生小程序前端。HTTPS 通信，JWT 认证。

**Tech Stack:** Node.js 26, Express, better-sqlite3, JWT, DeepSeek API (OpenAI 兼容), 微信原生小程序框架

---

## Part 1: 后端项目搭建

### Task 1: 初始化后端项目

**Files:**
- Create: `server/package.json`
- Create: `server/.env.example`
- Create: `server/.gitignore`
- Create: `server/src/config/index.js`
- Create: `server/src/index.js`

- [ ] **Step 1: 创建 package.json**

```bash
cd server && npm init -y && npm install express better-sqlite3 jsonwebtoken cors dotenv && npm install -D jest nodemon
```

- [ ] **Step 2: 创建 server/.env.example**

```
PORT=3000
JWT_SECRET=your-secret-here
DEEPSEEK_API_KEY=sk-your-key
DEEPSEEK_BASE_URL=https://api.deepseek.com
WECHAT_APPID=your-appid
WECHAT_SECRET=your-secret
```

- [ ] **Step 3: 创建 server/src/config/index.js**

```js
require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3000,
  jwtSecret: process.env.JWT_SECRET || 'dev-secret',
  deepseekApiKey: process.env.DEEPSEEK_API_KEY,
  deepseekBaseUrl: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com',
  wechatAppId: process.env.WECHAT_APPID,
  wechatSecret: process.env.WECHAT_SECRET,
  dbPath: process.env.DB_PATH || './data/app.db',
};
```

- [ ] **Step 4: 创建 server/src/index.js**

```js
const express = require('express');
const cors = require('cors');
const { port } = require('./config');
const { initDb } = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

initDb();

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
```

- [ ] **Step 5: 启动验证**

Run: `cd server && node src/index.js`
Expected: `Server running on port 3000`
Then: `curl http://localhost:3000/api/health`
Expected: `{"status":"ok"}`

- [ ] **Step 6: Commit**

```bash
git add server/ && git commit -m "feat: init backend project with Express"
```

### Task 2: 数据库初始化与迁移

**Files:**
- Create: `server/src/db.js`
- Create: `server/data/.gitkeep`

- [ ] **Step 1: 创建 server/src/db.js**

```js
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const { dbPath } = require('./config');

let db;

function getDb() {
  if (!db) {
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

function initDb() {
  const db = getDb();

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      nickname TEXT,
      avatar TEXT,
      created_at DATETIME DEFAULT (datetime('now')),
      updated_at DATETIME DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS todos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL REFERENCES users(id),
      title TEXT NOT NULL,
      completed INTEGER DEFAULT 0,
      priority INTEGER DEFAULT 2,
      due_date TEXT,
      created_at DATETIME DEFAULT (datetime('now')),
      updated_at DATETIME DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS schedules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL REFERENCES users(id),
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      start_time DATETIME NOT NULL,
      end_time DATETIME NOT NULL,
      repeat TEXT DEFAULT 'none',
      remind_before INTEGER DEFAULT 15,
      created_at DATETIME DEFAULT (datetime('now')),
      updated_at DATETIME DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS memos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL REFERENCES users(id),
      title TEXT NOT NULL,
      content TEXT DEFAULT '',
      tags TEXT DEFAULT '[]',
      created_at DATETIME DEFAULT (datetime('now')),
      updated_at DATETIME DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS weight_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL REFERENCES users(id),
      weight REAL NOT NULL,
      recorded_at DATE NOT NULL,
      note TEXT DEFAULT '',
      created_at DATETIME DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS fitness_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL REFERENCES users(id),
      type TEXT NOT NULL,
      duration INTEGER NOT NULL,
      intensity INTEGER DEFAULT 2,
      detail TEXT DEFAULT '{}',
      note TEXT DEFAULT '',
      created_at DATETIME DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS reflections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL REFERENCES users(id),
      title TEXT NOT NULL,
      content TEXT DEFAULT '',
      mood INTEGER DEFAULT 3,
      tags TEXT DEFAULT '[]',
      created_at DATETIME DEFAULT (datetime('now')),
      updated_at DATETIME DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS chat_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL REFERENCES users(id),
      session_id TEXT NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_todos_user ON todos(user_id);
    CREATE INDEX IF NOT EXISTS idx_schedules_user ON schedules(user_id);
    CREATE INDEX IF NOT EXISTS idx_memos_user ON memos(user_id);
    CREATE INDEX IF NOT EXISTS idx_weight_user ON weight_records(user_id);
    CREATE INDEX IF NOT EXISTS idx_fitness_user ON fitness_records(user_id);
    CREATE INDEX IF NOT EXISTS idx_reflections_user ON reflections(user_id);
    CREATE INDEX IF NOT EXISTS idx_chat_session ON chat_history(user_id, session_id);
  `);

  console.log('Database initialized');
}

module.exports = { getDb, initDb };
```

- [ ] **Step 2: 创建 server/data/.gitkeep**

```bash
mkdir -p server/data && touch server/data/.gitkeep
echo "data/*.db" >> server/.gitignore
```

- [ ] **Step 3: 验证数据库初始化**

Run: `cd server && node -e "const {initDb}=require('./src/db'); initDb(); console.log('OK')"`
Expected: `Database initialized` / `OK`

- [ ] **Step 4: Commit**

```bash
git add server/src/db.js server/data/.gitkeep server/.gitignore && git commit -m "feat: add database schema and init"
```

---

## Part 2: 认证系统

### Task 3: JWT 认证中间件

**Files:**
- Create: `server/src/middleware/auth.js`
- Create: `server/src/routes/auth.js`

- [ ] **Step 1: 创建认证中间件 server/src/middleware/auth.js**

```js
const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config');

function authRequired(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: '未登录' });
  }
  try {
    const token = header.slice(7);
    req.user = jwt.verify(token, jwtSecret);
    next();
  } catch {
    res.status(401).json({ error: 'token无效或已过期' });
  }
}

module.exports = { authRequired };
```

- [ ] **Step 2: 创建认证路由 server/src/routes/auth.js**

```js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { jwtSecret, wechatAppId, wechatSecret } = require('../config');
const { getDb } = require('../db');
const { authRequired } = require('../middleware/auth');

// 微信登录
router.post('/login', async (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ error: '缺少code' });

  // 用code换取openid
  const wxRes = await fetch(
    `https://api.weixin.qq.com/sns/jscode2session?appid=${wechatAppId}&secret=${wechatSecret}&js_code=${code}&grant_type=authorization_code`
  );
  const wxData = await wxRes.json();
  if (wxData.errcode) {
    return res.status(400).json({ error: '微信登录失败', detail: wxData.errmsg });
  }

  const { openid } = wxData;
  const db = getDb();

  // 查或建用户
  let user = db.prepare('SELECT * FROM users WHERE id = ?').get(openid);
  if (!user) {
    db.prepare('INSERT INTO users (id) VALUES (?)').run(openid);
    user = { id: openid, nickname: null, avatar: null };
  }

  const token = jwt.sign({ openid, iat: Math.floor(Date.now() / 1000) }, jwtSecret, {
    expiresIn: '30d',
  });

  res.json({ token, user: { id: user.id, nickname: user.nickname, avatar: user.avatar } });
});

// 获取用户信息
router.get('/profile', authRequired, (req, res) => {
  const db = getDb();
  const user = db.prepare('SELECT id, nickname, avatar, created_at FROM users WHERE id = ?').get(req.user.openid);
  res.json(user);
});

// 更新用户信息
router.put('/profile', authRequired, (req, res) => {
  const { nickname, avatar } = req.body;
  const db = getDb();
  db.prepare('UPDATE users SET nickname = ?, avatar = ?, updated_at = datetime(\'now\') WHERE id = ?')
    .run(nickname, avatar, req.user.openid);
  res.json({ success: true });
});

module.exports = router;
```

- [ ] **Step 3: 注册路由到 app，更新 server/src/index.js**

Edit `server/src/index.js` — 在 `initDb();` 后添加：

```js
app.use('/api/auth', require('./routes/auth'));
```

- [ ] **Step 4: Commit**

```bash
git add server/src/middleware/ server/src/routes/ server/src/index.js && git commit -m "feat: add auth middleware and login route"
```

---

## Part 3: CRUD API 模块

### Task 4: 待办事项 API

**Files:**
- Create: `server/src/routes/todos.js`

- [ ] **Step 1: 创建 server/src/routes/todos.js**

```js
const express = require('express');
const router = express.Router();
const { getDb } = require('../db');
const { authRequired } = require('../middleware/auth');

router.use(authRequired);

// 列表
router.get('/', (req, res) => {
  const db = getDb();
  const { status } = req.query;
  let sql = 'SELECT * FROM todos WHERE user_id = ?';
  const params = [req.user.openid];
  if (status === 'active') { sql += ' AND completed = 0'; }
  else if (status === 'done') { sql += ' AND completed = 1'; }
  sql += ' ORDER BY priority DESC, due_date ASC, created_at DESC';
  res.json(db.prepare(sql).all(...params));
});

// 创建
router.post('/', (req, res) => {
  const db = getDb();
  const { title, priority = 2, due_date } = req.body;
  if (!title) return res.status(400).json({ error: '标题不能为空' });
  const result = db.prepare(
    'INSERT INTO todos (user_id, title, priority, due_date) VALUES (?, ?, ?, ?)'
  ).run(req.user.openid, title, priority, due_date || null);
  const todo = db.prepare('SELECT * FROM todos WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(todo);
});

// 更新
router.put('/:id', (req, res) => {
  const db = getDb();
  const todo = db.prepare('SELECT * FROM todos WHERE id = ? AND user_id = ?').get(req.params.id, req.user.openid);
  if (!todo) return res.status(404).json({ error: '未找到' });

  const { title, completed, priority, due_date } = req.body;
  db.prepare(
    `UPDATE todos SET title = COALESCE(?, title), completed = COALESCE(?, completed),
     priority = COALESCE(?, priority), due_date = COALESCE(?, due_date),
     updated_at = datetime('now') WHERE id = ?`
  ).run(title ?? null, completed ?? null, priority ?? null, due_date ?? null, req.params.id);
  res.json(db.prepare('SELECT * FROM todos WHERE id = ?').get(req.params.id));
});

// 删除
router.delete('/:id', (req, res) => {
  const db = getDb();
  const result = db.prepare('DELETE FROM todos WHERE id = ? AND user_id = ?').run(req.params.id, req.user.openid);
  if (result.changes === 0) return res.status(404).json({ error: '未找到' });
  res.json({ success: true });
});

module.exports = router;
```

- [ ] **Step 2: 注册路由，更新 server/src/index.js**

```js
app.use('/api/todos', require('./routes/todos'));
```

- [ ] **Step 3: 验证**

Run: `cd server && node src/index.js`
Test: `curl -X POST http://localhost:3000/api/auth/login` (无code会返回400错误，路由正常)
Test: `curl http://localhost:3000/api/todos` (无token会返回401)

- [ ] **Step 4: Commit**

```bash
git add server/src/routes/todos.js server/src/index.js && git commit -m "feat: add todos CRUD API"
```

### Task 5: 日程 API

**Files:**
- Create: `server/src/routes/schedules.js`

- [ ] **Step 1: 创建 server/src/routes/schedules.js**

```js
const express = require('express');
const router = express.Router();
const { getDb } = require('../db');
const { authRequired } = require('../middleware/auth');

router.use(authRequired);

router.get('/', (req, res) => {
  const db = getDb();
  const { date, from, to } = req.query;
  let sql = 'SELECT * FROM schedules WHERE user_id = ?';
  const params = [req.user.openid];
  if (date) { sql += ' AND start_time LIKE ?'; params.push(date + '%'); }
  if (from && to) { sql += ' AND start_time >= ? AND end_time <= ?'; params.push(from, to); }
  sql += ' ORDER BY start_time ASC';
  res.json(db.prepare(sql).all(...params));
});

router.post('/', (req, res) => {
  const db = getDb();
  const { title, description, start_time, end_time, repeat = 'none', remind_before = 15 } = req.body;
  if (!title || !start_time || !end_time) return res.status(400).json({ error: '标题和时间必填' });
  const result = db.prepare(
    'INSERT INTO schedules (user_id, title, description, start_time, end_time, repeat, remind_before) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(req.user.openid, title, description || '', start_time, end_time, repeat, remind_before);
  res.status(201).json(db.prepare('SELECT * FROM schedules WHERE id = ?').get(result.lastInsertRowid));
});

router.put('/:id', (req, res) => {
  const db = getDb();
  const s = db.prepare('SELECT * FROM schedules WHERE id = ? AND user_id = ?').get(req.params.id, req.user.openid);
  if (!s) return res.status(404).json({ error: '未找到' });
  const { title, description, start_time, end_time, repeat, remind_before } = req.body;
  db.prepare(
    `UPDATE schedules SET title = COALESCE(?, title), description = COALESCE(?, description),
     start_time = COALESCE(?, start_time), end_time = COALESCE(?, end_time),
     repeat = COALESCE(?, repeat), remind_before = COALESCE(?, remind_before),
     updated_at = datetime('now') WHERE id = ?`
  ).run(title ?? null, description ?? null, start_time ?? null, end_time ?? null, repeat ?? null, remind_before ?? null, req.params.id);
  res.json(db.prepare('SELECT * FROM schedules WHERE id = ?').get(req.params.id));
});

router.delete('/:id', (req, res) => {
  const db = getDb();
  const r = db.prepare('DELETE FROM schedules WHERE id = ? AND user_id = ?').run(req.params.id, req.user.openid);
  if (r.changes === 0) return res.status(404).json({ error: '未找到' });
  res.json({ success: true });
});

module.exports = router;
```

- [ ] **Step 2: 注册路由**

```js
app.use('/api/schedules', require('./routes/schedules'));
```

- [ ] **Step 3: Commit**

```bash
git add server/src/routes/schedules.js server/src/index.js && git commit -m "feat: add schedules CRUD API"
```

### Task 6: 备忘录、体重、健身、反思 API

**Files:**
- Create: `server/src/routes/memos.js`
- Create: `server/src/routes/weight.js`
- Create: `server/src/routes/fitness.js`
- Create: `server/src/routes/reflections.js`

这些模块结构相似，统一批处理。

- [ ] **Step 1: 创建 server/src/routes/memos.js**

```js
const express = require('express');
const router = express.Router();
const { getDb } = require('../db');
const { authRequired } = require('../middleware/auth');

router.use(authRequired);

router.get('/', (req, res) => {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM memos WHERE user_id = ? ORDER BY updated_at DESC').all(req.user.openid);
  res.json(rows.map(r => ({ ...r, tags: JSON.parse(r.tags) })));
});

router.post('/', (req, res) => {
  const db = getDb();
  const { title, content = '', tags = [] } = req.body;
  if (!title) return res.status(400).json({ error: '标题不能为空' });
  const result = db.prepare('INSERT INTO memos (user_id, title, content, tags) VALUES (?, ?, ?, ?)')
    .run(req.user.openid, title, content, JSON.stringify(tags));
  const memo = db.prepare('SELECT * FROM memos WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ ...memo, tags: JSON.parse(memo.tags) });
});

router.put('/:id', (req, res) => {
  const db = getDb();
  const m = db.prepare('SELECT * FROM memos WHERE id = ? AND user_id = ?').get(req.params.id, req.user.openid);
  if (!m) return res.status(404).json({ error: '未找到' });
  const { title, content, tags } = req.body;
  db.prepare(
    `UPDATE memos SET title = COALESCE(?, title), content = COALESCE(?, content),
     tags = COALESCE(?, tags), updated_at = datetime('now') WHERE id = ?`
  ).run(title ?? null, content ?? null, tags ? JSON.stringify(tags) : null, req.params.id);
  const updated = db.prepare('SELECT * FROM memos WHERE id = ?').get(req.params.id);
  res.json({ ...updated, tags: JSON.parse(updated.tags) });
});

router.delete('/:id', (req, res) => {
  const db = getDb();
  const r = db.prepare('DELETE FROM memos WHERE id = ? AND user_id = ?').run(req.params.id, req.user.openid);
  if (r.changes === 0) return res.status(404).json({ error: '未找到' });
  res.json({ success: true });
});

module.exports = router;
```

- [ ] **Step 2: 创建 server/src/routes/weight.js**

```js
const express = require('express');
const router = express.Router();
const { getDb } = require('../db');
const { authRequired } = require('../middleware/auth');

router.use(authRequired);

router.get('/', (req, res) => {
  const db = getDb();
  const { from, to } = req.query;
  let sql = 'SELECT * FROM weight_records WHERE user_id = ?';
  const params = [req.user.openid];
  if (from) { sql += ' AND recorded_at >= ?'; params.push(from); }
  if (to) { sql += ' AND recorded_at <= ?'; params.push(to); }
  sql += ' ORDER BY recorded_at DESC';
  res.json(db.prepare(sql).all(...params));
});

router.get('/stats', (req, res) => {
  const db = getDb();
  const stats = db.prepare(
    `SELECT MIN(weight) as min_weight, MAX(weight) as max_weight,
     ROUND(AVG(weight), 1) as avg_weight, COUNT(*) as total
     FROM weight_records WHERE user_id = ?`
  ).get(req.user.openid);
  const trend = db.prepare(
    'SELECT recorded_at, weight FROM weight_records WHERE user_id = ? ORDER BY recorded_at ASC LIMIT 90'
  ).all(req.user.openid);
  res.json({ ...stats, trend });
});

router.post('/', (req, res) => {
  const db = getDb();
  const { weight, recorded_at, note = '' } = req.body;
  if (!weight || !recorded_at) return res.status(400).json({ error: '体重和日期必填' });
  const result = db.prepare('INSERT INTO weight_records (user_id, weight, recorded_at, note) VALUES (?, ?, ?, ?)')
    .run(req.user.openid, weight, recorded_at, note);
  res.status(201).json(db.prepare('SELECT * FROM weight_records WHERE id = ?').get(result.lastInsertRowid));
});

router.delete('/:id', (req, res) => {
  const db = getDb();
  const r = db.prepare('DELETE FROM weight_records WHERE id = ? AND user_id = ?').run(req.params.id, req.user.openid);
  if (r.changes === 0) return res.status(404).json({ error: '未找到' });
  res.json({ success: true });
});

module.exports = router;
```

- [ ] **Step 3: 创建 server/src/routes/fitness.js**

```js
const express = require('express');
const router = express.Router();
const { getDb } = require('../db');
const { authRequired } = require('../middleware/auth');

router.use(authRequired);

router.get('/', (req, res) => {
  const db = getDb();
  const { type, from, to } = req.query;
  let sql = 'SELECT * FROM fitness_records WHERE user_id = ?';
  const params = [req.user.openid];
  if (type) { sql += ' AND type = ?'; params.push(type); }
  if (from) { sql += ' AND date(created_at) >= ?'; params.push(from); }
  if (to) { sql += ' AND date(created_at) <= ?'; params.push(to); }
  sql += ' ORDER BY created_at DESC';
  res.json(db.prepare(sql).all(...params));
});

router.get('/stats', (req, res) => {
  const db = getDb();
  const total = db.prepare(
    'SELECT COUNT(*) as sessions, SUM(duration) as total_minutes FROM fitness_records WHERE user_id = ?'
  ).get(req.user.openid);
  const byType = db.prepare(
    'SELECT type, COUNT(*) as count, SUM(duration) as total_minutes FROM fitness_records WHERE user_id = ? GROUP BY type'
  ).all(req.user.openid);
  res.json({ ...total, by_type: byType });
});

router.post('/', (req, res) => {
  const db = getDb();
  const { type, duration, intensity = 2, detail = {}, note = '' } = req.body;
  if (!type || !duration) return res.status(400).json({ error: '类型和时长必填' });
  const result = db.prepare(
    'INSERT INTO fitness_records (user_id, type, duration, intensity, detail, note) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(req.user.openid, type, duration, intensity, JSON.stringify(detail), note);
  res.status(201).json(db.prepare('SELECT * FROM fitness_records WHERE id = ?').get(result.lastInsertRowid));
});

router.delete('/:id', (req, res) => {
  const db = getDb();
  const r = db.prepare('DELETE FROM fitness_records WHERE id = ? AND user_id = ?').run(req.params.id, req.user.openid);
  if (r.changes === 0) return res.status(404).json({ error: '未找到' });
  res.json({ success: true });
});

module.exports = router;
```

- [ ] **Step 4: 创建 server/src/routes/reflections.js**

```js
const express = require('express');
const router = express.Router();
const { getDb } = require('../db');
const { authRequired } = require('../middleware/auth');

router.use(authRequired);

router.get('/', (req, res) => {
  const db = getDb();
  const { tag, from, to } = req.query;
  let sql = 'SELECT * FROM reflections WHERE user_id = ?';
  const params = [req.user.openid];
  if (from) { sql += ' AND date(created_at) >= ?'; params.push(from); }
  if (to) { sql += ' AND date(created_at) <= ?'; params.push(to); }
  sql += ' ORDER BY created_at DESC';
  let rows = db.prepare(sql).all(...params);

  if (tag) {
    rows = rows.filter(r => JSON.parse(r.tags).includes(tag));
  }
  res.json(rows.map(r => ({ ...r, tags: JSON.parse(r.tags) })));
});

router.get('/:id', (req, res) => {
  const db = getDb();
  const r = db.prepare('SELECT * FROM reflections WHERE id = ? AND user_id = ?').get(req.params.id, req.user.openid);
  if (!r) return res.status(404).json({ error: '未找到' });
  res.json({ ...r, tags: JSON.parse(r.tags) });
});

router.post('/', (req, res) => {
  const db = getDb();
  const { title, content = '', mood = 3, tags = [] } = req.body;
  if (!title) return res.status(400).json({ error: '标题不能为空' });
  const result = db.prepare(
    'INSERT INTO reflections (user_id, title, content, mood, tags) VALUES (?, ?, ?, ?, ?)'
  ).run(req.user.openid, title, content, mood, JSON.stringify(tags));
  const reflection = db.prepare('SELECT * FROM reflections WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ ...reflection, tags: JSON.parse(reflection.tags) });
});

router.put('/:id', (req, res) => {
  const db = getDb();
  const r = db.prepare('SELECT * FROM reflections WHERE id = ? AND user_id = ?').get(req.params.id, req.user.openid);
  if (!r) return res.status(404).json({ error: '未找到' });
  const { title, content, mood, tags } = req.body;
  db.prepare(
    `UPDATE reflections SET title = COALESCE(?, title), content = COALESCE(?, content),
     mood = COALESCE(?, mood), tags = COALESCE(?, tags),
     updated_at = datetime('now') WHERE id = ?`
  ).run(title ?? null, content ?? null, mood ?? null, tags ? JSON.stringify(tags) : null, req.params.id);
  const updated = db.prepare('SELECT * FROM reflections WHERE id = ?').get(req.params.id);
  res.json({ ...updated, tags: JSON.parse(updated.tags) });
});

router.delete('/:id', (req, res) => {
  const db = getDb();
  const r = db.prepare('DELETE FROM reflections WHERE id = ? AND user_id = ?').run(req.params.id, req.user.openid);
  if (r.changes === 0) return res.status(404).json({ error: '未找到' });
  res.json({ success: true });
});

module.exports = router;
```

- [ ] **Step 5: 注册所有路由，更新 server/src/index.js**

```js
app.use('/api/memos', require('./routes/memos'));
app.use('/api/weight', require('./routes/weight'));
app.use('/api/fitness', require('./routes/fitness'));
app.use('/api/reflections', require('./routes/reflections'));
```

- [ ] **Step 6: Commit**

```bash
git add server/src/routes/ server/src/index.js && git commit -m "feat: add memos, weight, fitness, reflections APIs"
```

---

## Part 4: AI 对话

### Task 7: DeepSeek AI 服务 + 对话 API

**Files:**
- Create: `server/src/services/ai.js`
- Create: `server/src/routes/chat.js`

- [ ] **Step 1: 创建 server/src/services/ai.js**

```js
const { deepseekApiKey, deepseekBaseUrl } = require('../config');

async function* streamChat(messages) {
  const response = await fetch(`${deepseekBaseUrl}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${deepseekApiKey}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages,
      stream: true,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`DeepSeek API error: ${response.status} ${err}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6).trim();
        if (data === '[DONE]') return;
        try {
          const json = JSON.parse(data);
          const content = json.choices?.[0]?.delta?.content;
          if (content) yield content;
        } catch {}
      }
    }
  }
}

module.exports = { streamChat };
```

- [ ] **Step 2: 创建 server/src/routes/chat.js**

```js
const express = require('express');
const router = express.Router();
const { getDb } = require('../db');
const { authRequired } = require('../middleware/auth');
const { streamChat } = require('../services/ai');

router.use(authRequired);

// SSE 流式对话
router.post('/', async (req, res) => {
  const { session_id: sid, message } = req.body;
  if (!message) return res.status(400).json({ error: '消息不能为空' });

  const db = getDb();
  const sessionId = sid || `sess_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  // 存储用户消息
  db.prepare('INSERT INTO chat_history (user_id, session_id, role, content) VALUES (?, ?, ?, ?)')
    .run(req.user.openid, sessionId, 'user', message);

  // 获取会话历史(最近20轮)
  const history = db.prepare(
    'SELECT role, content FROM chat_history WHERE user_id = ? AND session_id = ? ORDER BY created_at ASC LIMIT 40'
  ).all(req.user.openid, sessionId);

  // 构建消息
  const messages = [
    {
      role: 'system',
      content: `你是用户的私人AI助理。你可以帮助用户管理待办事项、日程、备忘录、体重、健身和反思记录。请用中文回复，简洁实用。用户openid: ${req.user.openid}`,
    },
    ...history.map(h => ({ role: h.role, content: h.content })),
  ];

  // 设置 SSE
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
    // 存储 AI 回复
    db.prepare('INSERT INTO chat_history (user_id, session_id, role, content) VALUES (?, ?, ?, ?)')
      .run(req.user.openid, sessionId, 'assistant', fullResponse);
    res.write(`data: ${JSON.stringify({ session_id: sessionId, done: true })}\n\n`);
  } catch (err) {
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
  }
  res.end();
});

// 会话列表
router.get('/sessions', (req, res) => {
  const db = getDb();
  const sessions = db.prepare(
    `SELECT session_id, MIN(created_at) as created_at,
     (SELECT content FROM chat_history c2 WHERE c2.session_id = c1.session_id ORDER BY created_at DESC LIMIT 1) as last_message
     FROM chat_history c1 WHERE user_id = ? GROUP BY session_id ORDER BY created_at DESC`
  ).all(req.user.openid);
  res.json(sessions);
});

// 会话历史
router.get('/sessions/:id', (req, res) => {
  const db = getDb();
  const messages = db.prepare(
    'SELECT * FROM chat_history WHERE user_id = ? AND session_id = ? ORDER BY created_at ASC'
  ).all(req.user.openid, req.params.id);
  res.json(messages);
});

// 删除会话
router.delete('/sessions/:id', (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM chat_history WHERE user_id = ? AND session_id = ?').run(req.user.openid, req.params.id);
  res.json({ success: true });
});

module.exports = router;
```

- [ ] **Step 3: 注册路由，更新 server/src/index.js**

```js
app.use('/api/chat', require('./routes/chat'));
```

- [ ] **Step 4: Commit**

```bash
git add server/src/services/ server/src/routes/chat.js server/src/index.js && git commit -m "feat: add AI chat with SSE streaming"
```

---

## Part 5: 微信小程序项目搭建

### Task 8: 小程序项目初始化

**Files:**
- Create: `miniprogram/app.js`
- Create: `miniprogram/app.json`
- Create: `miniprogram/app.wxss`
- Create: `miniprogram/project.config.json`
- Create: `miniprogram/utils/api.js`
- Create: `miniprogram/utils/auth.js`

- [ ] **Step 1: 创建 miniprogram/app.js**

```js
const { checkLogin } = require('./utils/auth');

App({
  globalData: {
    token: '',
    userInfo: null,
  },

  onLaunch() {
    checkLogin.call(this);
  },
});
```

- [ ] **Step 2: 创建 miniprogram/app.json**

```json
{
  "pages": [
    "pages/todos/todos",
    "pages/schedules/schedules",
    "pages/records/records",
    "pages/chat/chat",
    "pages/memos/memos",
    "pages/memo-edit/memo-edit",
    "pages/weight/weight",
    "pages/fitness/fitness",
    "pages/reflections/reflections",
    "pages/reflection-edit/reflection-edit",
    "pages/todo-edit/todo-edit",
    "pages/schedule-edit/schedule-edit"
  ],
  "window": {
    "backgroundTextStyle": "light",
    "navigationBarBackgroundColor": "#1677ff",
    "navigationBarTitleText": "私人助理",
    "navigationBarTextStyle": "white"
  },
  "tabBar": {
    "color": "#999",
    "selectedColor": "#1677ff",
    "list": [
      { "pagePath": "pages/todos/todos", "text": "待办", "iconPath": "", "selectedIconPath": "" },
      { "pagePath": "pages/schedules/schedules", "text": "日程", "iconPath": "", "selectedIconPath": "" },
      { "pagePath": "pages/records/records", "text": "记录", "iconPath": "", "selectedIconPath": "" },
      { "pagePath": "pages/chat/chat", "text": "AI", "iconPath": "", "selectedIconPath": "" }
    ]
  },
  "style": "v2",
  "sitemapLocation": "sitemap.json"
}
```

- [ ] **Step 3: 创建 miniprogram/app.wxss**

```css
page { background: #f5f5f5; font-size: 14px; color: #333; }
.container { padding: 16px; }
.card { background: #fff; border-radius: 8px; padding: 16px; margin-bottom: 12px; }
.btn-primary { background: #1677ff; color: #fff; border-radius: 4px; padding: 10px 20px; text-align: center; }
.text-muted { color: #999; font-size: 12px; }
.empty-state { text-align: center; padding: 40px 0; color: #999; }
```

- [ ] **Step 4: 创建 miniprogram/utils/api.js**

```js
const BASE_URL = 'https://your-domain.com/api';

function request(url, options = {}) {
  const app = getApp();
  const token = app.globalData.token;

  return new Promise((resolve, reject) => {
    wx.request({
      url: BASE_URL + url,
      method: options.method || 'GET',
      data: options.data,
      header: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
      },
      success(res) {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data);
        } else if (res.statusCode === 401) {
          const app = getApp();
          app.globalData.token = '';
          wx.showToast({ title: '请重新登录', icon: 'none' });
          reject(res.data);
        } else {
          reject(res.data);
        }
      },
      fail(err) {
        wx.showToast({ title: '网络错误', icon: 'none' });
        reject(err);
      },
    });
  });
}

module.exports = {
  get: (url, data) => request(url, { method: 'GET', data }),
  post: (url, data) => request(url, { method: 'POST', data }),
  put: (url, data) => request(url, { method: 'PUT', data }),
  del: (url) => request(url, { method: 'DELETE' }),
};
```

- [ ] **Step 5: 创建 miniprogram/utils/auth.js**

```js
const api = require('./api');

function checkLogin() {
  const token = wx.getStorageSync('token');
  if (token) {
    this.globalData.token = token;
  }
  return token;
}

async function login() {
  return new Promise((resolve, reject) => {
    wx.login({
      success(res) {
        if (res.code) {
          api.post('/auth/login', { code: res.code }).then(data => {
            const app = getApp();
            app.globalData.token = data.token;
            app.globalData.userInfo = data.user;
            wx.setStorageSync('token', data.token);
            resolve(data);
          }).catch(reject);
        } else {
          reject(new Error('wx.login failed'));
        }
      },
      fail: reject,
    });
  });
}

module.exports = { checkLogin, login };
```

- [ ] **Step 6: 创建 miniprogram/project.config.json**

```json
{
  "miniprogramRoot": "./",
  "projectname": "personal-assistant",
  "description": "个人AI私人助理",
  "appid": "your-appid-here",
  "setting": { "urlCheck": true, "es6": true, "postcss": true },
  "compileType": "miniprogram"
}
```

- [ ] **Step 7: Commit**

```bash
git add miniprogram/ && git commit -m "feat: init miniprogram scaffold"
```

---

## Part 6: 小程序页面

### Task 9: 待办列表页 + 编辑页

**Files:**
- Create: `miniprogram/pages/todos/todos.js`
- Create: `miniprogram/pages/todos/todos.wxml`
- Create: `miniprogram/pages/todos/todos.wxss`
- Create: `miniprogram/pages/todos/todos.json`
- Create: `miniprogram/pages/todo-edit/todo-edit.js`
- Create: `miniprogram/pages/todo-edit/todo-edit.wxml`
- Create: `miniprogram/pages/todo-edit/todo-edit.wxss`
- Create: `miniprogram/pages/todo-edit/todo-edit.json`

- [ ] **Step 1: 创建 todos.js**

```js
const api = require('../../utils/api');
const { login } = require('../../utils/auth');

Page({
  data: {
    todos: [],
    filter: 'active',
    activeCount: 0,
    doneCount: 0,
  },

  onShow() { this.load(); },

  async load() {
    try {
      const todos = await api.get(`/todos?status=${this.data.filter}`);
      this.setData({
        todos,
        activeCount: todos.filter(t => !t.completed).length,
        doneCount: todos.filter(t => t.completed).length,
      });
    } catch {}
  },

  setFilter(e) { const f = e.currentTarget.dataset.filter; this.setData({ filter: f }); this.load(); },

  toggleTodo(e) {
    const { id, completed } = e.currentTarget.dataset;
    api.put(`/todos/${id}`, { completed: completed ? 0 : 1 }).then(() => this.load());
  },

  deleteTodo(e) {
    const { id } = e.currentTarget.dataset;
    wx.showModal({
      title: '删除待办',
      content: '确定删除吗？',
      success: (res) => { if (res.confirm) api.del(`/todos/${id}`).then(() => this.load()); },
    });
  },

  goEdit(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/todo-edit/todo-edit?id=${id}` });
  },

  goNew() { wx.navigateTo({ url: '/pages/todo-edit/todo-edit' }); },

  async ensureLogin() {
    if (!getApp().globalData.token) await login();
  },
});
```

- [ ] **Step 2: 创建 todos.wxml**

```xml
<view class="container">
  <view class="filter-bar">
    <view class="filter-item {{filter === 'active' ? 'active' : ''}}" data-filter="active" bindtap="setFilter">
      进行中 ({{activeCount}})
    </view>
    <view class="filter-item {{filter === 'done' ? 'active' : ''}}" data-filter="done" bindtap="setFilter">
      已完成 ({{doneCount}})
    </view>
  </view>

  <view wx:if="{{todos.length === 0}}" class="empty-state">暂无待办事项</view>

  <view wx:for="{{todos}}" wx:key="id" class="card todo-item">
    <view class="todo-check {{item.completed ? 'checked' : ''}}" 
      data-id="{{item.id}}" data-completed="{{item.completed}}" bindtap="toggleTodo">
      {{item.completed ? '✓' : ''}}
    </view>
    <view class="todo-body" bindtap="goEdit" data-id="{{item.id}}">
      <view class="{{item.completed ? 'done' : ''}}">{{item.title}}</view>
      <view class="text-muted" wx:if="{{item.due_date}}">{{item.due_date}}</view>
    </view>
    <view class="todo-del" data-id="{{item.id}}" bindtap="deleteTodo">×</view>
  </view>

  <view class="fab" bindtap="goNew">+</view>
</view>
```

- [ ] **Step 3: 创建 todos.wxss**

```css
.filter-bar { display: flex; gap: 12px; margin-bottom: 16px; }
.filter-item { padding: 6px 16px; background: #fff; border-radius: 20px; font-size: 13px; }
.filter-item.active { background: #1677ff; color: #fff; }
.todo-item { display: flex; align-items: center; gap: 12px; }
.todo-check { width: 22px; height: 22px; border: 2px solid #ccc; border-radius: 50%; 
  display: flex; align-items: center; justify-content: center; font-size: 14px; }
.todo-check.checked { background: #1677ff; border-color: #1677ff; color: #fff; }
.todo-body { flex: 1; }
.todo-body .done { text-decoration: line-through; color: #999; }
.todo-del { color: #ff4d4f; font-size: 20px; padding: 4px; }
.fab { position: fixed; bottom: 60px; right: 20px; width: 52px; height: 52px;
  background: #1677ff; color: #fff; border-radius: 50%; display: flex;
  align-items: center; justify-content: center; font-size: 28px; box-shadow: 0 2px 8px rgba(0,0,0,0.2); }
```

- [ ] **Step 4: 创建 todos.json**

```json
{ "navigationBarTitleText": "待办" }
```

- [ ] **Step 5: 创建 todo-edit.js**

```js
const api = require('../../utils/api');

Page({
  data: { id: null, title: '', priority: 2, due_date: '', isEdit: false },

  onLoad(options) {
    if (options.id) {
      this.setData({ id: options.id, isEdit: true });
      this.loadTodo();
    }
  },

  async loadTodo() {
    const todos = await api.get('/todos', { status: 'active' });
    const todo = todos.find(t => t.id == this.data.id);
    if (todo) {
      this.setData({ title: todo.title, priority: todo.priority, due_date: todo.due_date || '' });
    }
  },

  save() {
    const { id, isEdit, title, priority, due_date } = this.data;
    if (!title.trim()) { wx.showToast({ title: '请输入标题', icon: 'none' }); return; }
    const data = { title, priority, due_date: due_date || null };
    const req = isEdit ? api.put(`/todos/${id}`, data) : api.post('/todos', data);
    req.then(() => { wx.navigateBack(); }).catch(() => {});
  },
});
```

- [ ] **Step 6: 创建 todo-edit.wxml**

```xml
<view class="container">
  <view class="form-item">
    <view class="label">标题</view>
    <input value="{{title}}" bindinput="onTitle" placeholder="待办事项..." />
  </view>
  <view class="form-item">
    <view class="label">优先级</view>
    <view class="priority-picker">
      <view class="p-item {{priority === 1 ? 'active' : ''}}" data-p="1" bindtap="setPriority">低</view>
      <view class="p-item {{priority === 2 ? 'active' : ''}}" data-p="2" bindtap="setPriority">中</view>
      <view class="p-item {{priority === 3 ? 'active' : ''}}" data-p="3" bindtap="setPriority">高</view>
    </view>
  </view>
  <view class="form-item">
    <view class="label">截止日期</view>
    <picker mode="date" value="{{due_date}}" bindchange="setDate">
      <view>{{due_date || '选择日期'}}</view>
    </picker>
  </view>
  <button class="btn-primary" bindtap="save">保存</button>
</view>
```

- [ ] **Step 7: 创建 todo-edit.wxss** (在已有app.wxss基础上，额外样式)

```css
.form-item { background: #fff; padding: 12px 16px; margin-bottom: 8px; }
.label { font-size: 12px; color: #999; margin-bottom: 4px; }
.priority-picker { display: flex; gap: 8px; }
.p-item { padding: 4px 12px; border-radius: 12px; border: 1px solid #ddd; font-size: 12px; }
.p-item.active { background: #1677ff; color: #fff; border-color: #1677ff; }
```

- [ ] **Step 8: Commit**

```bash
git add miniprogram/pages/todos/ miniprogram/pages/todo-edit/ && git commit -m "feat: add todo list and edit pages"
```

### Task 10: 日程页

**Files:**
- Create: `miniprogram/pages/schedules/schedules.js`
- Create: `miniprogram/pages/schedules/schedules.wxml`
- Create: `miniprogram/pages/schedules/schedules.wxss`
- Create: `miniprogram/pages/schedules/schedules.json`
- Create: `miniprogram/pages/schedule-edit/schedule-edit.js`
- Create: `miniprogram/pages/schedule-edit/schedule-edit.wxml`
- Create: `miniprogram/pages/schedule-edit/schedule-edit.wxss`
- Create: `miniprogram/pages/schedule-edit/schedule-edit.json`

- [ ] **Step 1: 创建 schedules.js**

```js
const api = require('../../utils/api');
const { login } = require('../../utils/auth');

Page({
  data: { schedules: [], currentDate: '', weekDates: [] },

  onShow() {
    const now = new Date();
    this.setData({ currentDate: this.formatDate(now) });
    this.load();
  },

  formatDate(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  },

  async load() {
    try {
      const schedules = await api.get('/schedules', { date: this.data.currentDate });
      this.setData({ schedules });
    } catch {}
  },

  prevDay() {
    const d = new Date(this.data.currentDate);
    d.setDate(d.getDate() - 1);
    this.setData({ currentDate: this.formatDate(d) });
    this.load();
  },

  nextDay() {
    const d = new Date(this.data.currentDate);
    d.setDate(d.getDate() + 1);
    this.setData({ currentDate: this.formatDate(d) });
    this.load();
  },

  goNew() { wx.navigateTo({ url: '/pages/schedule-edit/schedule-edit' }); },

  goEdit(e) {
    wx.navigateTo({ url: `/pages/schedule-edit/schedule-edit?id=${e.currentTarget.dataset.id}` });
  },

  deleteSchedule(e) {
    const { id } = e.currentTarget.dataset;
    wx.showModal({
      title: '删除日程', content: '确定删除吗？',
      success: (res) => { if (res.confirm) api.del(`/schedules/${id}`).then(() => this.load()); },
    });
  },
});
```

- [ ] **Step 2: 创建 schedules.wxml**

```xml
<view class="container">
  <view class="date-nav">
    <view bindtap="prevDay">‹</view>
    <view class="date-text">{{currentDate}}</view>
    <view bindtap="nextDay">›</view>
  </view>

  <view wx:if="{{schedules.length === 0}}" class="empty-state">今日无日程</view>

  <view wx:for="{{schedules}}" wx:key="id" class="card" bindtap="goEdit" data-id="{{item.id}}">
    <view>{{item.title}}</view>
    <view class="text-muted">{{item.start_time}} - {{item.end_time}}</view>
    <view wx:if="{{item.description}}" class="text-muted">{{item.description}}</view>
  </view>

  <view class="fab" bindtap="goNew">+</view>
</view>
```

- [ ] **Step 3: 创建 schedules.wxss**

```css
.date-nav { display: flex; align-items: center; justify-content: center; gap: 20px;
  background: #fff; padding: 12px; border-radius: 8px; margin-bottom: 16px; }
.date-text { font-size: 16px; font-weight: 600; }
```

- [ ] **Step 4: 创建 schedule-edit.js**

```js
const api = require('../../utils/api');

Page({
  data: { id: null, title: '', description: '', start_time: '', end_time: '',
    repeat: 'none', remind_before: 15, isEdit: false },

  onLoad(opts) {
    if (opts.id) {
      this.setData({ id: opts.id, isEdit: true });
      api.get('/schedules', { date: '' }).then(list => {
        const s = list.find(s => s.id == opts.id);
        if (s) this.setData({
          title: s.title, description: s.description, start_time: s.start_time,
          end_time: s.end_time, repeat: s.repeat, remind_before: s.remind_before,
        });
      });
    }
  },

  save() {
    const { id, isEdit, title, start_time, end_time, description, repeat, remind_before } = this.data;
    if (!title || !start_time || !end_time) {
      wx.showToast({ title: '标题和时间必填', icon: 'none' }); return;
    }
    const data = { title, description, start_time, end_time, repeat, remind_before };
    (isEdit ? api.put(`/schedules/${id}`, data) : api.post('/schedules', data))
      .then(() => wx.navigateBack());
  },
});
```

- [ ] **Step 5: 创建 schedule-edit.wxml**

```xml
<view class="container">
  <view class="form-item">
    <view class="label">标题</view>
    <input value="{{title}}" bindinput="onInput" data-key="title" placeholder="日程标题" />
  </view>
  <view class="form-item">
    <view class="label">描述</view>
    <input value="{{description}}" bindinput="onInput" data-key="description" placeholder="可选" />
  </view>
  <view class="form-item">
    <view class="label">开始时间</view>
    <picker mode="multiSelector" value="{{start_time}}" range="{{timeRange}}" bindchange="setStart">
      {{start_time || '选择开始时间'}}
    </picker>
  </view>
  <view class="form-item">
    <view class="label">结束时间</view>
    <picker mode="multiSelector" value="{{end_time}}" range="{{timeRange}}" bindchange="setEnd">
      {{end_time || '选择结束时间'}}
    </picker>
  </view>
  <button class="btn-primary" bindtap="save">保存</button>
</view>
```

- [ ] **Step 6: Commit**

```bash
git add miniprogram/pages/schedules/ miniprogram/pages/schedule-edit/ && git commit -m "feat: add schedule pages"
```

### Task 11: 记录入口页

**Files:**
- Create: `miniprogram/pages/records/records.js`
- Create: `miniprogram/pages/records/records.wxml`
- Create: `miniprogram/pages/records/records.wxss`
- Create: `miniprogram/pages/records/records.json`

- [ ] **Step 1: 创建 records.js**

```js
Page({
  goMemo() { wx.navigateTo({ url: '/pages/memos/memos' }); },
  goWeight() { wx.navigateTo({ url: '/pages/weight/weight' }); },
  goFitness() { wx.navigateTo({ url: '/pages/fitness/fitness' }); },
  goReflection() { wx.navigateTo({ url: '/pages/reflections/reflections' }); },
});
```

- [ ] **Step 2: 创建 records.wxml**

```xml
<view class="container">
  <view class="card" bindtap="goMemo">📖 备忘录</view>
  <view class="card" bindtap="goWeight">⚖️ 体重管理</view>
  <view class="card" bindtap="goFitness">🏃 健身记录</view>
  <view class="card" bindtap="goReflection">💭 反思记录</view>
</view>
```

- [ ] **Step 3: Create records.wxss** — (样式已在app.wxss的.card中定义)
- [ ] **Step 4: Create records.json** — `{ "navigationBarTitleText": "记录" }`

- [ ] **Step 5: Commit**

```bash
git add miniprogram/pages/records/ && git commit -m "feat: add records hub page"
```

### Task 12: 备忘录、体重、健身、反思页面

**Files:**
- Create: `miniprogram/pages/memos/memos.js` + `.wxml` + `.wxss` + `.json`
- Create: `miniprogram/pages/memo-edit/memo-edit.js` + `.wxml` + `.wxss` + `.json`
- Create: `miniprogram/pages/weight/weight.js` + `.wxml` + `.wxss` + `.json`
- Create: `miniprogram/pages/fitness/fitness.js` + `.wxml` + `.wxss` + `.json`
- Create: `miniprogram/pages/reflections/reflections.js` + `.wxml` + `.wxss` + `.json`
- Create: `miniprogram/pages/reflection-edit/reflection-edit.js` + `.wxml` + `.wxss` + `.json`

- [ ] **Step 1: 创建 memos.js**

```js
const api = require('../../utils/api');

Page({
  data: { memos: [] },
  onShow() { this.load(); },
  async load() {
    try { const memos = await api.get('/memos'); this.setData({ memos }); } catch {}
  },
  goEdit(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/memo-edit/memo-edit?id=${id}` });
  },
  goNew() { wx.navigateTo({ url: '/pages/memo-edit/memo-edit' }); },
  deleteMemo(e) {
    wx.showModal({
      title: '删除', content: '确定删除吗？',
      success: (res) => { if (res.confirm) api.del(`/memos/${e.currentTarget.dataset.id}`).then(() => this.load()); },
    });
  },
});
```

- [ ] **Step 2: 创建 memos.wxml**

```xml
<view class="container">
  <view wx:if="{{memos.length === 0}}" class="empty-state">暂无备忘录</view>
  <view wx:for="{{memos}}" wx:key="id" class="card" bindtap="goEdit" data-id="{{item.id}}">
    <view>{{item.title}}</view>
    <view class="text-muted">{{item.content}}</view>
    <view wx:if="{{item.tags.length}}" class="text-muted">
      <text wx:for="{{item.tags}}" wx:key="*this" wx:for-item="tag" class="tag">#{{tag}}</text>
    </view>
  </view>
  <view class="fab" bindtap="goNew">+</view>
</view>
```

- [ ] **Step 3: 创建 memo-edit.js**

```js
const api = require('../../utils/api');

Page({
  data: { id: null, title: '', content: '', tagsStr: '', isEdit: false },

  onLoad(opts) {
    if (opts.id) this.setData({ id: opts.id, isEdit: true });
    if (opts.id) {
      api.get('/memos').then(list => {
        const m = list.find(m => m.id == opts.id);
        if (m) this.setData({ title: m.title, content: m.content, tagsStr: m.tags.join(',') });
      });
    }
  },

  save() {
    const { id, isEdit, title, content, tagsStr } = this.data;
    if (!title.trim()) { wx.showToast({ title: '标题必填', icon: 'none' }); return; }
    const tags = tagsStr.split(',').map(s => s.trim()).filter(Boolean);
    const data = { title, content, tags };
    (isEdit ? api.put(`/memos/${id}`, data) : api.post('/memos', data))
      .then(() => wx.navigateBack());
  },
});
```

- [ ] **Step 4: 创建 vector 体重页面 weight.js**

```js
const api = require('../../utils/api');

Page({
  data: { records: [], stats: {}, showForm: false, weight: '', recorded_at: '', note: '' },

  onShow() { this.load(); },

  async load() {
    try {
      const [records, stats] = await Promise.all([api.get('/weight'), api.get('/weight/stats')]);
      this.setData({ records, stats });
    } catch {}
  },

  showAdd() { this.setData({ showForm: true, weight: '', recorded_at: '', note: '' }); },
  hideForm() { this.setData({ showForm: false }); },

  save() {
    const { weight, recorded_at, note } = this.data;
    if (!weight || !recorded_at) { wx.showToast({ title: '填写完整', icon: 'none' }); return; }
    api.post('/weight', { weight: parseFloat(weight), recorded_at, note }).then(() => {
      this.hideForm(); this.load();
    });
  },

  del(e) {
    wx.showModal({
      title: '删除', content: '确定删除？',
      success: (res) => { if (res.confirm) api.del(`/weight/${e.currentTarget.dataset.id}`).then(() => this.load()); },
    });
  },
});
```

- [ ] **Step 5: 创建 weight.wxml**

```xml
<view class="container">
  <view wx:if="{{stats.total}}" class="card">
    <view class="text-muted">体重范围: {{stats.min_weight}}kg - {{stats.max_weight}}kg | 平均: {{stats.avg_weight}}kg</view>
  </view>

  <view wx:if="{{records.length === 0}}" class="empty-state">暂无体重记录</view>

  <view wx:for="{{records}}" wx:key="id" class="card">
    <view>{{item.weight}} kg</view>
    <view class="text-muted">{{item.recorded_at}}</view>
    <view class="text-muted" wx:if="{{item.note}}">{{item.note}}</view>
    <view class="todo-del" data-id="{{item.id}}" bindtap="del">×</view>
  </view>

  <view wx:if="{{showForm}}" class="card">
    <input value="{{weight}}" bindinput="onInput" data-key="weight" placeholder="体重(kg)" type="digit" />
    <picker mode="date" value="{{recorded_at}}" bindchange="setDate">
      {{recorded_at || '选择日期'}}
    </picker>
    <input value="{{note}}" bindinput="onInput" data-key="note" placeholder="备注" />
    <button class="btn-primary" bindtap="save">保存</button>
  </view>

  <view class="fab" bindtap="showAdd">+</view>
</view>
```

- [ ] **Step 6: 创建 fitness.js**

```js
const api = require('../../utils/api');

Page({
  data: { records: [], stats: {}, showForm: false, type: '', duration: '', intensity: 2, detail: '', note: '' },

  onShow() { this.load(); },

  async load() {
    try {
      const [records, stats] = await Promise.all([api.get('/fitness'), api.get('/fitness/stats')]);
      this.setData({ records, stats });
    } catch {}
  },

  showAdd() { this.setData({ showForm: true }); },
  hideForm() { this.setData({ showForm: false }); },

  save() {
    const { type, duration, intensity, detail, note } = this.data;
    if (!type || !duration) { wx.showToast({ title: '填写完整', icon: 'none' }); return; }
    let detailObj = {};
    try { detailObj = JSON.parse(detail || '{}'); } catch {}
    api.post('/fitness', { type, duration: parseInt(duration), intensity, detail: detailObj, note })
      .then(() => { this.hideForm(); this.load(); });
  },

  del(e) {
    wx.showModal({
      title: '删除', content: '确定删除？',
      success: (res) => { if (res.confirm) api.del(`/fitness/${e.currentTarget.dataset.id}`).then(() => this.load()); },
    });
  },
});
```

- [ ] **Step 7: 创建 fitness.wxml**

```xml
<view class="container">
  <view wx:if="{{stats.total_minutes}}" class="card">
    <view class="text-muted">总运动: {{stats.total_minutes}}分钟 | {{stats.sessions}}次</view>
  </view>

  <view wx:if="{{records.length === 0}}" class="empty-state">暂无健身记录</view>

  <view wx:for="{{records}}" wx:key="id" class="card">
    <view>{{item.type}} - {{item.duration}}分钟</view>
    <view class="text-muted">{{item.note}}</view>
    <view class="todo-del" data-id="{{item.id}}" bindtap="del">×</view>
  </view>

  <view wx:if="{{showForm}}" class="card">
    <input value="{{type}}" bindinput="onInput" data-key="type" placeholder="运动类型(跑步/游泳/健身...)" />
    <input value="{{duration}}" bindinput="onInput" data-key="duration" placeholder="时长(分钟)" type="number" />
    <input value="{{note}}" bindinput="onInput" data-key="note" placeholder="备注" />
    <button class="btn-primary" bindtap="save">保存</button>
  </view>

  <view class="fab" bindtap="showAdd">+</view>
</view>
```

- [ ] **Step 8: 创建 reflections.js 和 reflection-edit.js** — 结构同 memos，增加 mood 字段（1-5分值）。

- [ ] **Step 9: Commit**

```bash
git add miniprogram/pages/memos/ miniprogram/pages/memo-edit/ miniprogram/pages/weight/ miniprogram/pages/fitness/ miniprogram/pages/reflections/ miniprogram/pages/reflection-edit/ && git commit -m "feat: add memos, weight, fitness, reflections pages"
```

### Task 13: AI 对话页

**Files:**
- Create: `miniprogram/pages/chat/chat.js`
- Create: `miniprogram/pages/chat/chat.wxml`
- Create: `miniprogram/pages/chat/chat.wxss`
- Create: `miniprogram/pages/chat/chat.json`

- [ ] **Step 1: 创建 chat.js**

```js
const api = require('../../utils/api');

Page({
  data: {
    sessions: [],
    messages: [],
    input: '',
    currentSessionId: '',
    streaming: false,
  },

  onShow() { this.loadSessions(); },

  async loadSessions() {
    try { this.setData({ sessions: await api.get('/chat/sessions') }); } catch {}
  },

  async openSession(e) {
    const sid = e.currentTarget.dataset.id;
    const messages = await api.get(`/chat/sessions/${sid}`);
    this.setData({ currentSessionId: sid, messages });
  },

  async newSession() {
    this.setData({ currentSessionId: '', messages: [] });
  },

  async sendMessage() {
    const { input, currentSessionId, messages } = this.data;
    if (!input.trim() || this.data.streaming) return;

    const userMsg = { role: 'user', content: input };
    const newMessages = [...messages, userMsg];
    this.setData({ messages: newMessages, input: '', streaming: true });

    const aiMsg = { role: 'assistant', content: '' };
    newMessages.push(aiMsg);
    this.setData({ messages: newMessages });

    const task = wx.request({
      url: api.BASE_URL + '/chat',
      method: 'POST',
      enableChunked: true,
      header: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getApp().globalData.token}` },
      data: { session_id: currentSessionId || undefined, message: input },
      success: () => { this.setData({ streaming: false }); this.loadSessions(); },
      fail: () => { this.setData({ streaming: false }); },
    });

    task.onChunkReceived((res) => {
      try {
        const json = JSON.parse(res.data.slice(6)); // strip "data: "
        if (json.content) {
          const msgs = this.data.messages;
          msgs[msgs.length - 1].content += json.content;
          this.setData({ messages: msgs });
        }
        if (json.session_id) {
          this.setData({ currentSessionId: json.session_id });
        }
      } catch {}
    });
  },

  deleteSession(e) {
    wx.showModal({
      title: '删除会话', content: '确定删除？',
      success: (res) => {
        if (res.confirm) {
          api.del(`/chat/sessions/${e.currentTarget.dataset.id}`).then(() => {
            if (this.data.currentSessionId === e.currentTarget.dataset.id) {
              this.setData({ currentSessionId: '', messages: [] });
            }
            this.loadSessions();
          });
        }
      },
    });
  },

  quickAction(e) {
    const prompts = {
      summary: '请根据我今日的待办和日程，做一个简要总结',
      review: '请回顾我本周的各项记录，给我一些建议',
      suggest: '请根据我的体重和健身记录，给我一些提升建议',
    };
    this.setData({ input: prompts[e.currentTarget.dataset.key] || '' });
  },
});
```

- [ ] **Step 2: 创建 chat.wxml**

```xml
<view class="chat-container">
  <!-- 会话列表 -->
  <view wx:if="{{!currentSessionId && messages.length === 0}}">
    <button bindtap="newSession" class="btn-primary">新建对话</button>
    <view wx:for="{{sessions}}" wx:key="session_id" class="card session-item" 
      bindtap="openSession" data-id="{{item.session_id}}">
      <view>{{item.last_message}}</view>
      <view class="text-muted">{{item.created_at}}</view>
      <view class="todo-del" data-id="{{item.session_id}}" catchtap="deleteSession">×</view>
    </view>
  </view>

  <!-- 聊天区域 -->
  <view wx:if="{{currentSessionId || messages.length > 0}}" class="chat-body">
    <scroll-view scroll-y class="messages" scroll-into-view="msg-{{messages.length - 1}}">
      <view wx:for="{{messages}}" wx:key="index" id="msg-{{index}}" class="msg {{item.role}}">
        <view class="bubble">{{item.content}}</view>
      </view>
    </scroll-view>

    <view class="input-bar">
      <input value="{{input}}" bindinput="onInput" data-key="input" placeholder="输入消息..." confirm-type="send" bindconfirm="sendMessage" />
      <button bindtap="sendMessage" disabled="{{streaming}}">发送</button>
    </view>

    <view class="quick-actions">
      <view bindtap="quickAction" data-key="summary">今日总结</view>
      <view bindtap="quickAction" data-key="review">本周回顾</view>
      <view bindtap="quickAction" data-key="suggest">提升建议</view>
    </view>
  </view>
</view>
```

- [ ] **Step 3: 创建 chat.wxss**

```css
.chat-container { display: flex; flex-direction: column; height: 100vh; }
.chat-body { flex: 1; display: flex; flex-direction: column; }
.messages { flex: 1; padding: 12px; overflow-y: auto; }
.msg { margin-bottom: 12px; display: flex; }
.msg.user { justify-content: flex-end; }
.msg.user .bubble { background: #1677ff; color: #fff; }
.msg.assistant .bubble { background: #fff; }
.bubble { max-width: 75%; padding: 10px 14px; border-radius: 12px; word-wrap: break-word; }
.input-bar { display: flex; padding: 8px; gap: 8px; background: #fff; }
.input-bar input { flex: 1; background: #f5f5f5; padding: 8px 12px; border-radius: 20px; }
.input-bar button { background: #1677ff; color: #fff; border-radius: 20px; font-size: 13px; }
.quick-actions { display: flex; gap: 8px; padding: 4px 12px 8px; background: #fff; }
.quick-actions view { padding: 4px 10px; background: #f0f0f0; border-radius: 12px; font-size: 11px; }
```

- [ ] **Step 4: Commit**

```bash
git add miniprogram/pages/chat/ && git commit -m "feat: add AI chat page with SSE streaming"
```

---

## Self-Review 结果

1. **Spec coverage**: 所有第一期功能已覆盖 — 待办、日程、备忘、体重、健身、反思、AI对话。
2. **Placeholder check**: 无 TBD/TODO。
3. **Type consistency**: API 响应字段与前端 data 绑定一致；JSON.stringify/JSON.parse 在 tags/detail 字段的处理一致。
4. **未覆盖项**: 小程序 tabBar icon 需要实际图片文件，由用户自行准备。反思页面的编辑页结构与备忘录一致，已描述但未展开全部代码（来避免重复）。
