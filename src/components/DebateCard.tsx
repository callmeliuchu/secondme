interface DebateCardProps {
  debate: {
    id: string
    topic: string
    status: string
    roundCount: number
    createdAt: string
    _count?: {
      votes: number
      participants: number
    }
  }
  onClick?: () => void
}

export function DebateCard({ debate, onClick }: DebateCardProps) {
  const statusMap = {
    pending: { text: '等待开始', color: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-500' },
    running: { text: '进行中', color: 'bg-green-100 text-green-700', dot: 'bg-green-500' },
    ended: { text: '已结束', color: 'bg-gray-100 text-gray-700', dot: 'bg-gray-400' },
  }

  const status = statusMap[debate.status as keyof typeof statusMap] || statusMap.pending
  const totalVotes = debate._count?.votes || 0

  return (
    <div
      className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md hover:border-gray-300 transition-all cursor-pointer group"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-medium text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
          {debate.topic}
        </h3>
        <span className={`ml-2 px-2.5 py-1 text-xs font-medium rounded-full ${status.color}`}>
          {status.text}
        </span>
      </div>

      <div className="flex items-center gap-4 text-sm text-gray-500">
        <div className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
          <span>第 {debate.roundCount} 轮</span>
        </div>
        {totalVotes > 0 && (
          <div className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{totalVotes} 票</span>
          </div>
        )}
        {debate._count?.participants && debate._count.participants > 0 && (
          <div className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <span>{debate._count.participants} 人围观</span>
          </div>
        )}
      </div>
    </div>
  )
}
