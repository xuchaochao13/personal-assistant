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
    try {
      const sid = e.currentTarget.dataset.id;
      const messages = await api.get(`/chat/sessions/${sid}`);
      this.setData({ currentSessionId: sid, messages });
    } catch {}
  },

  newSession() {
    this.setData({ currentSessionId: '', messages: [{ role: 'assistant', content: '你好，我是你的私人助理。有什么可以帮你的？' }] });
  },

  backToSessions() {
    this.setData({ currentSessionId: '', messages: [] });
    this.loadSessions();
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

    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    let hasContent = false;

    const task = wx.request({
      url: api.BASE_URL + '/chat',
      method: 'POST',
      enableChunked: true,
      timeout: 60000,
      header: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getApp().globalData.token}` },
      data: { session_id: currentSessionId || undefined, message: input },
      success: () => {
        this.setData({ streaming: false });
        if (!hasContent) {
          console.log('buffer remaining:', JSON.stringify(buffer));
          const msgs = this.data.messages;
          msgs[msgs.length - 1].content = 'AI 未返回内容，请重试';
          this.setData({ messages: msgs });
        }
        this.loadSessions();
      },
      fail: (err) => {
        console.error('Chat request failed:', err);
        const msgs = this.data.messages;
        const errMsg = err.errMsg || '';
        if (errMsg.includes('timeout')) {
          msgs[msgs.length - 1].content = '请求超时，请检查网络后重试';
        } else if (errMsg.includes('fail')) {
          msgs[msgs.length - 1].content = '网络连接失败，请稍后重试';
        } else {
          msgs[msgs.length - 1].content = '请求失败：' + (errMsg || '未知错误');
        }
        this.setData({ messages: msgs, streaming: false });
      },
    });

    task.onChunkReceived((res) => {
      const raw = res.data;
      const chunk = typeof raw === 'string' ? raw : decoder.decode(raw, { stream: true });
      console.log('chunk received, bytes:', chunk.length, 'preview:', chunk.slice(0, 200));
      buffer += chunk;
      const frames = buffer.split('\n\n');
      buffer = frames.pop() || '';
      console.log('frames to process:', frames.length);
      for (const frame of frames) {
        const line = frame.trim();
        console.log('frame line:', line.slice(0, 120));
        if (!line.startsWith('data: ')) continue;
        try {
          const json = JSON.parse(line.slice(6));
          if (json.content) {
            hasContent = true;
            const msgs = this.data.messages;
            msgs[msgs.length - 1].content += json.content;
            this.setData({ messages: msgs });
          }
          if (json.session_id) {
            this.setData({ currentSessionId: json.session_id });
          }
          if (json.action) {
            const msgs = this.data.messages;
            msgs.push({ role: 'system', content: '✓ ' + json.action });
            msgs.push({ role: 'assistant', content: '' });
            this.setData({ messages: msgs });
          }
          if (json.error) {
            const msgs = this.data.messages;
            msgs[msgs.length - 1].content = '[错误] ' + json.error;
            this.setData({ messages: msgs, streaming: false });
          }
        } catch {}
      }
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
