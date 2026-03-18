# Agent 辩论场 - 设计文档

## 1. 项目概述

**项目名称**：Agent 辩论场
**项目类型**：Next.js 全栈 Web 应用
**核心功能**：一个实时辩论平台，用户发起话题，两个 AI Agent 进行实时辩论，用户可以围观、发言、投票、点评
**目标用户**：对辩论感兴趣的用户，想体验 AI 人格化对话的用户

## 2. 赛道对齐

- **赛道**：Agent 的第三空间 - 圆桌会谈
- **核心价值**：人格化 Agent，让用户选择自己喜欢的"辩手"风格

## 3. 功能列表

### 3.1 核心功能

| 功能 | 描述 | 优先级 |
|------|------|--------|
| 发起辩论 | 用户输入话题，创建一场辩论 | P0 |
| 自动分配人格 | 根据话题，AI 自动生成两个对立人格的 Agent | P0 |
| 实时辩论 | 两个 Agent 实时轮流发言，展示在界面上 | P0 |
| 围观模式 | 其他用户可以加入围观辩论 | P1 |
| 用户发言 | 用户可以随时插入自己的观点 | P1 |
| 投票功能 | 用户可以为正方或反方投票 | P1 |
| 结束点评 | 辩论结束后，用户可以发表点评 | P1 |

### 3.2 用户流程

```
1. 首页 → 点击"发起辩论"
2. 输入话题 → 点击"开始"
3. 系统分配人格 → 显示正方/反方 Agent 简介
4. 辩论进行中 → 实时显示双方发言
5. 用户可随时发言、投票
6. 点击"结束辩论" → 用户点评
7. 点评展示
```

## 4. 技术架构

### 4.1 技术栈

- **框架**：Next.js 14+ (App Router)
- **语言**：TypeScript
- **样式**：Tailwind CSS
- **数据库**：Prisma + PostgreSQL (Vercel Postgres)
- **部署**：Vercel
- **认证**：SecondMe OAuth2

### 4.2 数据模型

```
User
├── id
├── secondmeUserId
├── accessToken / refreshToken
└── nickname / avatar

Debate (辩论场)
├── id
├── topic (话题)
├── status (pending/running/ended)
├── positivePersona (正方人格描述)
├── negativePersona (反方人格描述)
├── createdBy (创建者)
└── createdAt

DebateMessage (辩论消息)
├── id
├── debateId
├── role (positive/negative/user)
├── content
└── createdAt

DebateVote (投票)
├── id
├── debateId
├── voterId
├── side (positive/negative)
└── createdAt

DebateComment (点评)
├── id
├── debateId
├── userId
├── content
└── createdAt
```

### 4.3 API 设计

| 端点 | 方法 | 描述 |
|------|------|------|
| `/api/debate` | POST | 创建辩论 |
| `/api/debate/[id]` | GET | 获取辩论详情和消息 |
| `/api/debate/[id]/message` | POST | 用户发送消息 |
| `/api/debate/[id]/vote` | POST | 投票 |
| `/api/debate/[id]/end` | POST | 结束辩论 |
| `/api/debate/[id]/comment` | POST | 发送点评 |

### 4.4 实时辩论实现

使用 Server-Sent Events (SSE) 实现实时辩论：

1. 用户发起辩论 → 创建 Debate 记录
2. 调用 SecondMe Act API 获取正方人格定义
3. 调用 SecondMe Act API 获取反方人格定义
4. 双方轮流生成回复，通过 SSE 推送到前端

## 5. UI/UX 设计方向

### 5.1 页面结构

```
首页
├── 已登录
│   ├── 我的辩论历史
│   ├── 发起新辩论按钮
│   └── 热门辩论列表
└── 未登录
    └── 登录按钮

辩论页面
├── 顶部：话题显示
├── 中间：辩论区域（双方消息流）
├── 右侧：投票面板
└── 底部：输入框（发言/投票）
```

### 5.2 设计风格

- **亮色主题**：浅色背景，深色文字
- **简约优雅**：减少视觉噪音
- **中文界面**：所有用户可见文字使用中文
- **响应式**：适配桌面和移动端

## 6. 依赖 SecondMe 能力

- **OAuth2 认证**：用户登录
- **Act API**：生成人格定义、结构化 JSON 输出
- **Chat API**：生成辩论内容（流式）

## 7. 部署

- **平台**：Vercel
- **数据库**：Vercel Postgres
- **环境变量**：
  - `SECONDME_CLIENT_ID`
  - `SECONDME_CLIENT_SECRET`
  - `SECONDME_REDIRECT_URI`
  - `DATABASE_URL`
  - SecondMe API 相关配置
