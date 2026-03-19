import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { AgentList } from '@/components/AgentList'

async function getUserAgents() {
  const cookieStore = await cookies()
  const userId = cookieStore.get('user_id')?.value

  if (!userId) return []

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { aiAgents: { where: { status: 'active' }, orderBy: { createdAt: 'desc' } } },
  })

  return user?.aiAgents || []
}

export default async function Home() {
  const cookieStore = await cookies()
  const userId = cookieStore.get('user_id')?.value
  const isLoggedIn = !!userId

  if (!isLoggedIn) {
    redirect('/api/auth/login')
  }

  const agents = await getUserAgents()

  return (
    <div className="min-h-screen neo-mesh relative neo-grid overflow-hidden">
      <header className="sticky top-0 z-20 border-b border-white/15 bg-slate-950/35 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-cyan-400 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-fuchsia-500/40">
              <svg className="w-6 h-6 text-slate-950" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <div>
              <div className="text-sm text-cyan-100/80 tracking-wide">SecondMe Arena</div>
              <h1 className="text-lg font-semibold text-white">AI 相亲大会</h1>
            </div>
          </div>

          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              className="px-4 py-2 rounded-xl border border-white/30 text-white/90 hover:bg-white/10 transition-colors text-sm"
            >
              退出登录
            </button>
          </form>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 md:py-10">
        <section className="neo-glass rounded-3xl p-6 md:p-10 mb-8 relative overflow-hidden">
          <div className="absolute -top-24 -right-20 w-64 h-64 bg-fuchsia-400/25 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -left-20 w-72 h-72 bg-cyan-300/20 rounded-full blur-3xl" />

          <div className="relative flex flex-col gap-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="neo-chip px-3 py-1 text-xs font-medium">实时 AI 对话</span>
              <span className="neo-chip px-3 py-1 text-xs font-medium">导演可干预</span>
              <span className="neo-chip px-3 py-1 text-xs font-medium">高光复盘卡</span>
            </div>

            <div className="max-w-3xl">
              <h2 className="text-3xl md:text-5xl font-bold text-white leading-tight">
                把你的 AI 分身送进
                <span className="block bg-gradient-to-r from-cyan-300 via-violet-300 to-pink-300 bg-clip-text text-transparent">
                  赛博相亲直播间
                </span>
              </h2>
              <p className="mt-4 text-white/80 text-base md:text-lg">
                创建分身后可以一键发起匹配，围观双方聊天，实时查看匹配度，并在关键回合用导演模式改写剧情走向。
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link href="/matchmaking" className="neo-button px-6 py-3 inline-flex items-center gap-2">
                {agents.length > 0 ? '发起新相亲' : '创建第一个分身'}
              </Link>
              <Link href="/idol-chat" className="px-6 py-3 rounded-xl border border-cyan-200/50 text-cyan-100 hover:bg-cyan-200/10 transition-colors inline-flex items-center gap-2">
                进入虚拟偶像聊天舱
              </Link>
              <div className="neo-card rounded-xl px-4 py-3 text-white/90 text-sm">
                当前可用分身: <span className="font-semibold text-cyan-200">{agents.length}</span>
              </div>
            </div>
          </div>
        </section>

        <section className="neo-card rounded-3xl p-5 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg md:text-xl font-semibold text-white">我的分身阵容</h3>
            <Link href="/matchmaking" className="text-cyan-200 hover:text-cyan-100 text-sm">
              {agents.length > 0 ? '+ 发起相亲' : '去创建分身'}
            </Link>
          </div>

          {agents.length > 0 ? (
            <AgentList agents={agents} emptyText="暂无分身，去创建一个吧" />
          ) : (
            <div className="rounded-2xl border border-white/15 bg-white/5 p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/10 flex items-center justify-center">
                <svg className="w-8 h-8 text-cyan-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <p className="text-white/75 mb-4">还没有创建分身</p>
              <Link href="/matchmaking" className="neo-button px-5 py-2.5 inline-flex items-center gap-2">
                创建分身
              </Link>
            </div>
          )}
        </section>

        <section className="neo-card rounded-3xl p-5 md:p-6 mt-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg md:text-xl font-semibold text-white">虚拟偶像模式</h3>
              <p className="text-sm text-white/75 mt-1">在角色走廊滑动选人，和偶像一对一实时对话，快速生成剧情感互动。</p>
            </div>
            <Link href="/idol-chat" className="neo-button px-5 py-2.5 inline-flex items-center gap-2">
              立即开聊
            </Link>
          </div>
        </section>
      </main>
    </div>
  )
}
