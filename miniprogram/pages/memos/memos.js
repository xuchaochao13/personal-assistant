const api = require('../../utils/api');

Page({
  data: { memos: [] },
  onShow() { this.load(); },
  async load() { try { this.setData({ memos: await api.get('/memos') }); } catch {} },
  goEdit(e) { wx.navigateTo({ url: `/pages/memo-edit/memo-edit?id=${e.currentTarget.dataset.id}` }); },
  goNew() { wx.navigateTo({ url: '/pages/memo-edit/memo-edit' }); },
  deleteMemo(e) {
    wx.showModal({
      title: '删除', content: '确定删除吗？',
      success: (res) => { if (res.confirm) api.del(`/memos/${e.currentTarget.dataset.id}`).then(() => this.load()); },
    });
  },
});
