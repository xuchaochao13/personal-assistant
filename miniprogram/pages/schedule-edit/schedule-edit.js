const api = require('../../utils/api');

Page({
  data: {
    id: null, title: '', description: '',
    start_date: '', start_time: '', end_date: '', end_time: '',
    isEdit: false,
  },

  onLoad(opts) {
    if (opts.id) {
      this.setData({ id: opts.id, isEdit: true });
      api.get('/schedules', {}).then(list => {
        const s = list.find(s => s.id == opts.id);
        if (s) this.setData(this._parseDates(s));
      });
    }
  },

  _parseDates(s) {
    const data = {
      title: s.title,
      description: s.description || '',
    };
    if (s.start_time) {
      data.start_date = s.start_time.slice(0, 10);
      data.start_time = s.start_time.slice(11, 16);
    }
    if (s.end_time) {
      data.end_date = s.end_time.slice(0, 10);
      data.end_time = s.end_time.slice(11, 16);
    }
    return data;
  },

  _buildStartTime() {
    const d = this.data.start_date;
    const t = this.data.start_time;
    return d && t ? `${d} ${t}:00` : d || t;
  },

  _buildEndTime() {
    const d = this.data.end_date;
    const t = this.data.end_time;
    return d && t ? `${d} ${t}:00` : d || t;
  },

  onInput(e) { this.setData({ [e.currentTarget.dataset.key]: e.detail.value }); },

  onStartDateChange(e) { this.setData({ start_date: e.detail.value }); },
  onStartTimeChange(e) { this.setData({ start_time: e.detail.value }); },
  onEndDateChange(e) { this.setData({ end_date: e.detail.value }); },
  onEndTimeChange(e) { this.setData({ end_time: e.detail.value }); },

  save() {
    const { id, isEdit, title, description } = this.data;
    const start_time = this._buildStartTime();
    const end_time = this._buildEndTime();
    if (!title || !start_time || !end_time) {
      wx.showToast({ title: '标题和时间必填', icon: 'none' });
      return;
    }
    const data = { title, description, start_time, end_time };
    (isEdit ? api.put(`/schedules/${id}`, data) : api.post('/schedules', data))
      .then(() => wx.navigateBack());
  },
});
