const api = require('../../utils/api');

Page({
  data: { records: [], stats: {}, showForm: false, weight: '', recorded_at: '', note: '' },

  onShow() { this.load(); },

  async load() {
    try {
      const [records, stats] = await Promise.all([api.get('/weight'), api.get('/weight/stats')]);
      this.setData({ records, stats });
    } catch {}
  },

  showAdd() { this.setData({ showForm: true, weight: '', recorded_at: '', note: '' }); },
  hideForm() { this.setData({ showForm: false }); },

  onInput(e) { this.setData({ [e.currentTarget.dataset.key]: e.detail.value }); },
  setDate(e) { this.setData({ recorded_at: e.detail.value }); },

  save() {
    const { weight, recorded_at, note } = this.data;
    if (!weight || !recorded_at) { wx.showToast({ title: '填写完整', icon: 'none' }); return; }
    api.post('/weight', { weight: parseFloat(weight), recorded_at, note }).then(() => { this.hideForm(); this.load(); });
  },

  del(e) {
    wx.showModal({
      title: '删除', content: '确定删除？',
      success: (res) => { if (res.confirm) api.del(`/weight/${e.currentTarget.dataset.id}`).then(() => this.load()); },
    });
  },
});
