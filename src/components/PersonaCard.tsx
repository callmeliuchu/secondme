interface PersonaCardProps {
  side: 'positive' | 'negative'
  content?: string
}

export function PersonaCard({ side, content }: PersonaCardProps) {
  const isPositive = side === 'positive'

  return (
    <div className={`rounded-2xl p-5 border ${
      isPositive
        ? 'bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200'
        : 'bg-gradient-to-br from-red-50 to-red-100/50 border-red-200'
    }`}>
      <div className="flex items-center gap-3 mb-3">
        <span className={`px-3 py-1 text-xs font-medium text-white rounded-full ${
          isPositive ? 'bg-blue-500' : 'bg-red-500'
        }`}>
          {isPositive ? '正方' : '反方'}
        </span>
        <span className="text-sm font-semibold text-gray-700">
          {isPositive ? '理性派' : '情感派'}
        </span>
      </div>

      {content ? (
        <p className="text-sm text-gray-600 line-clamp-4 leading-relaxed">{content}</p>
      ) : (
        <p className="text-sm text-gray-400 italic">等待分配人格...</p>
      )}
    </div>
  )
}
