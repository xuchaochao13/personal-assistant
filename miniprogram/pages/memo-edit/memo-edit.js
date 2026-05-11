const api = require('../../utils/api');

Page({
  data: { id: null, title: '', content: '', tagsStr: '', isEdit: false },

  onLoad(opts) {
    if (opts.id) {
      this.setData({ id: opts.id, isEdit: true });
      api.get('/memos').then(list => {
        const m = list.find(m => m.id == opts.id);
        if (m) this.setData({ title: m.title, content: m.content, tagsStr: (m.tags || []).join(',') });
      });
    }
  },

  onInput(e) { this.setData({ [e.currentTarget.dataset.key]: e.detail.value }); },

  save() {
    const { id, isEdit, title, content, tagsStr } = this.data;
    if (!title.trim()) { wx.showToast({ title: '标题必填', icon: 'none' }); return; }
    const tags = tagsStr.split(',').map(s => s.trim()).filter(Boolean);
    const data = { title, content, tags };
    (isEdit ? api.put(`/memos/${id}`, data) : api.post('/memos', data))
      .then(() => wx.navigateBack());
  },
});
