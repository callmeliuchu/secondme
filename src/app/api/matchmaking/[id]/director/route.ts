import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { getMatchSessionById } from '@/lib/matchmaking'
import { enqueueDirectorNote, getDirectorQueueLength } from '@/lib/director'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const user = await getCurrentUser()

  if (!user) {
    return NextResponse.json({ code: 401, message: '请先登录' }, { status: 401 })
  }

  const session = await getMatchSessionById(id)
  if (!session) {
    return NextResponse.json({ code: 404, message: '相亲会话不存在' }, { status: 404 })
  }

  if (session.userId !== user.id) {
    return NextResponse.json({ code: 403, message: '无权限操作该会话' }, { status: 403 })
  }

  const { text, mood } = await request.json()
  const sanitized = String(text || '').trim()

  if (!sanitized) {
    return NextResponse.json({ code: 400, message: '指令不能为空' }, { status: 400 })
  }

  if (sanitized.length > 120) {
    return NextResponse.json({ code: 400, message: '指令请控制在120字以内' }, { status: 400 })
  }

  const sanitizedMood = typeof mood === 'string' ? mood.trim().slice(0, 24) : undefined

  enqueueDirectorNote(id, sanitized, sanitizedMood)
  const queueLength = getDirectorQueueLength(id)

  return NextResponse.json({
    code: 0,
    data: {
      queueLength,
      acceptedAt: Date.now(),
    },
  })
}
