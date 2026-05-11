const api = require('../../utils/api');
const { login } = require('../../utils/auth');

Page({
  data: { todos: [], filter: 'active', activeCount: 0, doneCount: 0 },

  onShow() { this.load(); },

  async load() {
    try {
      const todos = await api.get(`/todos?status=${this.data.filter}`);
      this.setData({
        todos,
        activeCount: todos.filter(t => !t.completed).length,
        doneCount: todos.filter(t => t.completed).length,
      });
    } catch {}
  },

  setFilter(e) { this.setData({ filter: e.currentTarget.dataset.filter }); this.load(); },

  toggleTodo(e) {
    const { id, completed } = e.currentTarget.dataset;
    api.put(`/todos/${id}`, { completed: completed ? 0 : 1 }).then(() => this.load());
  },

  deleteTodo(e) {
    wx.showModal({
      title: '删除', content: '确定删除吗？',
      success: (res) => { if (res.confirm) api.del(`/todos/${e.currentTarget.dataset.id}`).then(() => this.load()); },
    });
  },

  goEdit(e) { wx.navigateTo({ url: `/pages/todo-edit/todo-edit?id=${e.currentTarget.dataset.id}` }); },
  goNew() { wx.navigateTo({ url: '/pages/todo-edit/todo-edit' }); },
});
