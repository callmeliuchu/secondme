import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { voteDebate, getDebateById } from '@/lib/debate'

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

    const { side } = await request.json()
    if (side !== 'positive' && side !== 'negative') {
      return NextResponse.json({ code: 400, message: '无效的投票方向' }, { status: 400 })
    }

    const vote = await voteDebate(id, user.id, side)
    return NextResponse.json({ code: 0, data: vote })
  } catch (error) {
    console.error('投票失败:', error)
    return NextResponse.json(
      { code: 500, message: error instanceof Error ? error.message : '投票失败' },
      { status: 500 }
    )
  }
}
