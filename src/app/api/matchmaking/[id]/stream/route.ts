import { NextRequest } from 'next/server'
import { getMatchSessionById, addChatMessage, endMatchSession, startMatchSession } from '@/lib/matchmaking'
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
      let currentMatchScore = 0

      // 如果是 pending 状态，开始相亲
      if (currentSession.status === 'pending') {
        // 发送开始信号
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'start' })}\n\n`)
        )

        // 更新状态为 running
        await startMatchSession(id)
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
保持简短，自然的对话风格，每次回复控制在50字以内。

## 输出格式
你必须返回两个部分，用 [内心戏] 分隔：

[表面话]
（你说出口的话，要自然、友善、符合你的性格）

[内心戏]
（你的内心独白，暗戳戳的想法，如对对方的好感、疑虑、吐槽等，要真实有趣）`

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
                  }
                } catch {
                  // 非 JSON 数据，直接传递
                }
              }
            }
          }

          // 分割表面话和内心戏
          const parts = fullContent.split('[内心戏]')
          let surfaceContent = parts[0].replace('[表面话]', '').trim()
          const innerThought = parts[1]?.trim() || null

          // 如果格式不对，尝试处理单一部分的情况
          if (!surfaceContent && parts.length === 1) {
            surfaceContent = fullContent.trim()
          }

          // 发送完整的消息事件
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'message',
            agentId: currentAgentId,
            agentName: currentAgentName,
            content: surfaceContent,
            innerThought: innerThought,
            matchScore: currentMatchScore
          })}\n\n`))

          // 保存消息到数据库
          if (surfaceContent) {
            await addChatMessage(id, currentAgentId, surfaceContent, innerThought || undefined)
            messageCount++
          }

          // 构建对话历史，计算匹配度
          const conversationHistory = currentSession.messages || []
          const recentMessages = conversationHistory.slice(-6)

          if (recentMessages.length >= 2) {
            try {
              const analysisResponse = await fetch(
                `${process.env.SECONDME_API_BASE_URL}/api/secondme/chat/stream`,
                {
                  method: 'POST',
                  headers: {
                    Authorization: `Bearer ${user.accessToken}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    message: `分析这段对话，计算双方匹配度(0-100)。只返回一个数字。

对话内容：
${recentMessages.map((m: any) => `${m.agentId === currentSession.agent1Id ? agent1.name : agent2.name}: ${m.content}`).join('\n')}`,
                    systemPrompt: `你是一个相亲匹配度分析专家。根据对话内容分析双方匹配度(0-100)，只返回一个数字，不要其他文字。`,
                  }),
                }
              )

              if (analysisResponse.ok && analysisResponse.body) {
                let scoreText = ''
                const scoreReader = analysisResponse.body.getReader()
                while (true) {
                  const { done, value } = await scoreReader.read()
                  if (done) break
                  scoreText += new TextDecoder().decode(value)
                }
                const score = parseInt(scoreText.replace(/[^0-9]/g, '')) || 50
                currentMatchScore = Math.min(100, Math.max(0, score))
              }
            } catch (e) {
              // 使用默认分数
              currentMatchScore = Math.floor(messageCount * 15)
            }
          }

        } catch (error) {
          console.error('AI response error:', error)
          // 发生错误时，发送一个默认消息而不是直接结束
          const errorMessage = `（内心独白：这个人好像不太想说话...）`
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'message',
            agentId: currentAgentId,
            agentName: currentAgentName,
            content: '抱歉，我现在有点走神...',
            innerThought: errorMessage,
            matchScore: currentMatchScore
          })}\n\n`))
          // 保存错误消息
          await addChatMessage(id, currentAgentId, '抱歉，我现在有点走神...', errorMessage)
          messageCount++
        }

        // 切换到另一方
        currentAgentId = currentAgentId === currentSession.agent1Id
          ? currentSession.agent2Id
          : currentSession.agent1Id
        currentAgentName = currentAgentId === currentSession.agent1Id ? agent1.name : agent2.name
      }

      // 相亲结束，使用计算出的匹配度
      await endMatchSession(id, currentMatchScore)
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'end', matchScore: currentMatchScore })}\n\n`))
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