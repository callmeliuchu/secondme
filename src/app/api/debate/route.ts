import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { createDebate, getDebateList } from '@/lib/debate'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const limit = parseInt(searchParams.get('limit') || '20')
  const offset = parseInt(searchParams.get('offset') || '0')

  try {
    const debates = await getDebateList(limit, offset)
    return NextResponse.json({ code: 0, data: debates })
  } catch (error) {
    console.error('获取辩论列表失败:', error)
    return NextResponse.json(
      { code: 500, message: error instanceof Error ? error.message : '获取辩论列表失败' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ code: 401, message: '请先登录' }, { status: 401 })
    }

    const { topic } = await request.json()
    if (!topic || topic.trim().length === 0) {
      return NextResponse.json({ code: 400, message: '请输入辩论话题' }, { status: 400 })
    }

    const debate = await createDebate(topic, user.id)
    return NextResponse.json({ code: 0, data: debate })
  } catch (error) {
    console.error('创建辩论失败:', error)
    return NextResponse.json(
      { code: 500, message: error instanceof Error ? error.message : '创建辩论失败' },
      { status: 500 }
    )
  }
}
