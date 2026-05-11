const api = require('../../utils/api');

Page({
  data: { schedules: [], currentDate: '' },

  onShow() {
    const now = new Date();
    this.setData({ currentDate: this.formatDate(now) });
    this.load();
  },

  formatDate(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  },

  async load() {
    try { this.setData({ schedules: await api.get('/schedules', { date: this.data.currentDate }) }); } catch {}
  },

  prevDay() {
    const d = new Date(this.data.currentDate); d.setDate(d.getDate() - 1);
    this.setData({ currentDate: this.formatDate(d) }); this.load();
  },

  nextDay() {
    const d = new Date(this.data.currentDate); d.setDate(d.getDate() + 1);
    this.setData({ currentDate: this.formatDate(d) }); this.load();
  },

  goNew() { wx.navigateTo({ url: '/pages/schedule-edit/schedule-edit' }); },

  goEdit(e) { wx.navigateTo({ url: `/pages/schedule-edit/schedule-edit?id=${e.currentTarget.dataset.id}` }); },

  deleteSchedule(e) {
    wx.showModal({
      title: '删除', content: '确定删除吗？',
      success: (res) => { if (res.confirm) api.del(`/schedules/${e.currentTarget.dataset.id}`).then(() => this.load()); },
    });
  },
});
