import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { endDebate, getDebateById } from '@/lib/debate'

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

    // 只有辩论创建者可以结束辩论
    if (debate.createdBy !== user.id) {
      return NextResponse.json({ code: 403, message: '只有辩论创建者可以结束辩论' }, { status: 403 })
    }

    const result = await endDebate(id, user.id)
    return NextResponse.json({ code: 0, data: result })
  } catch (error) {
    console.error('结束辩论失败:', error)
    return NextResponse.json(
      { code: 500, message: error instanceof Error ? error.message : '结束辩论失败' },
      { status: 500 }
    )
  }
}
