# AI 相亲聊天增强功能实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 AI 相亲聊天中增加内心戏浮动卡片、实时匹配度爱心动画、AI 内容分析计算匹配度

**Architecture:**
- 修改 ChatMessage 模型添加 innerThought 字段
- stream API 返回内心戏和匹配度
- MatchmakingRoom 组件渲染浮动内心戏卡片和动态爱心
- 使用 CSS animation 实现爱心跳动效果

**Tech Stack:** Next.js 16, Prisma, SSE, Tailwind CSS

---

## 文件结构

```
src/
├── app/api/matchmaking/[id]/stream/route.ts  # 修改：AI 提示词 + 内心戏 + 匹配度计算
├── components/
│   ├── MatchmakingRoom.tsx                   # 修改：渲染内心戏 + 爱心动画
│   ├── ChatBubble.tsx                        # 修改：添加内心戏渲染
│   └── LoveHearts.tsx                        # 新增：动态爱心组件
└── lib/
    └── matchmaking.ts                        # 修改：类型定义

prisma/
└── schema.prisma                             # 修改：添加 innerThought 字段
```

---

## 任务 1：数据库迁移

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: 修改 ChatMessage 模型**

```prisma
model ChatMessage {
  id           String   @id @default(cuid())
  sessionId    String   @map("session_id")
  session      MatchSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  agentId      String   @map("agent_id")
  agent        AIAgent  @relation(fields: [agentId], references: [id], onDelete: Cascade)
  content      String
  innerThought String?  @map("inner_thought")
  createdAt    DateTime @default(now()) @map("created_at")

  @@map("chat_messages")
}
```

- [ ] **Step 2: 生成本地 Prisma Client**

Run: `npx prisma generate`
Expected: ✔ Generated Prisma Client

- [ ] **Step 3: 推送 schema 到远程数据库**

Run: `npx prisma db push --accept-data-loss`
Expected: Your database is now in sync with your Prisma schema

- [ ] **Step 4: 提交代码**

```bash
git add prisma/schema.prisma
git commit -m "feat: 添加 ChatMessage.innerThought 字段"
```

---

## 任务 2：修改 matchmaking.ts 类型定义

**Files:**
- Modify: `src/lib/matchmaking.ts`

- [ ] **Step 1: 更新类型定义**

```typescript
export type MatchSessionWithRelations = MatchSession & {
  agent1: { name: string; avatar: string | null; personality: string }
  agent2: { name: string; avatar: string | null; personality: string }
  messages: ChatMessage[]
}

export type ChatMessageWithInner = ChatMessage & {
  innerThought?: string | null
}

export async function addChatMessage(
  sessionId: string,
  agentId: string,
  content: string,
  innerThought?: string
): Promise<ChatMessage> {
  return prisma.chatMessage.create({
    data: { sessionId, agentId, content, innerThought },
  })
}
```

- [ ] **Step 2: 提交代码**

```bash
git add src/lib/matchmaking.ts
git commit -m "feat: 更新 matchmaking 类型支持内心戏"
```

---

## 任务 3：修改 stream API（核心逻辑）

**Files:**
- Modify: `src/app/api/matchmaking/[id]/stream/route.ts`

- [ ] **Step 1: 修改系统提示词，让 AI 同时输出表面话和内心戏**

在构建 systemPrompt 时添加：
```
## 输出格式
你必须返回两个部分，用 [内心戏] 分隔：

[表面话]
（你说出口的话，要自然、友善、符合你的性格）

[内心戏]
（你的内心独白，暗戳戳的想法，如对对方的好感、疑虑、吐槽等，要真实有趣）
```

- [ ] **Step 2: 修改消息解析逻辑**

解析 AI 返回时分割 [内心戏]：
```typescript
const parts = message.content.split('[内心戏]')
const surfaceContent = parts[0].replace('[表面话]', '').trim()
const innerThought = parts[1]?.trim() || null
```

- [ ] **Step 3: 保存消息时包含内心戏**

```typescript
await addChatMessage(sessionId, currentAgent.id, surfaceContent, innerThought)
```

- [ ] **Step 4: 添加匹配度分析调用**

在每轮对话结束后调用 AI 分析匹配度：
```typescript
const analysisPrompt = `分析这段对话，计算双方匹配度(0-100)。

对话内容：
${conversationHistory.map(m => `${m.agentName}: ${m.content}`).join('\n')}

分析维度：
1. 话题契合度 - 共同兴趣出现频率
2. 性格互补度 - 对话风格是否契合
3. 情感升温 - 对话是否有进展

返回 JSON：
{
  "score": 0-100,
  "reason": "简短原因"
}`
```

- [ ] **Step 5: SSE 事件新增字段**

```typescript
controller.enqueue(`data: ${JSON.stringify({
  type: 'message',
  agentId: currentAgent.id,
  agentName: currentAgent.name,
  content: surfaceContent,
  innerThought: innerThought,
  matchScore: analysisResult.score,
})}\n\n`)
```

- [ ] **Step 6: 提交代码**

```bash
git add src/app/api/matchmaking/[id]/stream/route.ts
git commit -m "feat: stream API 支持内心戏和匹配度计算"
```

---

## 任务 4：创建 LoveHearts 组件

**Files:**
- Create: `src/components/LoveHearts.tsx`

- [ ] **Step 1: 创建爱心动画组件**

```tsx
'use client'

import { useEffect, useState } from 'react'

interface LoveHeartsProps {
  score: number
}

export function LoveHearts({ score }: LoveHeartsProps) {
  const [hearts, setHearts] = useState<boolean[]>([false, false, false, false, false])

  useEffect(() => {
    const filledCount = score < 31 ? 0 : score < 51 ? 1 : score < 71 ? 3 : score < 86 ? 5 : 5
    const intensity = score < 31 ? 'gray' : score < 71 ? 'pink' : score < 86 ? 'rose' : 'gold'

    setHearts([false, false, false, false, false].map((_, i) => i < filledCount))
  }, [score])

  const getHeartStyle = (index: number, filled: boolean) => {
    const base = 'text-2xl transition-all duration-300'
    if (!filled) return `${base} text-gray-300`
    if (score >= 86) return `${base} text-yellow-400 animate-pulse drop-shadow-lg`
    if (score >= 71) return `${base} text-rose-500 animate-bounce`
    return `${base} text-pink-500 animate-pulse`
  }

  return (
    <div className="flex items-center gap-1">
      {[0, 1, 2, 3, 4].map(i => (
        <span key={i} className={getHeartStyle(i, hearts[i])}>
          {hearts[i] ? '❤️' : '🖤'}
        </span>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: 提交代码**

```bash
git add src/components/LoveHearts.tsx
git commit -m "feat: 添加 LoveHearts 动态爱心组件"
```

---

## 任务 5：修改 ChatBubble 组件

**Files:**
- Modify: `src/components/ChatBubble.tsx`

- [ ] **Step 1: 添加 innerThought 属性**

```tsx
interface ChatBubbleProps {
  agentName: string
  content: string
  innerThought?: string | null
  isUser?: boolean
  timestamp?: string
}
```

- [ ] **Step 2: 添加内心戏渲染逻辑**

```tsx
{innerThought && (
  <div className="mt-2 ml-4 animate-fade-in-right">
    <div className="inline-flex items-center gap-2 px-3 py-2 bg-purple-50/80 border border-dashed border-purple-300 rounded-lg text-sm italic text-purple-600 max-w-xs">
      <span>💭</span>
      <span>{innerThought}</span>
    </div>
  </div>
)}
```

- [ ] **Step 3: 添加动画样式**

在 Tailwind 或全局 CSS 中添加：
```css
@keyframes fade-in-right {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
.animate-fade-in-right {
  animation: fade-in-right 0.3s ease-out forwards;
}
```

- [ ] **Step 4: 提交代码**

```bash
git add src/components/ChatBubble.tsx
git commit -m "feat: ChatBubble 支持内心戏浮动卡片"
```

---

## 任务 6：修改 MatchmakingRoom 组件

**Files:**
- Modify: `src/components/MatchmakingRoom.tsx`

- [ ] **Step 1: 更新消息类型**

```tsx
interface Message {
  id: string
  agentId: string
  agentName: string
  content: string
  innerThought?: string | null
  matchScore?: number
}
```

- [ ] **Step 2: 添加 LoveHearts 组件**

```tsx
import { LoveHearts } from './LoveHearts'
```

- [ ] **Step 3: 添加状态保存最新匹配度**

```tsx
const [matchScore, setMatchScore] = useState<number>(0)
```

- [ ] **Step 4: 更新 SSE 消息处理，保存匹配度**

```tsx
if (data.type === 'message') {
  setMessages(prev => [...prev, {
    id: Date.now().toString(),
    agentId: data.agentId,
    agentName: data.agentName,
    content: data.content,
    innerThought: data.innerThought,
    matchScore: data.matchScore,
  }])
  if (data.matchScore !== undefined) {
    setMatchScore(data.matchScore)
  }
}
```

- [ ] **Step 5: 修改 UI 布局，添加头像和爱心区域**

在聊天区域顶部添加：
```tsx
<div className="flex items-center justify-center gap-4 py-4 border-b">
  <div className="text-center">
    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-white font-bold">
      {agent1.name.charAt(0)}
    </div>
    <div className="text-sm mt-1">{agent1.name}</div>
  </div>

  <div className="flex flex-col items-center">
    <LoveHearts score={matchScore} />
    <span className="text-xs text-gray-500 mt-1">{matchScore}%</span>
  </div>

  <div className="text-center">
    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-white font-bold">
      {agent2.name.charAt(0)}
    </div>
    <div className="text-sm mt-1">{agent2.name}</div>
  </div>
</div>
```

- [ ] **Step 6: 更新消息气泡渲染**

```tsx
<ChatBubble
  key={msg.id}
  agentName={msg.agentName}
  content={msg.content}
  innerThought={msg.innerThought}
  isUser={msg.agentId === agent1.id}
/>
```

- [ ] **Step 7: 提交代码**

```bash
git add src/components/MatchmakingRoom.tsx
git commit -m "feat: MatchmakingRoom 集成内心戏和爱心动画"
```

---

## 任务 7：推送部署

- [ ] **Step 1: 推送代码到 GitHub**

```bash
git push
```

- [ ] **Step 2: 等待 Vercel 自动部署完成**

- [ ] **Step 3: 本地测试完整流程**

访问 https://secondme-pearl.vercel.app/matchmaking
1. 创建分身
2. 选择平台角色匹配
3. 观察内心戏卡片和爱心动画

---

## 验证清单

- [ ] 数据库 innerThought 字段已添加
- [ ] AI 返回同时包含表面话和内心戏
- [ ] 内心戏以浮动卡片形式展示（右侧滑入）
- [ ] 匹配度以爱心形式实时展示
- [ ] 匹配度数值随对话推进变化
- [ ] 对话结束后显示最终匹配结果
