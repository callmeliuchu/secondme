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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
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
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              ← 返回
            </Link>
            <h1 className="text-xl font-semibold text-gray-900">
              {debate.topic}
            </h1>
          </div>
          {isCreator && debate.status !== 'ended' && (
            <form action={`/api/debate/${id}/end`} method="POST">
              <button
                type="submit"
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                结束辩论
              </button>
            </form>
          )}
        </div>
      </header>

      {/* 主内容 */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* 人格展示 */}
          <div className="lg:col-span-3 grid gap-4 md:grid-cols-2">
            <PersonaCard side="positive" content={debate.positivePersona} />
            <PersonaCard side="negative" content={debate.negativePersona} />
          </div>

          {/* 辩论消息 */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-[600px] flex flex-col">
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
