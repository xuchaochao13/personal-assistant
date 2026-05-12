const api = require('./api');

let loginPromise = null;

function checkLogin() {
  const token = wx.getStorageSync('token');
  if (token) {
    this.globalData.token = token;
  }
  return token;
}

function login() {
  if (!loginPromise) {
    loginPromise = new Promise((resolve, reject) => {
      wx.login({
        success(res) {
          if (res.code) {
            api.post('/auth/login', { code: res.code }).then(data => {
              const app = getApp();
              app.globalData.token = data.token;
              app.globalData.userInfo = data.user;
              wx.setStorageSync('token', data.token);
              resolve(data);
            }).catch((err) => {
              loginPromise = null;
              reject(err);
            });
          } else {
            loginPromise = null;
            reject(new Error('wx.login failed'));
          }
        },
        fail(err) {
          loginPromise = null;
          reject(err);
        },
      });
    });
  }
  return loginPromise;
}

module.exports = { checkLogin, login };
