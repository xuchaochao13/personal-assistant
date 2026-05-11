const api = require('../../utils/api');

Page({
  data: { reflections: [] },
  onShow() { this.load(); },
  async load() { try { this.setData({ reflections: await api.get('/reflections') }); } catch {} },
  goEdit(e) { wx.navigateTo({ url: `/pages/reflection-edit/reflection-edit?id=${e.currentTarget.dataset.id}` }); },
  goNew() { wx.navigateTo({ url: '/pages/reflection-edit/reflection-edit' }); },
  deleteReflection(e) {
    wx.showModal({
      title: '删除', content: '确定删除吗？',
      success: (res) => { if (res.confirm) api.del(`/reflections/${e.currentTarget.dataset.id}`).then(() => this.load()); },
    });
  },
});
