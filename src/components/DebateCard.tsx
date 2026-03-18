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
    pending: { text: '等待开始', color: 'bg-yellow-100 text-yellow-800' },
    running: { text: '进行中', color: 'bg-green-100 text-green-800' },
    ended: { text: '已结束', color: 'bg-gray-100 text-gray-800' },
  }

  const status = statusMap[debate.status as keyof typeof statusMap] || statusMap.pending

  return (
    <div
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-medium text-gray-900 line-clamp-2">{debate.topic}</h3>
        <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${status.color}`}>
          {status.text}
        </span>
      </div>

      <div className="flex items-center gap-4 text-sm text-gray-500">
        <span>第 {debate.roundCount} 轮</span>
        {debate._count && (
          <>
            <span>{debate._count.votes} 票</span>
            <span>{debate._count.participants} 人围观</span>
          </>
        )}
      </div>
    </div>
  )
}
