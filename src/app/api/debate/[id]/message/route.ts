import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { addDebateMessage, getDebateById } from '@/lib/debate'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ code: 401, message: '请先登录' }, { status: 401 })
    }

    const { id } = await params

    // 检查辩论是否存在
    const debate = await getDebateById(id)
    if (!debate) {
      return NextResponse.json({ code: 404, message: '辩论不存在' }, { status: 404 })
    }

    const { content } = await request.json()
    if (!content || content.trim().length === 0) {
      return NextResponse.json({ code: 400, message: '请输入消息内容' }, { status: 400 })
    }

    const message = await addDebateMessage(id, 'user', content)
    return NextResponse.json({ code: 0, data: message })
  } catch (error) {
    console.error('发送消息失败:', error)
    return NextResponse.json(
      { code: 500, message: error instanceof Error ? error.message : '发送消息失败' },
      { status: 500 }
    )
  }
}
