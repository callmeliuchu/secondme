import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { MatchmakingRoom } from '@/components/MatchmakingRoom'

async function getSession(sessionId: string) {
  const cookieStore = await cookies()
  const userId = cookieStore.get('user_id')?.value

  if (!userId) {
    console.log('No user_id cookie found')
    return null
  }

  const session = await prisma.matchSession.findUnique({
    where: { id: sessionId },
    include: {
      agent1: { select: { id: true, name: true, avatar: true } },
      agent2: { select: { id: true, name: true, avatar: true } },
      messages: { orderBy: { createdAt: 'asc' } },
    },
  })

  console.log('Session found:', sessionId, 'status:', session?.status, 'messages:', session?.messages?.length)
  return session
}

export default async function MatchRoomPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await getSession(id)

  if (!session) {
    redirect('/matchmaking')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
      {/* 顶部导航 */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                AI 相亲大会
              </h1>
            </Link>
          </div>
          <nav className="flex items-center gap-6">
            <Link
              href="/matchmaking"
              className="text-gray-500 hover:text-gray-700 transition-colors text-sm font-medium"
            >
              返回
            </Link>
          </nav>
        </div>
      </header>

      {/* 相亲房间 */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden" style={{ height: 'calc(100vh - 200px)', minHeight: '500px' }}>
          <MatchmakingRoom
            sessionId={session.id}
            agent1={session.agent1}
            agent2={session.agent2}
            initialStatus={session.status as 'loading' | 'running' | 'ended'}
            initialMessages={session.messages.map(m => ({
              agentId: m.agentId,
              agentName: m.agentId === session.agent1.id ? session.agent1.name : session.agent2.name,
              content: m.content,
              innerThought: m.innerThought || null,
            }))}
          />
        </div>
      </main>
    </div>
  )
}