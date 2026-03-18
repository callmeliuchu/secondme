import { NextRequest, NextResponse } from 'next/server'
import { getDebateById } from '@/lib/debate'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const debate = await getDebateById(id)

    if (!debate) {
      return NextResponse.json({ code: 404, message: '辩论不存在' }, { status: 404 })
    }

    return NextResponse.json({ code: 0, data: debate })
  } catch (error) {
    console.error('获取辩论详情失败:', error)
    return NextResponse.json(
      { code: 500, message: error instanceof Error ? error.message : '获取辩论详情失败' },
      { status: 500 }
    )
  }
}
