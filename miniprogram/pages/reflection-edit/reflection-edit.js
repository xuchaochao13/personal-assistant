const api = require('../../utils/api');

Page({
  data: { id: null, title: '', content: '', mood: 3, tagsStr: '', isEdit: false },

  onLoad(opts) {
    if (opts.id) {
      this.setData({ id: opts.id, isEdit: true });
      api.get('/reflections').then(list => {
        const r = list.find(r => r.id == opts.id);
        if (r) this.setData({ title: r.title, content: r.content, mood: r.mood, tagsStr: (r.tags || []).join(',') });
      });
    }
  },

  onInput(e) { this.setData({ [e.currentTarget.dataset.key]: e.detail.value }); },

  setMood(e) { this.setData({ mood: parseInt(e.currentTarget.dataset.m) }); },

  save() {
    const { id, isEdit, title, content, mood, tagsStr } = this.data;
    if (!title.trim()) { wx.showToast({ title: '标题必填', icon: 'none' }); return; }
    const tags = tagsStr.split(',').map(s => s.trim()).filter(Boolean);
    const data = { title, content, mood, tags };
    (isEdit ? api.put(`/reflections/${id}`, data) : api.post('/reflections', data))
      .then(() => wx.navigateBack());
  },
});
