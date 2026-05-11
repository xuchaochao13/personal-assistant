const { checkLogin } = require('./utils/auth');

App({
  globalData: {
    token: '',
    userInfo: null,
  },

  async onLaunch() {
    const token = checkLogin.call(this);
    if (!token) {
      try {
        const { login } = require('./utils/auth');
        await login();
      } catch {}
    }
  },
});
