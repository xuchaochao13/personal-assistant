const api = require('../../utils/api');

Page({
  data: { records: [], stats: {}, showForm: false, type: '', duration: '', intensity: 2, detail: '', note: '' },

  onShow() { this.load(); },

  async load() {
    try {
      const [records, stats] = await Promise.all([api.get('/fitness'), api.get('/fitness/stats')]);
      this.setData({ records, stats });
    } catch {}
  },

  showAdd() { this.setData({ showForm: true, type: '', duration: '', note: '' }); },
  hideForm() { this.setData({ showForm: false }); },

  onInput(e) { this.setData({ [e.currentTarget.dataset.key]: e.detail.value }); },

  save() {
    const { type, duration, intensity, detail, note } = this.data;
    if (!type || !duration) { wx.showToast({ title: '填写完整', icon: 'none' }); return; }
    let detailObj = {};
    try { detailObj = JSON.parse(detail || '{}'); } catch {}
    api.post('/fitness', { type, duration: parseInt(duration), intensity, detail: detailObj, note })
      .then(() => { this.hideForm(); this.load(); });
  },

  del(e) {
    wx.showModal({
      title: '删除', content: '确定删除？',
      success: (res) => { if (res.confirm) api.del(`/fitness/${e.currentTarget.dataset.id}`).then(() => this.load()); },
    });
  },
});
