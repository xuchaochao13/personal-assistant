const api = require('../../utils/api');
const { requestAll } = require('../../utils/subscribe');
let subscribeAsked = false;

const QUOTES = [
  '认识你自己。— 苏格拉底',
  '我思故我在。— 笛卡尔',
  '存在即合理。— 黑格尔',
  '人是万物的尺度。— 普罗泰戈拉',
  '未经审视的人生不值得过。— 苏格拉底',
  '自由不是想做什么就做什么，而是不想做什么就不做什么。— 康德',
  '上帝死了。— 尼采',
  '凡是杀不死我的，必使我更强大。— 尼采',
  '人生而自由，却无往不在枷锁之中。— 卢梭',
  '知识就是力量。— 培根',
  '存在先于本质。— 萨特',
  '他人即地狱。— 萨特',
  '世界是意志的表象。— 叔本华',
  '幸福就是身体的无痛苦和灵魂的无纷扰。— 伊壁鸠鲁',
  '己所不欲，勿施于人。— 孔子',
  '知之为知之，不知为不知，是知也。— 孔子',
  '道可道，非常道。— 老子',
  '上善若水，水善利万物而不争。— 老子',
  '子非鱼，安知鱼之乐。— 庄子',
  '吾生也有涯，而知也无涯。— 庄子',
  '人是生而自由的，却无往不在枷锁之中。— 卢梭',
  '只有一种英雄主义，就是看清生活的真相之后依然热爱它。— 罗曼·罗兰',
  '人生的意义不在于活了多少年，而在于我们如何度过这些年。— 林肯',
  '不要问你的国家能为你做些什么，问问你能为国家做些什么。— 肯尼迪',
  '想象力比知识更重要。— 爱因斯坦',
  '弱者坐待良机，强者制造时机。— 居里夫人',
  '生活得最有意义的人，并非年岁活得最长的人，而是对生活感受最深的人。— 卢梭',
  '你要知道，没有一个人能完全理解另一个人。— 黑塞',
  '行动是绝望的唯一解药。— 琼·贝兹',
  '不是因为事情难我们不敢做，而是因为我们不敢做事情才难。— 塞涅卡',
];

function randomQuote() {
  return QUOTES[Math.floor(Math.random() * QUOTES.length)];
}

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

  onShow() {
    this.load();
    if (!subscribeAsked) {
      subscribeAsked = true;
      setTimeout(() => { requestAll(); }, 2000);
    }
  },

  async load() {
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const greeting = randomQuote();

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
