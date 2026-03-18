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

      // 获取最新的 debate 数据（包含 persona）
      let currentDebate = await getDebateById(id)

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
        const persona = currentSide === 'positive' ? currentDebate?.positivePersona : currentDebate?.negativePersona

        if (!persona) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', message: '人格未定义' })}\n\n`))
          break
        }

        try {
          const user = await getCurrentUser()
          const response = await fetch(
            `${process.env.SECONDME_API_BASE_URL}/api/secondme/chat/stream`,
            {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${user?.accessToken || ''}`,
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

        // 切换到另一方，准备下一轮
        currentSide = currentSide === 'positive' ? 'negative' : 'positive'
      }

      // 辩论结束
      await updateDebate(id, { status: 'ended' })
      controller.enqueue(encoder.encode('data: {"type":"end"}\n\n'))
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
