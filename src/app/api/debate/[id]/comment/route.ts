import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { addComment, getDebateById } from '@/lib/debate'

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

    // 只有辩论结束后才能评论
    if (debate.status !== 'ended') {
      return NextResponse.json({ code: 400, message: '辩论结束后才能发表评论' }, { status: 400 })
    }

    const { content } = await request.json()
    if (!content || content.trim().length === 0) {
      return NextResponse.json({ code: 400, message: '请输入评论内容' }, { status: 400 })
    }

    const comment = await addComment(id, user.id, content)
    return NextResponse.json({ code: 0, data: comment })
  } catch (error) {
    console.error('添加评论失败:', error)
    return NextResponse.json(
      { code: 500, message: error instanceof Error ? error.message : '添加评论失败' },
      { status: 500 }
    )
  }
}
