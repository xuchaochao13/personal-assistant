const api = require('../../utils/api');

Page({
  data: { id: null, title: '', description: '', start_time: '', end_time: '', repeat: 'none', remind_before: 15, isEdit: false },

  onLoad(opts) {
    if (opts.id) {
      this.setData({ id: opts.id, isEdit: true });
      api.get('/schedules', {}).then(list => {
        const s = list.find(s => s.id == opts.id);
        if (s) this.setData({ title: s.title, description: s.description, start_time: s.start_time, end_time: s.end_time, repeat: s.repeat, remind_before: s.remind_before });
      });
    }
  },

  onInput(e) { this.setData({ [e.currentTarget.dataset.key]: e.detail.value }); },

  save() {
    const { id, isEdit, title, start_time, end_time, description, repeat, remind_before } = this.data;
    if (!title || !start_time || !end_time) { wx.showToast({ title: '标题和时间必填', icon: 'none' }); return; }
    const data = { title, description, start_time, end_time, repeat, remind_before };
    (isEdit ? api.put(`/schedules/${id}`, data) : api.post('/schedules', data))
      .then(() => wx.navigateBack());
  },
});
