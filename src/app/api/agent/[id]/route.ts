import { NextRequest, NextResponse } from 'next/server'
import { getAgentById } from '@/lib/agent'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const agent = await getAgentById(id)

  if (!agent) {
    return NextResponse.json({ code: 404, message: '分身不存在' }, { status: 404 })
  }

  return NextResponse.json({ code: 0, data: agent })
}