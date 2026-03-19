import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { getRandomPlatformAgent, getUserAgents } from '@/lib/agent'
import { createMatchSession } from '@/lib/matchmaking'

export async function POST(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ code: 401, message: '请先登录' }, { status: 401 })
  }

  const { agentId, matchType = 'platform', selfMatchAgentId } = await request.json()

  if (!agentId) {
    return NextResponse.json({ code: 400, message: '请选择分身' }, { status: 400 })
  }

  // 验证分身属于当前用户
  const userAgents = await getUserAgents(user.id)
  const selectedAgent = userAgents.find(a => a.id === agentId)

  if (!selectedAgent) {
    return NextResponse.json({ code: 400, message: '无效的分身' }, { status: 400 })
  }

  let matchedAgentId: string | null = null

  if (matchType === 'self') {
    // 自匹配：使用用户选择的第二个分身
    if (!selfMatchAgentId) {
      return NextResponse.json({ code: 400, message: '请选择第二个分身' }, { status: 400 })
    }
    // 验证 selfMatchAgentId 属于当前用户且不是自己
    const selfMatchAgent = userAgents.find(a => a.id === selfMatchAgentId)
    if (!selfMatchAgent) {
      return NextResponse.json({ code: 400, message: '无效的第二个分身' }, { status: 400 })
    }
    if (selfMatchAgentId === agentId) {
      return NextResponse.json({ code: 400, message: '不能选择相同的分身' }, { status: 400 })
    }
    matchedAgentId = selfMatchAgentId
  } else {
    // 平台角色匹配：随机选择一个平台角色
    const platformAgent = await getRandomPlatformAgent()
    if (!platformAgent) {
      return NextResponse.json({ code: 404, message: '暂无可用的平台角色，请稍后再试' }, { status: 404 })
    }
    matchedAgentId = platformAgent.id
  }

  const session = await createMatchSession(user.id, agentId, matchedAgentId!)
  return NextResponse.json({ code: 0, data: session })
}