import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getDebateById } from '@/lib/debate'
import { DebatePanel } from '@/components/DebatePanel'
import { VotePanel } from '@/components/VotePanel'
import { PersonaCard } from '@/components/PersonaCard'

async function getUserId() {
  const cookieStore = await cookies()
  return cookieStore.get('user_id')?.value
}

export default async function DebatePage({ params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId()
  const { id } = await params

  if (!userId) {
    redirect('/api/auth/login')
  }

  const debate = await getDebateById(id)

  if (!debate) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">辩论不存在</h2>
          <Link href="/" className="text-blue-500 hover:underline">
            返回首页
          </Link>
        </div>
      </div>
    )
  }

  const isCreator = debate.createdBy === userId

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* 顶部导航 */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              返回
            </Link>
            <h1 className="text-lg font-semibold text-gray-900 line-clamp-1">
              {debate.topic}
            </h1>
          </div>
          {isCreator && debate.status !== 'ended' && (
            <form action={`/api/debate/${id}/end`} method="POST">
              <button
                type="submit"
                className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white font-medium rounded-lg hover:from-red-600 hover:to-red-700 transition-all shadow-md"
              >
                结束辩论
              </button>
            </form>
          )}
        </div>
      </header>

      {/* 主内容 */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* 人格展示 */}
          <div className="lg:col-span-3 grid gap-4 md:grid-cols-2">
            <PersonaCard side="positive" content={debate.positivePersona} />
            <PersonaCard side="negative" content={debate.negativePersona} />
          </div>

          {/* 辩论消息 */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 h-[600px] overflow-hidden">
              <DebatePanel debateId={id} messages={debate.messages as any} />
            </div>
          </div>

          {/* 投票面板 */}
          <div>
            <VotePanel debateId={id} />
          </div>
        </div>
      </main>
    </div>
  )
}
