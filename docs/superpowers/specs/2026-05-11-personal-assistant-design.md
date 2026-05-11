# 个人AI私人助理 设计规格

## 概述

个人AI私人助理，通过微信小程序使用，帮助用户管理效率事务（待办、日程、备忘）和个人提升（体重、健身、反思），并提供AI对话/知识问答能力。使用家庭/朋友小范围使用。

## 技术选型

| 层 | 选型 | 说明 |
|---|---|---|
| 前端 | 微信原生小程序 + WeUI | 无需额外框架 |
| 后端 | Node.js + Express | 轻量、生态好 |
| 数据库 | SQLite (better-sqlite3) | 单文件、免运维 |
| AI 模型 | DeepSeek API | 性价比高，兼容OpenAI格式 |
| 认证 | 微信登录(wx.login) + JWT | 微信生态标准方案 |
| 部署 | 单台轻量云服务器 + Nginx 反代 | 2C4G，HTTPS |

## 项目结构

```
personal-assistant/
├── server/                # Node.js 后端
│   ├── src/
│   │   ├── routes/        # API 路由
│   │   ├── services/      # 业务逻辑
│   │   ├── models/        # 数据库模型
│   │   └── config/        # 配置（API Key等）
│   ├── data/              # SQLite 数据库文件
│   └── package.json
├── miniprogram/           # 微信小程序
│   ├── pages/
│   ├── components/
│   ├── utils/
│   ├── app.js / app.json / app.wxss
│   └── project.config.json
└── docs/
```

## 数据库表

### users
| 列 | 类型 | 说明 |
|---|---|---|
| id | TEXT PK | 微信 openid |
| nickname | TEXT | 昵称 |
| avatar | TEXT | 头像URL |
| created_at | DATETIME | |
| updated_at | DATETIME | |

### todos
| 列 | 类型 | 说明 |
|---|---|---|
| id | INTEGER PK | |
| user_id | TEXT FK | |
| title | TEXT | |
| completed | INTEGER | 0/1 |
| priority | INTEGER | 1-3 (低/中/高) |
| due_date | TEXT | YYYY-MM-DD |
| created_at | DATETIME | |
| updated_at | DATETIME | |

### schedules
| 列 | 类型 | 说明 |
|---|---|---|
| id | INTEGER PK | |
| user_id | TEXT FK | |
| title | TEXT | |
| description | TEXT | |
| start_time | DATETIME | |
| end_time | DATETIME | |
| repeat | TEXT | none/daily/weekly/monthly |
| remind_before | INTEGER | 提前分钟数 |
| created_at | DATETIME | |
| updated_at | DATETIME | |

### memos
| 列 | 类型 | 说明 |
|---|---|---|
| id | INTEGER PK | |
| user_id | TEXT FK | |
| title | TEXT | |
| content | TEXT | |
| tags | TEXT | JSON数组 |
| created_at | DATETIME | |
| updated_at | DATETIME | |

### weight_records
| 列 | 类型 | 说明 |
|---|---|---|
| id | INTEGER PK | |
| user_id | TEXT FK | |
| weight | REAL | kg |
| recorded_at | DATE | YYYY-MM-DD |
| note | TEXT | |
| created_at | DATETIME | |

### fitness_records
| 列 | 类型 | 说明 |
|---|---|---|
| id | INTEGER PK | |
| user_id | TEXT FK | |
| type | TEXT | 运动类型 |
| duration | INTEGER | 分钟 |
| intensity | INTEGER | 1-3 |
| detail | TEXT | JSON: 组数/次数/距离等 |
| note | TEXT | |
| created_at | DATETIME | 即记录日期 |

### reflections
| 列 | 类型 | 说明 |
|---|---|---|
| id | INTEGER PK | |
| user_id | TEXT FK | |
| title | TEXT | |
| content | TEXT | |
| mood | INTEGER | 1-5 |
| tags | TEXT | JSON数组 |
| created_at | DATETIME | |
| updated_at | DATETIME | |

### chat_history
| 列 | 类型 | 说明 |
|---|---|---|
| id | INTEGER PK | |
| user_id | TEXT FK | |
| session_id | TEXT | |
| role | TEXT | user/assistant |
| content | TEXT | |
| created_at | DATETIME | |

## API 路由

### 认证
- `POST /api/auth/login` — 微信code换JWT token
- `GET  /api/auth/profile` — 获取用户信息

### 待办
- `GET    /api/todos` — 列表 (?status=active|done)
- `POST   /api/todos` — 创建
- `PUT    /api/todos/:id` — 更新
- `DELETE /api/todos/:id` — 删除

### 日程
- `GET    /api/schedules` — 列表 (?date=YYYY-MM-DD)
- `POST   /api/schedules` — 创建
- `PUT    /api/schedules/:id` — 更新
- `DELETE /api/schedules/:id` — 删除

### 备忘录
- `GET    /api/memos` — 列表
- `POST   /api/memos` — 创建
- `PUT    /api/memos/:id` — 更新
- `DELETE /api/memos/:id` — 删除

### 体重
- `GET    /api/weight` — 历史 (?from=&to=)
- `POST   /api/weight` — 记录
- `GET    /api/weight/stats` — 统计(趋势/平均)
- `DELETE /api/weight/:id`

### 健身
- `GET    /api/fitness` — 历史 (?type=&from=&to=)
- `POST   /api/fitness` — 记录
- `GET    /api/fitness/stats` — 统计
- `DELETE /api/fitness/:id`

### 反思
- `GET    /api/reflections` — 列表 (?tag=&from=&to=)
- `POST   /api/reflections` — 创建
- `GET    /api/reflections/:id` — 详情
- `PUT    /api/reflections/:id` — 修改
- `DELETE /api/reflections/:id`

### AI对话
- `POST   /api/chat` — 发起对话 (SSE流式返回)
- `GET    /api/chat/sessions` — 会话列表
- `GET    /api/chat/sessions/:id` — 历史消息
- `DELETE /api/chat/sessions/:id` — 删除会话

## 小程序页面结构

### 底部导航 (4个Tab)

```
Tab 1: 待办 — 待办列表 / 新建编辑
Tab 2: 日程 — 日历视图(月/周) / 新建编辑
Tab 3: 记录 — 模块入口 / 备忘/体重/健身/反思各自的列表与编辑
Tab 4: AI   — 会话列表 / 对话页(流式输出)
```

### 关键技术细节
- **图表**：ECharts 微信小程序版（体重趋势图）
- **日历**：微信小程序日历插件
- **流式读取**：wx.request + enableChunked
- **认证**：token 存 wx.storage，请求头带 Authorization
- **提醒**：小程序订阅消息

## 认证流程

```
小程序端 wx.login() → 后端拿code换openid → 查/建用户 → 签发JWT
后续请求 header: Authorization: Bearer <token>
```

## AI 对话流程

```
用户发消息 → POST /api/chat (SSE)
  → 后端拼接对话上下文
  → 调用 DeepSeek API (stream: true)
  → SSE 转发给小程序
  → 完成后存储 chat_history
```

快捷入口：「总结今日待办」「回顾本周」「给我建议」从本地数据拼成 prompt 发给 AI。

## 分阶段实施

### 第一期（核心功能）
待办事项、日程管理、备忘录、体重管理、健身记录、反思记录、AI 对话

### 第二期（习惯养成）
习惯打卡（自定义习惯、每日打卡、日历热力图）、阅读/学习记录

### 第三期（目标系统）
目标追踪（设定目标、关联数据、进度回顾）

## 部署

- 云服务器：2C4G，Nginx 反代 + Let's Encrypt SSL
- 数据库：服务器本地 SQLite 文件，定期备份到云存储
- 微信小程序：需已备案域名、HTTPS、小程序 AppID 和 AppSecret
