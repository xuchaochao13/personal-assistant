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
