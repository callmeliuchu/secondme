import { NextRequest, NextResponse } from 'next/server'
import { getMatchSessionById } from '@/lib/matchmaking'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await getMatchSessionById(id)

  if (!session) {
    return NextResponse.json({ code: 404, message: '相亲会话不存在' }, { status: 404 })
  }

  return NextResponse.json({ code: 0, data: session })
}