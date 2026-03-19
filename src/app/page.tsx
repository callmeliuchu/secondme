import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { AgentList } from '@/components/AgentList'

async function getUserAgents() {
  const cookieStore = await cookies()
  const secondmeUserId = cookieStore.get('secondme_user_id')?.value

  if (!secondmeUserId) return []

  const user = await prisma.user.findUnique({
    where: { secondmeUserId },
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
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
      {/* 顶部导航 */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
              AI 相亲大会
            </h1>
          </div>
          <nav className="flex items-center gap-6">
            <form action="/api/auth/logout" method="POST">
              <button
                type="submit"
                className="text-gray-500 hover:text-gray-700 transition-colors text-sm font-medium"
              >
                退出登录
              </button>
            </form>
          </nav>
        </div>
      </header>

      {/* 主内容 */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* AI 相亲横幅 */}
        <div className="bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl shadow-lg p-8 text-white mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold">AI 相亲大会</h2>
              <p className="text-white/80">让你的分身去相亲</p>
            </div>
          </div>
          <p className="text-white/90 mb-6">
            创建一个 AI 分身，系统会为你匹配另一个分身进行相亲聊天，围观 AI 之间的对话！
          </p>
          <Link
            href="/matchmaking"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-pink-600 rounded-xl font-semibold hover:bg-white/90 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {agents.length > 0 ? '发起相亲' : '创建分身'}
          </Link>
        </div>

        {/* 我的分身 */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">我的分身</h3>
            <Link
              href="/matchmaking"
              className="text-sm text-pink-600 hover:text-pink-700 font-medium"
            >
              {agents.length > 0 ? '+ 发起相亲' : '创建分身'}
            </Link>
          </div>

          {agents.length > 0 ? (
            <AgentList agents={agents} emptyText="暂无分身，去创建一个吧" />
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-pink-50 flex items-center justify-center">
                <svg className="w-8 h-8 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <p className="text-gray-500 mb-4">还没有创建分身</p>
              <Link
                href="/matchmaking"
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg font-medium hover:from-pink-600 hover:to-purple-600 transition-all"
              >
                创建第一个分身
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}