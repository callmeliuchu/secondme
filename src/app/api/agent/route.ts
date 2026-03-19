import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { createAgent, getUserAgents } from '@/lib/agent'

export async function GET(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ code: 401, message: '请先登录' }, { status: 401 })
  }

  const agents = await getUserAgents(user.id)
  return NextResponse.json({ code: 0, data: agents })
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ code: 401, message: '请先登录' }, { status: 401 })
  }

  const { name, personality, hobbies, appearance, intro } = await request.json()

  if (!name || !personality) {
    return NextResponse.json({ code: 400, message: '请填写名字和性格' }, { status: 400 })
  }

  const agent = await createAgent({
    userId: user.id,
    name,
    personality,
    hobbies,
    appearance,
    intro,
  })

  return NextResponse.json({ code: 0, data: agent })
}