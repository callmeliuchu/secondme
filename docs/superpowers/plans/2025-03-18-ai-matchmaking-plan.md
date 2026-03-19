# AI 相亲大会 - 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现 AI 相亲大会功能，用户创建 AI 分身，系统匹配两个分身进行"相亲"聊天，用户全程围观

**Architecture:** 基于现有 SecondMe 项目扩展，添加 AI 分身管理和相亲匹配功能，使用 SSE 实现实时聊天

**Tech Stack:** Next.js 14+, TypeScript, Tailwind CSS, Prisma, PostgreSQL, Server-Sent Events (SSE)

---

## 文件结构

```
src/
├── app/
│   ├── page.tsx                    # 首页（我的分身 + 发起相亲）
│   ├── agent/
│   │   └── [id]/
│   │       └── page.tsx           # 分身详情页
│   ├── matchmaking/
│   │   └── [id]/
│   │       └── page.tsx           # 相亲房间页
│   └── api/
│       └── agent/
│           ├── route.ts           # GET 分身列表, POST 创建分身
│           └── [id]/
│               └── route.ts       # GET 分身详情
│       └── matchmaking/
│           ├── route.ts           # POST 发起相亲
│           └── [id]/
│               ├── route.ts       # GET 相亲详情
│               └── stream/route.ts # SSE 实时聊天
├── components/
│   ├── AgentCard.tsx              # AI 分身卡片
│   ├── AgentList.tsx              # 分身列表
│   ├── CreateAgentForm.tsx       # 创建分身表单
│   ├── MatchmakingRoom.tsx       # 相亲房间（聊天界面）
│   ├── ChatBubble.tsx           # 聊天气泡
│   └── MatchResult.tsx           # 匹配结果
└── lib/
    ├── agent.ts                   # 分身相关工具函数
    ├── matchmaking.ts             # 相亲匹配工具函数
    └── persona.ts                 # 分身人格生成（可复用）
```

---

## 实现任务

### Task 1: 更新 Prisma Schema

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: 添加 AIAgent 数据模型**

```prisma
model AIAgent {
  id           String   @id @default(cuid())
  userId       String   @map("user_id")
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  name         String
  personality  String
  hobbies      String?
  appearance   String?
  intro        String?
  avatar       String?
  status       String   @default("active")
  createdAt    DateTime @default(now()) @map("created_at")

  sessions    MatchSession[] @relation("Agent1")
  sessions2   MatchSession[] @relation("Agent2")
  messages    ChatMessage[]

  @@map("ai_agents")
}

model MatchSession {
  id          String    @id @default(cuid())
  userId      String    @map("user_id")
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  agent1Id    String    @map("agent1_id")
  agent1      AIAgent   @relation("Agent1", fields: [agent1Id], references: [id], onDelete: Cascade)
  agent2Id    String    @map("agent2_id")
  agent2      AIAgent   @relation("Agent2", fields: [agent2Id], references: [id], onDelete: Cascade)
  status      String    @default("pending") // pending/running/ended
  matchScore  Int?
  createdAt   DateTime  @default(now()) @map("created_at")
  endedAt     DateTime? @map("ended_at")

  messages    ChatMessage[]

  @@map("match_sessions")
}

model ChatMessage {
  id         String   @id @default(cuid())
  sessionId  String   @map("session_id")
  session    MatchSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  agentId    String   @map("agent_id")
  agent      AIAgent  @relation(fields: [agentId], references: [id], onDelete: Cascade)
  content    String
  createdAt DateTime @default(now()) @map("created_at")

  @@map("chat_messages")
}
```

- [ ] **Step 2: 运行 Prisma db push**

Run: `npx prisma db push`
Expected: Database schema updated

- [ ] **Step 3: 提交**

```bash
git add prisma/schema.prisma
git commit -m "feat: 添加 AI 相亲数据模型"
```

---

### Task 2: 创建工具函数

**Files:**
- Create: `src/lib/agent.ts`
- Create: `src/lib/matchmaking.ts`

- [ ] **Step 1: 创建 agent.ts**

```typescript
import { prisma } from './prisma'
import { AIAgent } from '@prisma/client'

export type CreateAgentInput = {
  userId: string
  name: string
  personality: string
  hobbies?: string
  appearance?: string
  intro?: string
}

export async function createAgent(data: CreateAgentInput): Promise<AIAgent> {
  return prisma.aIAgent.create({
    data: {
      userId: data.userId,
      name: data.name,
      personality: data.personality,
      hobbies: data.hobbies || '',
      appearance: data.appearance || '',
      intro: data.intro || '',
    },
  })
}

export async function getAgentById(id: string): Promise<AIAgent | null> {
  return prisma.aIAgent.findUnique({ where: { id } })
}

export async function getUserAgents(userId: string): Promise<AIAgent[]> {
  return prisma.aIAgent.findMany({
    where: { userId, status: 'active' },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getRandomAgent(excludeUserId: string, excludeAgentId?: string): Promise<AIAgent | null> {
  const agents = await prisma.aIAgent.findMany({
    where: {
      userId: { not: excludeUserId },
      id: excludeAgentId ? { not: excludeAgentId } : undefined,
      status: 'active',
    },
    take: 1,
    orderBy: { createdAt: 'desc' },
  })
  return agents[0] || null
}

export async function updateAgent(id: string, data: Partial<CreateAgentInput>): Promise<AIAgent> {
  return prisma.aIAgent.update({
    where: { id },
    data,
  })
}

export async function deleteAgent(id: string): Promise<void> {
  await prisma.aIAgent.update({
    where: { id },
    data: { status: 'inactive' },
  })
}
```

- [ ] **Step 2: 创建 matchmaking.ts**

```typescript
import { prisma } from './prisma'
import { MatchSession, ChatMessage } from '@prisma/client'

export type MatchSessionWithRelations = MatchSession & {
  agent1: { name: string; avatar: string | null; personality: string }
  agent2: { name: string; avatar: string | null; personality: string }
  messages: ChatMessage[]
}

export async function createMatchSession(
  userId: string,
  agent1Id: string,
  agent2Id: string
): Promise<MatchSession> {
  return prisma.matchSession.create({
    data: {
      userId,
      agent1Id,
      agent2Id,
      status: 'pending',
    },
  })
}

export async function getMatchSessionById(id: string): Promise<MatchSessionWithRelations | null> {
  return prisma.matchSession.findUnique({
    where: { id },
    include: {
      agent1: { select: { name: true, avatar: true, personality: true } },
      agent2: { select: { name: true, avatar: true, personality: true } },
      messages: { orderBy: { createdAt: 'asc' } },
    },
  })
}

export async function addChatMessage(
  sessionId: string,
  agentId: string,
  content: string
): Promise<ChatMessage> {
  return prisma.chatMessage.create({
    data: { sessionId, agentId, content },
  })
}

export async function endMatchSession(id: string, matchScore: number): Promise<MatchSession> {
  return prisma.matchSession.update({
    where: { id },
    data: {
      status: 'ended',
      endedAt: new Date(),
      matchScore,
    },
  })
}

export async function getUserMatchSessions(userId: string, limit = 10): Promise<MatchSession[]> {
  return prisma.matchSession.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })
}
```

- [ ] **Step 3: 提交**

```bash
git add src/lib/agent.ts src/lib/matchmaking.ts
git commit -m "feat: 添加 AI 分身和相亲工具函数"
```

---

### Task 3: 实现 API 端点

**Files:**
- Create: `src/app/api/agent/route.ts`
- Create: `src/app/api/agent/[id]/route.ts`
- Create: `src/app/api/matchmaking/route.ts`
- Create: `src/app/api/matchmaking/[id]/route.ts`
- Create: `src/app/api/matchmaking/[id]/stream/route.ts`

- [ ] **Step 1: 创建 agent/route.ts**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { createAgent, getUserAgents } from '@/lib/agent'

export async function GET(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ code: 401, message: '请先登录' }, { status: 401 })
  }

  const agents = await getUserAgents(user.id)
  return NextResponse.json({ code: 0, data: agents })
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ code: 401, message: '请先登录' }, { status: 401 })
  }

  const { name, personality, hobbies, appearance, intro } = await request.json()

  if (!name || !personality) {
    return NextResponse.json({ code: 400, message: '请填写名字和性格' }, { status: 400 })
  }

  const agent = await createAgent({
    userId: user.id,
    name,
    personality,
    hobbies,
    appearance,
    intro,
  })

  return NextResponse.json({ code: 0, data: agent })
}
```

- [ ] **Step 2: 创建 agent/[id]/route.ts**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getAgentById } from '@/lib/agent'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const agent = await getAgentById(id)

  if (!agent) {
    return NextResponse.json({ code: 404, message: '分身不存在' }, { status: 404 })
  }

  return NextResponse.json({ code: 0, data: agent })
}
```

- [ ] **Step 3: 创建 matchmaking/route.ts**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { createMatchSession, getRandomAgent } from '@/lib/agent'
import { getUserAgents } from '@/lib/agent'

export async function POST(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ code: 401, message: '请先登录' }, { status: 401 })
  }

  const { agentId } = await request.json()

  if (!agentId) {
    return NextResponse.json({ code: 400, message: '请选择分身' }, { status: 400 })
  }

  // 验证分身属于当前用户
  const userAgents = await getUserAgents(user.id)
  const selectedAgent = userAgents.find(a => a.id === agentId)

  if (!selectedAgent) {
    return NextResponse.json({ code: 400, message: '无效的分身' }, { status: 400 })
  }

  // 随机匹配另一个分身
  const matchedAgent = await getRandomAgent(user.id, agentId)

  if (!matchedAgent) {
    return NextResponse.json({ code: 404, message: '暂无可匹配的分身，请稍后再试' }, { status: 404 })
  }

  const session = await createMatchSession(user.id, agentId, matchedAgent.id)
  return NextResponse.json({ code: 0, data: session })
}
```

- [ ] **Step 4: 创建 matchmaking/[id]/route.ts**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getMatchSessionById } from '@/lib/matchmaking'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await getMatchSessionById(id)

  if (!session) {
    return NextResponse.json({ code: 404, message: '相亲会话不存在' }, { status: 404 })
  }

  return NextResponse.json({ code: 0, data: session })
}
```

- [ ] **Step 5: 创建 matchmaking/[id]/stream/route.ts**

实现两个 AI 分身的实时聊天，使用 SSE。

- [ ] **Step 6: 提交**

```bash
git add src/app/api/agent/ src/app/api/matchmaking/
git commit -m "feat: 实现 AI 相亲 API 端点"
```

---

### Task 4: 创建前端组件

**Files:**
- Create: `src/components/AgentCard.tsx`
- Create: `src/components/AgentList.tsx`
- Create: `src/components/CreateAgentForm.tsx`
- Create: `src/components/MatchmakingRoom.tsx`
- Create: `src/components/ChatBubble.tsx`
- Create: `src/components/MatchResult.tsx`

- [ ] **Step 1: 创建 AgentCard 组件**

展示单个 AI 分身信息，包含头像、名字、性格标签。

- [ ] **Step 2: 创建 AgentList 组件**

展示用户的分身列表，支持选择发起相亲。

- [ ] **Step 3: 创建 CreateAgentForm 组件**

创建分身的表单，包含名字、性格、爱好等输入。

- [ ] **Step 4: 创建 ChatBubble 组件**

聊天消息气泡组件，左右两侧分别显示两个分身的头像和消息。

- [ ] **Step 5: 创建 MatchmakingRoom 组件**

相亲房间主组件，整合聊天界面和结果展示。

- [ ] **Step 6: 创建 MatchResult 组件**

匹配结果展示，显示匹配度分数和评价。

- [ ] **Step 7: 提交**

```bash
git add src/components/
git commit -m "feat: 添加 AI 相亲前端组件"
```

---

### Task 5: 创建页面

**Files:**
- Modify: `src/app/page.tsx`
- Create: `src/app/agent/[id]/page.tsx`
- Create: `src/app/matchmaking/[id]/page.tsx`

- [ ] **Step 1: 更新首页**

显示我的分身列表、发起相亲按钮。

- [ ] **Step 2: 创建分身详情页**

展示分身详细信息。

- [ ] **Step 3: 创建相亲房间页**

展示两个分身的聊天界面。

- [ ] **Step 4: 提交**

```bash
git add src/app/
git commit -m "feat: 添加 AI 相亲页面"
```

---

### Task 6: 部署测试

- [ ] **Step 1: 本地测试**

Run: `npm run dev`
测试创建分身、发起相亲、实时聊天等功能

- [ ] **Step 2: 构建检查**

Run: `npm run build`

- [ ] **Step 3: 部署到 Vercel**

Run: `vercel --prod`

- [ ] **Step 4: 提交最终代码**

```bash
git add -A
git commit -m "feat: 完成 AI 相亲大会功能"
git tag v3.0.0
git push origin main v3.0.0
```
