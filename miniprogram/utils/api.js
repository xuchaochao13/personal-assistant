const BASE_URL = 'https://git-256591-6-1431639024.sh.run.tcloudbase.com/api';

let loginPromise = null;

function request(url, options = {}) {
  const app = getApp();
  const token = app.globalData.token;
  const maxRetries = options._retryCount || 0;

  return new Promise((resolve, reject) => {
    wx.request({
      url: BASE_URL + url,
      method: options.method || 'GET',
      data: options.data,
      header: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
      },
      success(res) {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data);
        } else if (res.statusCode === 503 && maxRetries < 2) {
          wx.showToast({ title: '服务启动中，自动重试...', icon: 'loading', duration: 5000 });
          setTimeout(() => {
            request(url, { ...options, _retryCount: maxRetries + 1 }).then(resolve).catch(reject);
          }, 5000);
        } else if (res.statusCode === 401 && !options._retry) {
          app.globalData.token = '';
          loginPromise = loginPromise || require('./auth').login();
          loginPromise.then(() => {
            loginPromise = null;
            request(url, { ...options, _retry: true }).then(resolve).catch(reject);
          }).catch(() => {
            loginPromise = null;
            reject(res.data);
          });
        } else {
          reject(res.data);
        }
      },
      fail(err) {
        reject(err);
      },
    });
  });
}

module.exports = {
  BASE_URL,
  get: (url, data) => request(url, { method: 'GET', data }),
  post: (url, data) => request(url, { method: 'POST', data }),
  put: (url, data) => request(url, { method: 'PUT', data }),
  del: (url) => request(url, { method: 'DELETE' }),
};
