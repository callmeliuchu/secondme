import { cookies } from 'next/headers'
import Link from 'next/link'
import LoginButton from '@/components/LoginButton'
import UserProfile from '@/components/UserProfile'
import ChatWindow from '@/components/ChatWindow'

async function getUserId() {
  const cookieStore = await cookies()
  return cookieStore.get('user_id')?.value
}

export default async function Home() {
  const userId = await getUserId()
  const isLoggedIn = !!userId

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900">
            SecondMe 个人主页
          </h1>
          {isLoggedIn && (
            <form action="/api/auth/logout" method="POST">
              <button
                type="submit"
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                退出登录
              </button>
            </form>
          )}
        </div>
      </header>

      {/* 主内容 */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {!isLoggedIn ? (
          // 未登录状态
          <div className="flex flex-col items-center justify-center py-20">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                欢迎使用 SecondMe
              </h2>
              <p className="text-gray-500">
                登录以查看你的个人资料并与 AI 对话
              </p>
            </div>
            <LoginButton />
          </div>
        ) : (
          // 已登录状态
          <div className="grid gap-8 md:grid-cols-2">
            {/* 用户资料 */}
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                个人资料
              </h2>
              <UserProfile />
            </div>

            {/* 聊天窗口 */}
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                与 AI 对话
              </h2>
              <ChatWindow />
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
