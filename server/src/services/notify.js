const https = require('https');
const { wechatAppId, wechatSecret } = require('../config');

const TEMPLATE_IDS = {
  schedule: 'FsdXYQZpHgn-5BnaSq51gVvsikFniEnQE_lBpntTNe0',
  todo: '2x2roFHsREZMOhl5MwzY2b2YklrkX7_09PyV4VN7OZ8',
};

let accessToken = null;
let tokenExpiresAt = 0;

async function getAccessToken() {
  if (accessToken && Date.now() < tokenExpiresAt - 60000) {
    return accessToken;
  }

  return new Promise((resolve, reject) => {
    const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${wechatAppId}&secret=${wechatSecret}`;
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.access_token) {
            accessToken = json.access_token;
            tokenExpiresAt = Date.now() + (json.expires_in || 7200) * 1000;
            resolve(accessToken);
          } else {
            reject(new Error(`Token error: ${data}`));
          }
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

function sendSubscribeMessage(openid, templateId, data) {
  return new Promise((resolve, reject) => {
    getAccessToken().then((token) => {
      const body = JSON.stringify({
        touser: openid,
        template_id: templateId,
        data,
      });

      const url = new URL(`https://api.weixin.qq.com/cgi-bin/message/subscribe/send?access_token=${token}`);
      const req = https.request({
        hostname: url.hostname,
        path: url.pathname + url.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
        },
      }, (res) => {
        let d = '';
        res.on('data', (chunk) => { d += chunk; });
        res.on('end', () => {
          const json = JSON.parse(d);
          if (json.errcode === 0) {
            resolve(true);
          } else {
            console.error('Subscribe message failed:', d);
            reject(new Error(`Send failed: ${json.errmsg || d}`));
          }
        });
      });
      req.on('error', reject);
      req.write(body);
      req.end();
    }).catch(reject);
  });
}

function buildValue(v) {
  return { value: String(v) };
}

async function sendScheduleReminder(openid, schedule) {
  return sendSubscribeMessage(openid, TEMPLATE_IDS.schedule, {
    thing1: buildValue(schedule.title),
    date4: buildValue(schedule.start_time),
    thing6: buildValue(schedule.description || '无'),
  });
}

async function sendTodoReminder(openid, todo) {
  return sendSubscribeMessage(openid, TEMPLATE_IDS.todo, {
    thing8: buildValue(todo.title),
    date3: buildValue(todo.due_date || '待定'),
  });
}

module.exports = { sendScheduleReminder, sendTodoReminder, TEMPLATE_IDS };
