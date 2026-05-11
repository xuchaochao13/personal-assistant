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
