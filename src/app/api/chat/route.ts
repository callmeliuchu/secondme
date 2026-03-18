import { NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return new Response(
        JSON.stringify({ code: 401, message: '未登录', data: null }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    const body = await request.json()
    const { message, sessionId } = body

    if (!message) {
      return new Response(
        JSON.stringify({ code: 400, message: '消息不能为空', data: null }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    // 创建或获取会话
    let session
    if (sessionId) {
      session = await prisma.session.findUnique({
        where: { id: sessionId, userId: user.id },
      })
    }

    if (!session) {
      // 创建新会话
      session = await prisma.session.create({
        data: {
          userId: user.id,
          title: message.slice(0, 50),
        },
      })
    }

    // 保存用户消息
    await prisma.message.create({
      data: {
        sessionId: session.id,
        role: 'user',
        content: message,
      },
    })

    // 调用 SecondMe API 进行流式聊天
    const chatUrl = `${process.env.SECONDME_API_BASE_URL}/api/secondme/chat/stream`
    console.log('Chat API URL:', chatUrl)

    const response = await fetch(chatUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${user.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
      }),
    })

    console.log('Chat API response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.log('Chat API error:', errorText)
      throw new Error('Chat API error: ' + errorText)
    }

    // 创建流式响应
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader()
        if (!reader) {
          controller.close()
          return
        }

        let assistantMessage = ''

        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            const chunk = new TextDecoder().decode(value)
            assistantMessage += chunk
            controller.enqueue(encoder.encode(chunk))
          }

          // 保存助手消息到数据库
          await prisma.message.create({
            data: {
              sessionId: session.id,
              role: 'assistant',
              content: assistantMessage,
            },
          })

          // 更新会话标题（如果是新会话）
          if (!session.title || session.title === message.slice(0, 50)) {
            await prisma.session.update({
              where: { id: session.id },
              data: {
                title: assistantMessage.slice(0, 50) || '新对话',
              },
            })
          }
        } catch (error) {
          console.error('Stream error:', error)
        } finally {
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (error) {
    console.error('Chat error:', error)
    return new Response(
      JSON.stringify({ code: 500, message: '聊天失败', data: null }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}
