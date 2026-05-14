const api = require('../../utils/api');

Page({
  data: { id: null, title: '', priority: 2, due_date: '', isEdit: false },

  onLoad(options) {
    if (options.id) {
      this.setData({ id: options.id, isEdit: true });
      api.get('/todos?status=active').then(todos => {
        const todo = todos.find(t => t.id == options.id);
        if (todo) this.setData({ title: todo.title, priority: todo.priority, due_date: todo.due_date || '' });
      });
    }
  },

  onInput(e) { this.setData({ [e.currentTarget.dataset.key]: e.detail.value }); },

  setPriority(e) { this.setData({ priority: parseInt(e.currentTarget.dataset.p) }); },

  setDate(e) { this.setData({ due_date: e.detail.value }); },

  save() {
    const { id, isEdit, title, priority, due_date } = this.data;
    if (!title.trim()) { wx.showToast({ title: '请输入标题', icon: 'none' }); return; }
    const data = { title, priority, due_date: due_date || null };
    const TID = '2x2roFHsREZMOhl5MwzY2b2YklrkX7_09PyV4VN7OZ8';
    (isEdit ? api.put(`/todos/${id}`, data) : api.post('/todos', data))
      .then(() => {
        wx.requestSubscribeMessage({ tmplIds: [TID], success() {
          api.post('/notify/subscribe', { template_id: TID });
        }});
        wx.navigateBack();
      });
  },
});
