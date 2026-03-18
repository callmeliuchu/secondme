# Agent 辩论场 - 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现一个实时辩论平台，用户发起话题，两个 AI Agent 进行实时辩论，用户可以围观、发言、投票、点评

**Architecture:** 使用 Next.js App Router + Prisma + PostgreSQL，前端通过 SSE 获取实时辩论消息

**Tech Stack:** Next.js 14+, TypeScript, Tailwind CSS, Prisma, PostgreSQL, Server-Sent Events (SSE)

---

## 文件结构

```
src/
├── app/
│   ├── page.tsx                    # 首页（辩论列表）
│   ├── debate/
│   │   └── [id]/
│   │       └── page.tsx            # 辩论详情页
│   └── api/
│       └── debate/
│           ├── route.ts            # POST 创建辩论, GET 辩论列表
│           └── [id]/
│               ├── route.ts        # GET 辩论详情
│               ├── join/route.ts   # POST 围观者加入
│               ├── stream/route.ts  # GET SSE 实时辩论
│               ├── message/route.ts # POST 用户发言
│               ├── vote/route.ts    # POST 投票
│               ├── end/route.ts     # POST 结束辩论
│               └── comment/route.ts # POST 点评
├── components/
│   ├── DebateCard.tsx              # 辩论卡片组件
│   ├── DebateList.tsx              # 辩论列表组件
│   ├── DebateMessage.tsx           # 辩论消息组件
│   ├── DebatePanel.tsx             # 辩论面板（双方消息流）
│   ├── VotePanel.tsx              # 投票面板
│   ├── CreateDebateForm.tsx        # 创建辩论表单
│   └── PersonaCard.tsx             # 人格卡片组件
└── lib/
    ├── debate.ts                   # 辩论相关工具函数
    └── persona.ts                  # 人格生成工具
```

---

## 实现任务

### Task 1: 更新 Prisma Schema

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: 添加 Debate 相关数据模型**

```prisma
model Debate {
  id              String    @id @default(cuid())
  topic           String
  status          String    @default("pending") // pending/running/ended
  positivePersona String    @map("positive_persona")
  negativePersona String    @map("negative_persona")
  createdBy       String    @map("created_by")
  roundCount      Int       @default(0) @map("round_count")
  endedAt         DateTime? @map("ended_at")
  endedBy         String?   @map("ended_by")
  createdAt      DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")

  messages      DebateMessage[]
  votes        DebateVote[]
  comments     DebateComment[]
  participants DebateParticipant[]

  @@map("debates")
}

model DebateMessage {
  id         String   @id @default(cuid())
  debateId   String   @map("debate_id")
  debate     Debate   @relation(fields: [debateId], references: [id], onDelete: Cascade)
  role       String   // positive/negative/user
  content    String
  tokensUsed Int?     @map("tokens_used")
  createdAt  DateTime @default(now()) @map("created_at")

  @@map("debate_messages")
}

model DebateVote {
  id        String   @id @default(cuid())
  debateId  String   @map("debate_id")
  debate    Debate   @relation(fields: [debateId], references: [id], onDelete: Cascade)
  voterId   String   @map("voter_id")
  side      String   // positive/negative
  createdAt DateTime @default(now()) @map("created_at")

  @@unique([debateId, voterId])
  @@map("debate_votes")
}

model DebateComment {
  id        String   @id @default(cuid())
  debateId  String   @map("debate_id")
  debate    Debate   @relation(fields: [debateId], references: [id], onDelete: Cascade)
  userId    String   @map("user_id")
  content   String
  createdAt DateTime @default(now()) @map("created_at")

  @@map("debate_comments")
}

model DebateParticipant {
  id        String   @id @default(cuid())
  debateId  String   @map("debate_id")
  debate    Debate   @relation(fields: [debateId], references: [id], onDelete: Cascade)
  userId    String   @map("user_id")
  role      String   @default("audience")
  joinedAt  DateTime @default(now()) @map("joined_at")

  @@unique([debateId, userId])
  @@map("debate_participants")
}
```

- [ ] **Step 2: 运行 Prisma db push**

Run: `npx prisma db push`
Expected: Database schema updated

- [ ] **Step 3: 提交**

```bash
git add prisma/schema.prisma
git commit -m "feat: 添加辩论相关数据模型"
```

---

### Task 2: 创建辩论相关工具函数

**Files:**
- Create: `src/lib/debate.ts`
- Create: `src/lib/persona.ts`

- [ ] **Step 1: 创建 debate.ts**

```typescript
import { prisma } from './prisma'

export async function createDebate(topic: string, userId: string) {
  return prisma.debate.create({
    data: {
      topic,
      createdBy: userId,
      status: 'pending',
    },
  })
}

export async function getDebateById(id: string) {
  return prisma.debate.findUnique({
    where: { id },
    include: {
      messages: { orderBy: { createdAt: 'asc' } },
      votes: true,
      comments: { orderBy: { createdAt: 'desc' } },
      participants: true,
    },
  })
}

export async function getDebateList(limit = 20, offset = 0) {
  return prisma.debate.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip: offset,
    include: {
      _count: {
        select: { votes: true, participants: true },
      },
    },
  })
}

export async function addDebateMessage(
  debateId: string,
  role: 'positive' | 'negative' | 'user',
  content: string
) {
  return prisma.debateMessage.create({
    data: {
      debateId,
      role,
      content,
    },
  })
}

export async function voteDebate(debateId: string, voterId: string, side: 'positive' | 'negative') {
  return prisma.debateVote.upsert({
    where: {
      debateId_voterId: { debateId, voterId },
    },
    update: { side },
    create: { debateId, voterId, side },
  })
}

export async function updateDebate(id: string, data: { status?: string; positivePersona?: string; negativePersona?: string; roundCount?: number }) {
  return prisma.debate.update({
    where: { id },
    data,
  })
}

export async function endDebate(debateId: string, userId: string) {
  return prisma.debate.update({
    where: { id: debateId },
    data: {
      status: 'ended',
      endedAt: new Date(),
      endedBy: userId,
    },
  })
}

export async function joinDebate(debateId: string, userId: string) {
  return prisma.debateParticipant.upsert({
    where: {
      debateId_userId: { debateId, userId },
    },
    update: {},
    create: { debateId, userId },
  })
}

export async function addComment(debateId: string, userId: string, content: string) {
  return prisma.debateComment.create({
    data: { debateId, userId, content },
  })
}

export async function getVoteCounts(debateId: string) {
  const votes = await prisma.debateVote.findMany({
    where: { debateId },
  })
  return {
    positive: votes.filter((v) => v.side === 'positive').length,
    negative: votes.filter((v) => v.side === 'negative').length,
  }
}
```

- [ ] **Step 2: 创建 persona.ts**

```typescript
// 根据话题生成对立人格
export function generatePersonas(topic: string): {
  positive: string
  negative: string
} {
  // 正方人格 - 理性派
  const positive = `你是一个理性、逻辑严密的辩论选手。你的观点：
- 善于用数据和事实支持论点
- 逻辑清晰，层层递进
- 客观中立，以理服人
- 语气坚定但不傲慢

辩论话题：${topic}

请作为正方发表辩论观点，控制在 100-200 字。`

  // 反方人格 - 情感派
  const negative = `你是一个感性、富有同理心的辩论选手。你的观点：
- 善于从人文角度分析问题
- 关注人的感受和需求
- 语言生动，有感染力
- 亲切友善但立场坚定

辩论话题：${topic}

请作为反方发表辩论观点，控制在 100-200 字。`

  return { positive, negative }
}
```

- [ ] **Step 3: 提交**

```bash
git add src/lib/debate.ts src/lib/persona.ts
git commit -m "feat: 添加辩论和人格生成工具函数"
```

---

### Task 3: 实现辩论 API 端点

**Files:**
- Create: `src/app/api/debate/route.ts`
- Create: `src/app/api/debate/[id]/route.ts`
- Create: `src/app/api/debate/[id]/stream/route.ts`
- Create: `src/app/api/debate/[id]/join/route.ts`
- Create: `src/app/api/debate/[id]/message/route.ts`
- Create: `src/app/api/debate/[id]/vote/route.ts`
- Create: `src/app/api/debate/[id]/end/route.ts`
- Create: `src/app/api/debate/[id]/comment/route.ts`

- [ ] **Step 1: 创建 debate/route.ts**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { createDebate, getDebateList } from '@/lib/debate'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const limit = parseInt(searchParams.get('limit') || '20')
  const offset = parseInt(searchParams.get('offset') || '0')

  const debates = await getDebateList(limit, offset)
  return NextResponse.json({ code: 0, data: debates })
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ code: 401, message: '未登录' }, { status: 401 })
  }

  const { topic } = await request.json()
  if (!topic) {
    return NextResponse.json({ code: 400, message: '请输入辩论话题' }, { status: 400 })
  }

  const debate = await createDebate(topic, user.id)
  return NextResponse.json({ code: 0, data: debate })
}
```

- [ ] **Step 2: 创建 debate/[id]/route.ts**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getDebateById } from '@/lib/debate'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const debate = await getDebateById(id)

  if (!debate) {
    return NextResponse.json({ code: 404, message: '辩论不存在' }, { status: 404 })
  }

  return NextResponse.json({ code: 0, data: debate })
}
```

- [ ] **Step 3: 创建 debate/[id]/stream/route.ts (SSE)**

```typescript
import { NextRequest } from 'next/server'
import { getDebateById, addDebateMessage, updateDebate } from '@/lib/debate'
import { generatePersonas } from '@/lib/persona'
import { getCurrentUser } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const debate = await getDebateById(id)

  if (!debate) {
    return new Response('辩论不存在', { status: 404 })
  }

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      // 如果是 pending 状态，先生成人格并开始辩论
      if (debate.status === 'pending') {
        const personas = generatePersonas(debate.topic)

        // 更新辩论场状态为人格
        await updateDebate(id, {
          status: 'running',
          positivePersona: personas.positive,
          negativePersona: personas.negative,
        })

        // 发送正方人格介绍
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'persona', side: 'positive', content: personas.positive.slice(0, 100) + '...' })}\n\n`)
        )
      }

      // 开始辩论循环 - 正方先发言
      const MAX_ROUNDS = 10 // 最大辩论轮次
      let currentRound = debate.roundCount || 0
      let currentSide: 'positive' | 'negative' = 'positive'

      while (currentRound < MAX_ROUNDS) {
        // 检查辩论是否结束
        const updatedDebate = await getDebateById(id)
        if (updatedDebate?.status === 'ended') {
          controller.enqueue(encoder.encode('data: {"type":"end"}\n\n'))
          break
        }

        // 更新轮次
        currentRound++
        await updateDebate(id, { roundCount: currentRound })

        // 调用 SecondMe API 获取回复
        const persona = currentSide === 'positive' ? debate.positivePersona : debate.negativePersona

        try {
          const response = await fetch(
            `${process.env.SECONDME_API_BASE_URL}/api/secondme/chat/stream`,
            {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${(await getCurrentUser())?.accessToken}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                message: currentSide === 'positive'
                  ? `请发表正方观点（话题：${debate.topic}）`
                  : `请发表反方观点（话题：${debate.topic}）`,
                systemPrompt: persona,
              }),
            }
          )

          if (!response.ok || !response.body) {
            throw new Error('Failed to get AI response')
          }

          let fullContent = ''
          const reader = response.body.getReader()
          const decoder = new TextDecoder()

          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            const chunk = decoder.decode(value)
            fullContent += chunk
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'message', side: currentSide, content: chunk })}\n\n`))
          }

          // 保存消息到数据库
          await addDebateMessage(id, currentSide, fullContent)

        } catch (error) {
          console.error('AI response error:', error)
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', message: 'AI 响应出错' })}\n\n`))
        }

        // 切换到另一方
        currentSide = currentSide === 'positive' ? 'negative' : 'positive'
        currentRound++
      }

      controller.close()
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
```

- [ ] **Step 4: 创建其他 API 端点**

创建 `join`, `message`, `vote`, `end`, `comment` 路由，实现基本 CRUD 功能

- [ ] **Step 5: 提交**

```bash
git add src/app/api/debate/
git commit -m "feat: 实现辩论相关 API 端点"
```

---

### Task 4: 创建前端组件

**Files:**
- Create: `src/components/DebateCard.tsx`
- Create: `src/components/DebateList.tsx`
- Create: `src/components/DebateMessage.tsx`
- Create: `src/components/DebatePanel.tsx`
- Create: `src/components/VotePanel.tsx`
- Create: `src/components/CreateDebateForm.tsx`
- Create: `src/components/PersonaCard.tsx`

- [ ] **Step 1: 创建 DebateCard 组件**

展示单个辩论的卡片，包含话题、状态、投票数等信息

- [ ] **Step 2: 创建 DebateList 组件**

辩论列表组件，包含分页

- [ ] **Step 3: 创建 DebateMessage 组件**

辩论消息组件，根据 role（positive/negative/user）显示不同的样式：
- positive: 蓝色背景，右对齐
- negative: 红色背景，左对齐
- user: 灰色背景，右对齐

```tsx
interface DebateMessageProps {
  role: 'positive' | 'negative' | 'user'
  content: string
}

export function DebateMessage({ role, content }: DebateMessageProps) {
  const styles = {
    positive: 'bg-blue-100 ml-auto',
    negative: 'bg-red-100',
    user: 'bg-gray-100 ml-auto',
  }
  return (
    <div className={`max-w-[70%] p-3 rounded-lg ${styles[role]}`}>
      <p>{content}</p>
    </div>
  )
}
```

- [ ] **Step 2: 创建 DebateList 组件**

辩论列表组件，包含分页

- [ ] **Step 3: 创建 DebatePanel 组件**

辩论消息流组件，使用 SSE 实时更新

- [ ] **Step 4: 创建 VotePanel 组件**

投票面板，实时显示正反方票数

- [ ] **Step 5: 创建 CreateDebateForm 组件**

创建辩论表单，包含话题输入

- [ ] **Step 6: 提交**

```bash
git add src/components/
git commit -m "feat: 添加辩论相关前端组件"
```

---

### Task 5: 创建页面

**Files:**
- Modify: `src/app/page.tsx`
- Create: `src/app/debate/[id]/page.tsx`

- [ ] **Step 1: 更新首页**

显示辩论列表、创建辩论按钮

- [ ] **Step 2: 创建辩论详情页**

辩论页面，包含 DebatePanel、VotePanel、输入框等

- [ ] **Step 3: 提交**

```bash
git add src/app/
git commit -m "feat: 添加辩论页面"
```

---

### Task 6: 部署测试

- [ ] **Step 1: 本地测试**

Run: `npm run dev`
测试创建辩论、实时辩论、投票等功能

- [ ] **Step 2: 构建检查**

Run: `npm run build`

- [ ] **Step 3: 部署到 Vercel**

Run: `vercel --prod`

- [ ] **Step 4: 提交最终代码**

```bash
git add -A
git commit -m "feat: 完成 Agent 辩论场功能"
git tag v2.0.0
git push origin main v2.0.0
```
