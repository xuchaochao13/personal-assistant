require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3000,
  jwtSecret: process.env.JWT_SECRET || 'dev-secret',
  deepseekApiKey: process.env.DEEPSEEK_API_KEY,
  deepseekBaseUrl: (process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com').trim().replace(/\/+$/, ''),
  wechatAppId: process.env.WECHAT_APPID,
  wechatSecret: process.env.WECHAT_SECRET,
  dbPath: process.env.DB_PATH || './data/app.db',
};
