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

  const initialStatus = session.status === 'pending' ? 'loading' : (session.status as 'running' | 'ended')

  return (
    <div className="min-h-screen neo-mesh relative neo-grid overflow-hidden">
      <header className="sticky top-0 z-20 border-b border-white/15 bg-slate-950/35 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-cyan-400 to-fuchsia-500 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-fuchsia-500/40">
              LIVE
            </div>
            <div>
              <div className="text-sm text-cyan-100/80 tracking-wide">Live Match Room</div>
              <h1 className="text-lg font-semibold text-white">相亲直播间</h1>
            </div>
          </Link>

          <Link href="/matchmaking" className="px-4 py-2 rounded-xl border border-white/30 text-white/90 hover:bg-white/10 text-sm">
            返回匹配大厅
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div
          className="neo-glass rounded-3xl p-1 overflow-hidden"
          style={{ height: 'calc(100vh - 170px)', minHeight: '560px' }}
        >
          <MatchmakingRoom
            sessionId={session.id}
            agent1={session.agent1}
            agent2={session.agent2}
            initialStatus={initialStatus}
            initialMatchScore={session.matchScore || 0}
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
