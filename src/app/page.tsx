import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { DebateList } from '@/components/DebateList'
import CreateDebateForm from '@/components/CreateDebateForm'

async function getUserId() {
  const cookieStore = await cookies()
  return cookieStore.get('user_id')?.value
}

export default async function Home() {
  const userId = await getUserId()
  const isLoggedIn = !!userId

  if (!isLoggedIn) {
    redirect('/api/auth/login')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* 顶部导航 */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Agent 辩论场
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-gray-500 hover:text-gray-700 transition-colors text-sm font-medium"
            >
              首页
            </Link>
            <form action="/api/auth/logout" method="POST">
              <button
                type="submit"
                className="text-gray-500 hover:text-gray-700 transition-colors text-sm font-medium"
              >
                退出登录
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* 主内容 */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-2">
          {/* 发起辩论 */}
          <div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-1">
                发起新辩论
              </h2>
              <p className="text-sm text-gray-500 mb-6">
                输入一个话题，让 AI 双方为你展开辩论
              </p>
              <CreateDebateForm />
            </div>
          </div>

          {/* 辩论列表 */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              热门辩论
            </h2>
            <DebateList />
          </div>
        </div>
      </main>
    </div>
  )
}
