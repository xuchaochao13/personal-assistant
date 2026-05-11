const { checkLogin } = require('./utils/auth');

App({
  globalData: {
    token: '',
    userInfo: null,
  },

  onLaunch() {
    checkLogin.call(this);
  },
});
