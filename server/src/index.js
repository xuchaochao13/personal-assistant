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
