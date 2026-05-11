const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { jwtSecret, wechatAppId, wechatSecret } = require('../config');
const { getDb, query, run } = require('../db');
const { authRequired } = require('../middleware/auth');

// 微信登录
router.post('/login', async (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ error: '缺少code' });

  try {
    const wxRes = await fetch(
      `https://api.weixin.qq.com/sns/jscode2session?appid=${wechatAppId}&secret=${wechatSecret}&js_code=${code}&grant_type=authorization_code`
    );
    const wxData = await wxRes.json();
    if (wxData.errcode) {
      return res.status(400).json({ error: '微信登录失败', detail: wxData.errmsg });
    }

    const { openid } = wxData;
    await getDb();

    let user = query('SELECT * FROM users WHERE id = ?', [openid])[0];
    if (!user) {
      run('INSERT INTO users (id) VALUES (?)', [openid]);
      user = { id: openid, nickname: null, avatar: null };
    }

    const token = jwt.sign({ openid, iat: Math.floor(Date.now() / 1000) }, jwtSecret, {
      expiresIn: '30d',
    });

    res.json({ token, user: { id: user.id, nickname: user.nickname, avatar: user.avatar } });
  } catch (err) {
    res.status(500).json({ error: '服务器错误' });
  }
});

// 获取用户信息
router.get('/profile', authRequired, async (req, res) => {
  await getDb();
  const user = query('SELECT id, nickname, avatar, created_at FROM users WHERE id = ?', [req.user.openid])[0];
  res.json(user);
});

// 更新用户信息
router.put('/profile', authRequired, async (req, res) => {
  const { nickname, avatar } = req.body;
  await getDb();
  run('UPDATE users SET nickname = ?, avatar = ?, updated_at = datetime(\'now\') WHERE id = ?',
    [nickname, avatar, req.user.openid]);
  res.json({ success: true });
});

module.exports = router;
