import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import LoginButton from '@/components/LoginButton'
import UserProfile from '@/components/UserProfile'
import { DebateList } from '@/components/DebateList'
import { CreateDebateForm } from '@/components/CreateDebateForm'

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
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900">
            Agent 辩论场
          </h1>
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              首页
            </Link>
            <form action="/api/auth/logout" method="POST">
              <button
                type="submit"
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                退出登录
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* 主内容 */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* 用户资料 */}
        <div className="mb-8">
          <UserProfile />
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* 发起辩论 */}
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              发起新辩论
            </h2>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <CreateDebateForm />
            </div>
          </div>

          {/* 辩论列表 */}
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              热门辩论
            </h2>
            <DebateList />
          </div>
        </div>
      </main>
    </div>
  )
}
