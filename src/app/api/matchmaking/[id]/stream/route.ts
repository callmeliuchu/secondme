import { NextRequest } from 'next/server'
import { getMatchSessionById, addChatMessage, endMatchSession } from '@/lib/matchmaking'
import { getAgentById } from '@/lib/agent'
import { getCurrentUser } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await getMatchSessionById(id)

  if (!session) {
    return new Response('相亲会话不存在', { status: 404 })
  }

  // 获取当前用户
  const user = await getCurrentUser()
  if (!user?.accessToken) {
    return new Response('未登录或 token 失效', { status: 401 })
  }

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      let currentSession = session

      // 如果是 pending 状态，开始相亲
      if (currentSession.status === 'pending') {
        // 发送开始信号
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'start' })}\n\n`)
        )

        // 更新状态为 running
        await endMatchSession(id, 0) // 先设置为 0，稍后计算匹配度
        currentSession = await getMatchSessionById(id) || currentSession
      }

      // 如果已经是 ended 状态，直接返回
      if (currentSession.status === 'ended') {
        controller.enqueue(encoder.encode('data: {"type":"end"}\n\n'))
        controller.close()
        return
      }

      // 获取两个分身
      const agent1 = await getAgentById(currentSession.agent1Id)
      const agent2 = await getAgentById(currentSession.agent2Id)

      if (!agent1 || !agent2) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', message: '分身不存在' })}\n\n`))
        controller.close()
        return
      }

      // 开始相亲聊天循环 - agent1 先发言
      const MAX_ROUNDS = 6 // 最大聊天轮次（每方 3 次）
      let messageCount = currentSession.messages?.length || 0
      let currentAgentId: string = currentSession.agent1Id
      let currentAgentName = agent1.name

      // 如果已经有消息，下一方应该是最后一条消息的对方
      if (messageCount > 0) {
        const lastMessage = currentSession.messages[messageCount - 1]
        currentAgentId = lastMessage.agentId === currentSession.agent1Id
          ? currentSession.agent2Id
          : currentSession.agent1Id
        currentAgentName = currentAgentId === currentSession.agent1Id ? agent1.name : agent2.name
      }

      while (messageCount < MAX_ROUNDS) {
        // 检查会话是否结束
        const updatedSession = await getMatchSessionById(id)
        if (updatedSession?.status === 'ended') {
          controller.enqueue(encoder.encode('data: {"type":"end"}\n\n'))
          break
        }

        // 获取当前分身的人格
        const currentAgent = currentAgentId === currentSession.agent1Id ? agent1 : agent2
        const otherAgent = currentAgentId === currentSession.agent1Id ? agent2 : agent1

        // 生成系统提示词
        const systemPrompt = `你是 ${currentAgent.name}，一个性格为 ${currentAgent.personality} 的人。
${currentAgent.hobbies ? `你的爱好是：${currentAgent.hobbies}` : ''}
${currentAgent.intro ? `你的自我介绍：${currentAgent.intro}` : ''}

请用符合你性格的方式，以第一人称和对方聊天。你们正在相亲，希望了解对方并判断是否合适。
保持简短、自然的对话风格，每次回复控制在50字以内。`

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
                message: `你好，我是 ${otherAgent.name}。${otherAgent.hobbies ? `听说你喜欢${otherAgent.hobbies}，是真的吗？` : '很高兴认识你！'}`,
                systemPrompt,
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

                if (eventData === '[DONE]') {
                  continue
                }

                try {
                  const data = JSON.parse(eventData)
                  const content = data.choices?.[0]?.delta?.content || data.content || ''

                  if (content) {
                    fullContent += content
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                      type: 'message',
                      agentId: currentAgentId,
                      agentName: currentAgentName,
                      content
                    })}\n\n`))
                  }
                } catch {
                  // 非 JSON 数据，直接传递
                }
              }
            }
          }

          // 保存消息到数据库
          if (fullContent) {
            await addChatMessage(id, currentAgentId, fullContent)
            messageCount++
          }

        } catch (error) {
          console.error('AI response error:', error)
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', message: 'AI 响应出错' })}\n\n`))
        }

        // 切换到另一方
        currentAgentId = currentAgentId === currentSession.agent1Id
          ? currentSession.agent2Id
          : currentSession.agent1Id
        currentAgentName = currentAgentId === currentSession.agent1Id ? agent1.name : agent2.name
      }

      // 计算匹配度（简单基于消息数量和对话轮次）
      const finalSession = await getMatchSessionById(id)
      const finalMessageCount = finalSession?.messages?.length || 0
      const matchScore = Math.min(100, Math.floor(finalMessageCount * 15 + Math.random() * 20))

      // 相亲结束
      await endMatchSession(id, matchScore)
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'end', matchScore })}\n\n`))
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