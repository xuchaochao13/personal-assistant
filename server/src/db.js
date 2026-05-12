const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');
const { dbPath } = require('./config');

let db;

async function getDb() {
  if (!db) {
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const SQL = await initSqlJs();
    if (fs.existsSync(dbPath)) {
      const buffer = fs.readFileSync(dbPath);
      db = new SQL.Database(buffer);
    } else {
      db = new SQL.Database();
    }
    db.run('PRAGMA foreign_keys = ON');
  }
  return db;
}

function saveDb() {
  if (!db) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(dbPath, buffer);
}

function query(sql, params = []) {
  const stmt = db.prepare(sql);
  if (params.length > 0) stmt.bind(params);
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

function run(sql, params = []) {
  db.run(sql, params);
  const res = db.exec('SELECT last_insert_rowid() as id');
  const lastId = res[0]?.values?.[0]?.[0] || 0;
  saveDb();
  return { changes: db.getRowsModified(), lastInsertRowid: lastId };
}

async function initDb() {
  const database = await getDb();

  const tables = [
    `CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      nickname TEXT,
      avatar TEXT,
      created_at DATETIME DEFAULT (datetime('now')),
      updated_at DATETIME DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS todos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL REFERENCES users(id),
      title TEXT NOT NULL,
      completed INTEGER DEFAULT 0,
      priority INTEGER DEFAULT 2,
      due_date TEXT,
      created_at DATETIME DEFAULT (datetime('now')),
      updated_at DATETIME DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS schedules (
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
    )`,
    `CREATE TABLE IF NOT EXISTS memos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL REFERENCES users(id),
      title TEXT NOT NULL,
      content TEXT DEFAULT '',
      tags TEXT DEFAULT '[]',
      created_at DATETIME DEFAULT (datetime('now')),
      updated_at DATETIME DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS weight_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL REFERENCES users(id),
      weight REAL NOT NULL,
      recorded_at DATE NOT NULL,
      note TEXT DEFAULT '',
      created_at DATETIME DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS fitness_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL REFERENCES users(id),
      type TEXT NOT NULL,
      duration INTEGER NOT NULL,
      intensity INTEGER DEFAULT 2,
      detail TEXT DEFAULT '{}',
      note TEXT DEFAULT '',
      created_at DATETIME DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS reflections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL REFERENCES users(id),
      title TEXT NOT NULL,
      content TEXT DEFAULT '',
      mood INTEGER DEFAULT 3,
      tags TEXT DEFAULT '[]',
      created_at DATETIME DEFAULT (datetime('now')),
      updated_at DATETIME DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS chat_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL REFERENCES users(id),
      session_id TEXT NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT (datetime('now'))
    )`,
  ];

  for (const sql of tables) {
    database.run(sql);
  }

  const indexes = [
    'CREATE INDEX IF NOT EXISTS idx_todos_user ON todos(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_schedules_user ON schedules(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_memos_user ON memos(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_weight_user ON weight_records(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_fitness_user ON fitness_records(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_reflections_user ON reflections(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_chat_session ON chat_history(user_id, session_id)',
  ];

  for (const sql of indexes) {
    database.run(sql);
  }

  saveDb();

  console.log('Database initialized');
}

module.exports = { getDb, saveDb, query, run, initDb };
