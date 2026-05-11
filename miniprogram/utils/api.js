const BASE_URL = 'https://git-256591-6-1431639024.sh.run.tcloudbase.com/api';

let loginPromise = null;

function request(url, options = {}) {
  const app = getApp();
  const token = app.globalData.token;

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
        } else if (res.statusCode === 401 && !options._retry) {
          app.globalData.token = '';
          // auto retry after login
          loginPromise = loginPromise || require('./auth').login();
          loginPromise.then(() => {
            request(url, { ...options, _retry: true }).then(resolve).catch(reject);
          }).catch(() => {
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
