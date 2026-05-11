const express = require('express');
const cors = require('cors');
const { port } = require('./config');
const { initDb } = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

initDb().then(() => {
  app.use('/api/auth', require('./routes/auth'));
  app.use('/api/todos', require('./routes/todos'));
  app.use('/api/schedules', require('./routes/schedules'));
  app.use('/api/memos', require('./routes/memos'));
  app.use('/api/weight', require('./routes/weight'));
  app.use('/api/fitness', require('./routes/fitness'));
  app.use('/api/reflections', require('./routes/reflections'));

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
});
