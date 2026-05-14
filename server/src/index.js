const express = require('express');
const cors = require('cors');
const { port } = require('./config');
const { initDb, getDb, query, run } = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

function startScheduler() {
  const { sendScheduleReminder, sendTodoReminder } = require('./services/notify');

  async function tick() {
    try {
      await getDb();
      const now = new Date();
      const nowStr = now.toISOString().slice(0, 16).replace('T', ' ');
      const todayStr = now.toISOString().slice(0, 10);

      // Remind schedules starting in the next 15 minutes (check remind_before)
      const schedules = query(
        `SELECT s.*, sub.user_id as sub_user FROM schedules s
         INNER JOIN message_subscriptions sub ON s.user_id = sub.user_id
         AND sub.template_id = 'FsdXYQZpHgn-5BnaSq51gVvsikFniEnQE_lBpntTNe0'
         WHERE s.start_time LIKE ? AND s.remind_before > 0
         AND NOT EXISTS (SELECT 1 FROM sent_notifications n
           WHERE n.user_id = s.user_id AND n.type = 'schedule' AND n.ref_id = s.id)`,
        [todayStr + '%']
      );

      for (const s of schedules) {
        const schTime = new Date(s.start_time.replace(' ', 'T') + (s.start_time.includes('Z') ? '' : ':00'));
        const remindAt = new Date(schTime.getTime() - s.remind_before * 60000);
        if (now >= remindAt && now < schTime) {
          try {
            await sendScheduleReminder(s.user_id, s);
            run('INSERT INTO sent_notifications (user_id, type, ref_id, template_id) VALUES (?, ?, ?, ?)',
              [s.user_id, 'schedule', s.id, 'FsdXYQZpHgn-5BnaSq51gVvsikFniEnQE_lBpntTNe0']);
            console.log('Schedule reminder sent:', s.title);
          } catch (e) {
            console.error('Schedule reminder failed:', e.message);
          }
        }
      }

      // Daily todo reminder (8am)
      const hour = now.getHours();
      if (hour === 8) {
        const todos = query(
          `SELECT t.* FROM todos t
           INNER JOIN message_subscriptions sub ON t.user_id = sub.user_id
           AND sub.template_id = '2x2roFHsREZMOhl5MwzY2b2YklrkX7_09PyV4VN7OZ8'
           WHERE t.completed = 0 AND t.due_date = ?
           AND NOT EXISTS (SELECT 1 FROM sent_notifications n
             WHERE n.user_id = t.user_id AND n.type = 'todo' AND n.ref_id = t.id)`,
          [todayStr]
        );

        for (const t of todos) {
          try {
            await sendTodoReminder(t.user_id, t);
            run('INSERT INTO sent_notifications (user_id, type, ref_id, template_id) VALUES (?, ?, ?, ?)',
              [t.user_id, 'todo', t.id, '2x2roFHsREZMOhl5MwzY2b2YklrkX7_09PyV4VN7OZ8']);
          } catch (e) {
            console.error('Todo reminder failed:', e.message);
          }
        }
      }
    } catch (e) {
      console.error('Scheduler tick error:', e.message);
    }
  }

  tick();
  setInterval(tick, 60000);
}

initDb().then(() => {
  app.use('/api/auth', require('./routes/auth'));
  app.use('/api/todos', require('./routes/todos'));
  app.use('/api/schedules', require('./routes/schedules'));
  app.use('/api/memos', require('./routes/memos'));
  app.use('/api/weight', require('./routes/weight'));
  app.use('/api/fitness', require('./routes/fitness'));
  app.use('/api/reflections', require('./routes/reflections'));
  app.use('/api/chat', require('./routes/chat'));
  app.use('/api/notify', require('./routes/notify'));

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
    startScheduler();
  });
});
