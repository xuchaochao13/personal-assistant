const api = require('../../utils/api');

Page({
  data: {
    greeting: '',
    todayStr: '',
    todoCount: 0,
    scheduleCount: 0,
    latestWeight: '--',
    reflectionCount: 0,
    latestReflection: null,
  },

  onShow() { this.load(); },

  async load() {
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const hour = now.getHours();
    const greeting = hour < 6 ? '夜深了' : hour < 9 ? '早上好' : hour < 12 ? '上午好' : hour < 14 ? '中午好' : hour < 18 ? '下午好' : '晚上好';

    try {
      const [todos, schedules, weightData, reflections] = await Promise.all([
        api.get('/todos'),
        api.get('/schedules', { date: todayStr }),
        api.get('/weight'),
        api.get('/reflections'),
      ]);

      const todoCount = todos.filter(t => !t.completed).length;
      const scheduleCount = schedules.length;
      const latestWeight = weightData.length > 0 ? `${weightData[0].weight}kg` : '--';
      const reflectionCount = reflections.length;
      const latestReflection = reflections.length > 0 ? reflections[reflections.length - 1] : null;

      this.setData({ greeting, todayStr, todoCount, scheduleCount, latestWeight, reflectionCount, latestReflection });
    } catch {
      this.setData({ greeting, todayStr });
    }
  },

  goTodos() { wx.switchTab({ url: '/pages/todos/todos' }); },
  goSchedules() { wx.switchTab({ url: '/pages/schedules/schedules' }); },
  goWeight() { wx.navigateTo({ url: '/pages/weight/weight' }); },
  goReflections() { wx.navigateTo({ url: '/pages/reflections/reflections' }); },
  goMemos() { wx.navigateTo({ url: '/pages/memos/memos' }); },
  goFitness() { wx.navigateTo({ url: '/pages/fitness/fitness' }); },
});
