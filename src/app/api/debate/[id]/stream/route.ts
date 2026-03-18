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

  // 获取当前用户（用于调用 SecondMe API）
  const user = await getCurrentUser()
  if (!user?.accessToken) {
    return new Response('未登录或 token 失效', { status: 401 })
  }

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      let currentDebate = debate

      // 如果是 pending 状态，先生成人格并开始辩论
      if (currentDebate.status === 'pending') {
        const personas = generatePersonas(currentDebate.topic)

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

        // 重新获取更新后的辩论数据
        currentDebate = await getDebateById(id) || currentDebate
      }

      // 如果已经是 ended 状态，直接返回
      if (currentDebate.status === 'ended') {
        controller.enqueue(encoder.encode('data: {"type":"end"}\n\n'))
        controller.close()
        return
      }

      // 开始辩论循环 - 正方先发言
      const MAX_ROUNDS = 10 // 最大辩论轮次
      let currentRound = currentDebate.roundCount || 0
      let currentSide: 'positive' | 'negative' = 'positive'

      // 如果已经有消息，下一方应该是最后一条消息的反方
      if (currentDebate.messages && currentDebate.messages.length > 0) {
        const lastMessage = currentDebate.messages[currentDebate.messages.length - 1]
        currentSide = lastMessage.role === 'positive' ? 'negative' : 'positive'
      }

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
          const response = await fetch(
            `${process.env.SECONDME_API_BASE_URL}/api/secondme/chat/stream`,
            {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${user.accessToken}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                message: currentSide === 'positive'
                  ? `请发表正方观点（话题：${currentDebate.topic}）`
                  : `请发表反方观点（话题：${currentDebate.topic}）`,
                systemPrompt: persona,
              }),
            }
          )

          if (!response.ok || !response.body) {
            throw new Error(`AI API 响应错误: ${response.status}`)
          }

          let fullContent = ''
          let buffer = ''
          const reader = response.body.getReader()
          const decoder = new TextDecoder()

          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            buffer += decoder.decode(value, { stream: true })
            const lines = buffer.split('\n')
            buffer = lines.pop() || ''

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const eventData = line.slice(6)

                // 跳过结束标记
                if (eventData === '[DONE]') {
                  continue
                }

                try {
                  const data = JSON.parse(eventData)
                  // 提取 content: {"choices": [{"delta": {"content": "xxx"}}]}
                  const content = data.choices?.[0]?.delta?.content || data.content || ''

                  if (content) {
                    fullContent += content
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'message', side: currentSide, content })}\n\n`))
                  }
                } catch {
                  // 非 JSON 数据，直接传递
                }
              }
            }
          }

          // 保存消息到数据库
          if (fullContent) {
            await addDebateMessage(id, currentSide, fullContent)
          }

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
