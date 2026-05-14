const api = require('../../utils/api');
const { requestAll } = require('../../utils/subscribe');

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

Page({
  data: {
    view: 'day',
    schedules: [],
    currentDate: '',
    today: '',
    weekDays: [],
    monthDays: [],
    monthLabel: '',
    selectedDay: '',
    groupedSchedules: {},
    busyDates: {},
  },

  onShow() {
    const now = new Date();
    const today = this.fmt(now);
    const { view } = this.data;
    if (view === 'week') {
      this.initWeek(now);
    } else if (view === 'month') {
      this.initMonth(now);
    } else {
      if (!this.data.currentDate) {
        this.setData({ today, currentDate: today, selectedDay: today });
      } else {
        this.setData({ today });
      }
    }
    this.load();
    setTimeout(() => { requestAll(); }, 2000);
  },

  fmt(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  },

  /* ---- Week ---- */
  initWeek(d) {
    const start = new Date(d);
    start.setDate(d.getDate() - d.getDay());
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      days.push({
        date: this.fmt(day),
        dayNum: day.getDate(),
        weekday: WEEKDAYS[day.getDay()],
        isToday: this.fmt(day) === this.data.today,
      });
    }
    this.setData({ weekDays: days, selectedDay: days[0].date });
  },

  /* ---- Month ---- */
  initMonth(d) {
    const y = d.getFullYear();
    const m = d.getMonth();
    const firstDay = new Date(y, m, 1);
    const lastDay = new Date(y, m + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDow = firstDay.getDay();
    const today = this.fmt(new Date());

    const label = `${y}年${m + 1}月`;
    const days = [];

    for (let i = 0; i < startDow; i++) {
      days.push({ date: '', dayNum: '', isToday: false, isOtherMonth: true });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const date = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({ date, dayNum: d, isToday: date === today, isOtherMonth: false });
    }
    while (days.length % 7 !== 0) {
      days.push({ date: '', dayNum: '', isToday: false, isOtherMonth: true });
    }

    this.setData({ monthDays: days, monthLabel: label });
  },

  /* ---- Load ---- */
  async load() {
    const { view, selectedDay, weekDays } = this.data;
    try {
      let from, to;
      if (view === 'day') {
        from = selectedDay;
        to = selectedDay;
      } else if (view === 'week') {
        from = weekDays[0].date;
        to = weekDays[6].date;
      } else {
        const ds = this.data.monthDays.filter(d => !d.isOtherMonth);
        from = ds[0].date;
        to = ds[ds.length - 1].date;
      }
      const list = await api.get('/schedules', { from, to });

      if (view === 'month') {
        const busyDates = {};
        list.forEach(s => { busyDates[s.start_time.slice(0, 10)] = true; });
        this.setData({ schedules: list, busyDates });
      } else {
        // group by date
        const grouped = {};
        list.forEach(s => {
          const d = s.start_time.slice(0, 10);
          if (!grouped[d]) grouped[d] = [];
          grouped[d].push(s);
        });
        this.setData({
          schedules: view === 'day' ? (grouped[selectedDay] || []) : list,
          groupedSchedules: grouped,
        });
      }
    } catch {}
  },

  /* ---- View switch ---- */
  switchView(e) {
    const view = e.currentTarget.dataset.view;
    this.setData({ view });
    if (view === 'day') {
      this.setData({ currentDate: this.data.selectedDay });
    } else if (view === 'week') {
      this.initWeek(new Date(this.data.selectedDay));
    } else if (view === 'month') {
      this.initMonth(new Date(this.data.selectedDay));
    }
    this.load();
  },

  /* ---- Day nav ---- */
  prevDay() {
    const d = new Date(this.data.currentDate);
    d.setDate(d.getDate() - 1);
    const date = this.fmt(d);
    this.setData({ currentDate: date, selectedDay: date });
    this.load();
  },

  nextDay() {
    const d = new Date(this.data.currentDate);
    d.setDate(d.getDate() + 1);
    const date = this.fmt(d);
    this.setData({ currentDate: date, selectedDay: date });
    this.load();
  },

  goToday() {
    const today = this.data.today;
    if (this.data.view === 'week') {
      this.initWeek(new Date());
    } else if (this.data.view === 'month') {
      this.initMonth(new Date());
    }
    this.setData({ currentDate: today, selectedDay: today });
    this.load();
  },

  /* ---- Week: select day ---- */
  selectWeekDay(e) {
    const date = e.currentTarget.dataset.date;
    this.setData({ selectedDay: date, currentDate: date, view: 'day' });
    this.load();
  },

  /* ---- Month: select day ---- */
  selectMonthDay(e) {
    const date = e.currentTarget.dataset.date;
    if (!date) return;
    this.setData({ selectedDay: date, currentDate: date, view: 'day' });
    this.load();
  },

  /* ---- Week nav ---- */
  prevWeek() {
    const d = new Date(this.data.weekDays[0].date);
    d.setDate(d.getDate() - 7);
    this.initWeek(d);
    this.load();
  },

  nextWeek() {
    const d = new Date(this.data.weekDays[0].date);
    d.setDate(d.getDate() + 7);
    this.initWeek(d);
    this.load();
  },

  /* ---- Month nav ---- */
  prevMonth() {
    const [y, m] = this.data.monthLabel.replace('年', '-').replace('月', '').split('-').map(Number);
    const d = new Date(y, m - 2, 1);
    this.initMonth(d);
    this.load();
  },

  nextMonth() {
    const [y, m] = this.data.monthLabel.replace('年', '-').replace('月', '').split('-').map(Number);
    const d = new Date(y, m, 1);
    this.initMonth(d);
    this.load();
  },

  /* ---- Navigate ---- */
  goNew() { wx.navigateTo({ url: '/pages/schedule-edit/schedule-edit' }); },

  goEdit(e) {
    wx.navigateTo({ url: `/pages/schedule-edit/schedule-edit?id=${e.currentTarget.dataset.id}` });
  },

  deleteSchedule(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '删除', content: '确定删除吗？',
      success: (res) => {
        if (res.confirm) api.del(`/schedules/${id}`).then(() => this.load());
      },
    });
  },

});
