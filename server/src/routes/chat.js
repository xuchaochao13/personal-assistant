const express = require('express');
const router = express.Router();
const { getDb, query, run } = require('../db');
const { authRequired } = require('../middleware/auth');
const { streamChat } = require('../services/ai');

router.use(authRequired);

const TOOLS = [
  {
    type: 'function',
    function: {
      name: 'add_weight',
      description: '记录用户体重。当用户说体重数字或要求记录体重时调用。',
      parameters: {
        type: 'object',
        properties: {
          weight: { type: 'number', description: '体重，单位kg' },
          recorded_at: { type: 'string', description: '日期，格式YYYY-MM-DD，默认今天' },
          note: { type: 'string', description: '备注，可选' },
        },
        required: ['weight', 'recorded_at'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'query_weight',
      description: '查询用户的体重记录和统计数据',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'add_todo',
      description: '创建待办事项',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: '待办标题' },
          priority: { type: 'integer', description: '优先级，1=低 2=中 3=高，默认2', enum: [1, 2, 3] },
          due_date: { type: 'string', description: '截止日期，格式YYYY-MM-DD，可选' },
        },
        required: ['title'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'query_todos',
      description: '查询用户的待办事项列表',
      parameters: {
        type: 'object',
        properties: {
          status: { type: 'string', description: '筛选状态：active=未完成，done=已完成，不传=全部', enum: ['active', 'done'] },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'add_schedule',
      description: '创建日程安排',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: '日程标题' },
          description: { type: 'string', description: '描述，可选' },
          start_time: { type: 'string', description: '开始时间，格式YYYY-MM-DD HH:MM' },
          end_time: { type: 'string', description: '结束时间，格式YYYY-MM-DD HH:MM' },
        },
        required: ['title', 'start_time', 'end_time'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'query_schedules',
      description: '查询用户的日程安排',
      parameters: {
        type: 'object',
        properties: {
          date: { type: 'string', description: '查询日期，格式YYYY-MM-DD，不传=今天' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'add_fitness',
      description: '记录健身/运动',
      parameters: {
        type: 'object',
        properties: {
          type: { type: 'string', description: '运动类型，如跑步、游泳、举铁、瑜伽、骑行等' },
          duration: { type: 'integer', description: '时长，单位分钟' },
          intensity: { type: 'integer', description: '强度，1=轻松 2=中等 3=高强度，默认2', enum: [1, 2, 3] },
          note: { type: 'string', description: '备注，可选' },
        },
        required: ['type', 'duration'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'query_fitness',
      description: '查询用户的健身记录和统计',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'add_memo',
      description: '创建备忘录/笔记',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: '标题' },
          content: { type: 'string', description: '内容，可选' },
        },
        required: ['title'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'query_memos',
      description: '查询用户的备忘录列表',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'add_reflection',
      description: '创建反思/日记记录',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: '标题' },
          content: { type: 'string', description: '内容' },
          mood: { type: 'integer', description: '心情，1=糟糕 2=不太好 3=一般 4=不错 5=很棒，默认3', enum: [1, 2, 3, 4, 5] },
        },
        required: ['title'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'query_reflections',
      description: '查询用户的反思记录',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
];

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function nowStr() {
  const d = new Date();
  return `${todayStr()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
}

function executeTool(openid, name, args) {
  switch (name) {
    case 'add_weight':
      run('INSERT INTO weight_records (user_id, weight, recorded_at, note) VALUES (?, ?, ?, ?)',
        [openid, args.weight, args.recorded_at || todayStr(), args.note || '']);
      return '体重已记录：' + args.weight + 'kg，' + (args.recorded_at || todayStr());

    case 'query_weight': {
      const rows = query('SELECT * FROM weight_records WHERE user_id = ? ORDER BY recorded_at DESC LIMIT 10', [openid]);
      if (rows.length === 0) return '暂无体重记录';
      const list = rows.map(r => `${r.recorded_at}: ${r.weight}kg`).join('\n');
      return `最近体重记录：\n${list}`;
    }

    case 'add_todo':
      run('INSERT INTO todos (user_id, title, priority, due_date) VALUES (?, ?, ?, ?)',
        [openid, args.title, args.priority || 2, args.due_date || null]);
      return '待办已创建：' + args.title;

    case 'query_todos': {
      let sql = 'SELECT * FROM todos WHERE user_id = ?';
      const params = [openid];
      if (args.status === 'active') { sql += ' AND completed = 0'; }
      else if (args.status === 'done') { sql += ' AND completed = 1'; }
      sql += ' ORDER BY priority DESC, created_at DESC';
      const rows = query(sql, params);
      if (rows.length === 0) return '暂无待办事项';
      const list = rows.map(t => `${t.completed ? '✓' : '○'} ${t.title}`).join('\n');
      return `待办列表：\n${list}`;
    }

    case 'add_schedule':
      run('INSERT INTO schedules (user_id, title, description, start_time, end_time) VALUES (?, ?, ?, ?, ?)',
        [openid, args.title, args.description || '', args.start_time, args.end_time]);
      return `日程已创建：${args.title}（${args.start_time} ~ ${args.end_time}）`;

    case 'query_schedules': {
      const date = args.date || todayStr();
      const rows = query('SELECT * FROM schedules WHERE user_id = ? AND start_time LIKE ? ORDER BY start_time ASC',
        [openid, date + '%']);
      if (rows.length === 0) return `${date} 暂无日程安排`;
      const list = rows.map(s => `${s.start_time.slice(11, 16)} ${s.title}`).join('\n');
      return `${date} 日程：\n${list}`;
    }

    case 'add_fitness':
      run('INSERT INTO fitness_records (user_id, type, duration, intensity, note) VALUES (?, ?, ?, ?, ?)',
        [openid, args.type, args.duration, args.intensity || 2, args.note || '']);
      return `健身已记录：${args.type} ${args.duration}分钟`;

    case 'query_fitness': {
      const rows = query('SELECT type, SUM(duration) as total FROM fitness_records WHERE user_id = ? GROUP BY type',
        [openid]);
      if (rows.length === 0) return '暂无健身记录';
      const list = rows.map(r => `${r.type}: ${r.total}分钟`).join('\n');
      return `健身统计：\n${list}`;
    }

    case 'add_memo':
      run('INSERT INTO memos (user_id, title, content) VALUES (?, ?, ?)',
        [openid, args.title, args.content || '']);
      return '备忘录已创建：' + args.title;

    case 'query_memos': {
      const rows = query('SELECT * FROM memos WHERE user_id = ? ORDER BY updated_at DESC LIMIT 10', [openid]);
      if (rows.length === 0) return '暂无备忘录';
      const list = rows.map(m => `• ${m.title}`).join('\n');
      return `备忘录列表：\n${list}`;
    }

    case 'add_reflection':
      run('INSERT INTO reflections (user_id, title, content, mood) VALUES (?, ?, ?, ?)',
        [openid, args.title, args.content || '', args.mood || 3]);
      return '反思已记录：' + args.title;

    case 'query_reflections': {
      const rows = query('SELECT * FROM reflections WHERE user_id = ? ORDER BY created_at DESC LIMIT 10', [openid]);
      if (rows.length === 0) return '暂无反思记录';
      const list = rows.map(r => `• ${r.title}（心情：${r.mood}/5）`).join('\n');
      return `反思列表：\n${list}`;
    }

    default:
      return '未知操作';
  }
}

router.post('/', async (req, res) => {
  try {
    const { session_id: sid, message } = req.body;
    if (!message) return res.status(400).json({ error: '消息不能为空' });

    await getDb();
    const sessionId = sid || `sess_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    run('INSERT INTO chat_history (user_id, session_id, role, content) VALUES (?, ?, ?, ?)',
      [req.user.openid, sessionId, 'user', message]);

    const history = query(
      'SELECT role, content FROM chat_history WHERE user_id = ? AND session_id = ? ORDER BY created_at ASC LIMIT 40',
      [req.user.openid, sessionId]
    );

    const messages = [
      {
        role: 'system',
        content: `你是用户的私人AI助理。当用户要求记录体重、创建待办、安排日程、记录健身、写备忘录或写反思时，你必须调用对应的函数来实际操作，而不是仅仅回复文字。当前日期：${nowStr()}。`,
      },
      ...history.map(h => ({ role: h.role, content: h.content })),
    ];

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    });

    let fullResponse = '';
    let maxRounds = 3;

    while (maxRounds-- > 0) {
      const toolCalls = {};
      let hasToolCall = false;
      let roundResponse = '';

      try {
        for await (const event of streamChat(messages, TOOLS)) {
          if (event.type === 'content') {
            roundResponse += event.content;
            res.write(`data: ${JSON.stringify({ content: event.content })}\n\n`);
          } else if (event.type === 'tool_call') {
            hasToolCall = true;
            const tc = event;

            const idx = tc.index ?? 0;
            if (tc.id && !toolCalls[idx]) {
              toolCalls[idx] = { id: tc.id, name: '', args: '' };
            }
            if (toolCalls[idx]) {
              if (tc.function?.name) toolCalls[idx].name += tc.function.name;
              if (tc.function?.arguments) toolCalls[idx].args += tc.function.arguments;
            }
          }
        }
      } catch (err) {
        console.error('AI stream error:', err.message);
        res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
        break;
      }

      if (!hasToolCall) break;

      // Execute tool calls
      if (roundResponse) fullResponse = roundResponse;
      messages.push({ role: 'assistant', content: roundResponse || null, tool_calls: [] });

      for (const tc of Object.values(toolCalls)) {
        let args = {};
        try { args = JSON.parse(tc.args); } catch {}

        const result = executeTool(req.user.openid, tc.name, args);

        messages[messages.length - 1].tool_calls.push({
          id: tc.id,
          type: 'function',
          function: { name: tc.name, arguments: tc.args },
        });

        messages.push({ role: 'tool', tool_call_id: tc.id, content: result });

        // notify UI about the action
        res.write(`data: ${JSON.stringify({ action: result })}\n\n`);
      }
    }

    if (fullResponse) {
      run('INSERT INTO chat_history (user_id, session_id, role, content) VALUES (?, ?, ?, ?)',
        [req.user.openid, sessionId, 'assistant', fullResponse]);
    }

    res.write(`data: ${JSON.stringify({ session_id: sessionId, done: true })}\n\n`);
    res.end();
  } catch (err) {
    console.error('Chat route error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.get('/sessions', async (req, res) => {
  await getDb();
  const sessions = query(
    `SELECT session_id, MIN(created_at) as created_at,
     (SELECT content FROM chat_history c2 WHERE c2.session_id = c1.session_id ORDER BY created_at DESC LIMIT 1) as last_message
     FROM chat_history c1 WHERE user_id = ? GROUP BY session_id ORDER BY created_at DESC`,
    [req.user.openid]
  );
  res.json(sessions);
});

router.get('/sessions/:id', async (req, res) => {
  await getDb();
  const messages = query(
    'SELECT * FROM chat_history WHERE user_id = ? AND session_id = ? ORDER BY created_at ASC',
    [req.user.openid, req.params.id]
  );
  res.json(messages);
});

router.delete('/sessions/:id', async (req, res) => {
  await getDb();
  run('DELETE FROM chat_history WHERE user_id = ? AND session_id = ?', [req.user.openid, req.params.id]);
  res.json({ success: true });
});

module.exports = router;
