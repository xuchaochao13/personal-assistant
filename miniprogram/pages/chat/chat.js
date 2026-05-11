const api = require('../../utils/api');

Page({
  data: {
    sessions: [],
    messages: [],
    input: '',
    currentSessionId: '',
    streaming: false,
  },

  onShow() { this.loadSessions(); },

  async loadSessions() {
    try { this.setData({ sessions: await api.get('/chat/sessions') }); } catch {}
  },

  async openSession(e) {
    const sid = e.currentTarget.dataset.id;
    const messages = await api.get(`/chat/sessions/${sid}`);
    this.setData({ currentSessionId: sid, messages });
  },

  newSession() {
    this.setData({ currentSessionId: '', messages: [] });
  },

  sendMessage() {
    const { input, currentSessionId, messages } = this.data;
    if (!input.trim() || this.data.streaming) return;

    const userMsg = { role: 'user', content: input };
    const newMessages = [...messages, userMsg];
    this.setData({ messages: newMessages, input: '', streaming: true });

    const aiMsg = { role: 'assistant', content: '' };
    newMessages.push(aiMsg);
    this.setData({ messages: newMessages });

    const task = wx.request({
      url: api.BASE_URL + '/chat',
      method: 'POST',
      enableChunked: true,
      header: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getApp().globalData.token}` },
      data: { session_id: currentSessionId || undefined, message: input },
      success: () => { this.setData({ streaming: false }); this.loadSessions(); },
      fail: () => { this.setData({ streaming: false }); },
    });

    task.onChunkReceived((res) => {
      try {
        const json = JSON.parse(res.data.slice(6));
        if (json.content) {
          const msgs = this.data.messages;
          msgs[msgs.length - 1].content += json.content;
          this.setData({ messages: msgs });
        }
        if (json.session_id) {
          this.setData({ currentSessionId: json.session_id });
        }
      } catch {}
    });
  },

  deleteSession(e) {
    wx.showModal({
      title: '删除会话', content: '确定删除？',
      success: (res) => {
        if (res.confirm) {
          const sid = e.currentTarget.dataset.id;
          api.del(`/chat/sessions/${sid}`).then(() => {
            if (this.data.currentSessionId === sid) {
              this.setData({ currentSessionId: '', messages: [] });
            }
            this.loadSessions();
          });
        }
      },
    });
  },

  quickAction(e) {
    const prompts = {
      summary: '请根据我今日的待办和日程，做一个简要总结',
      review: '请回顾我本周的各项记录，给我一些建议',
      suggest: '请根据我的体重和健身记录，给我一些提升建议',
    };
    this.setData({ input: prompts[e.currentTarget.dataset.key] || '' });
  },

  onInput(e) { this.setData({ input: e.detail.value }); },
});
