interface PersonaCardProps {
  side: 'positive' | 'negative'
  content?: string
}

export function PersonaCard({ side, content }: PersonaCardProps) {
  const isPositive = side === 'positive'

  return (
    <div className={`rounded-lg p-4 ${isPositive ? 'bg-blue-50 border-blue-200' : 'bg-red-50 border-red-200'} border`}>
      <div className="flex items-center gap-2 mb-2">
        <span className={`px-2 py-0.5 text-xs text-white rounded ${isPositive ? 'bg-blue-500' : 'bg-red-500'}`}>
          {isPositive ? '正方' : '反方'}
        </span>
        <span className="text-sm font-medium text-gray-700">
          {isPositive ? '理性派' : '情感派'}
        </span>
      </div>

      {content ? (
        <p className="text-sm text-gray-600 line-clamp-3">{content}</p>
      ) : (
        <p className="text-sm text-gray-400 italic">等待分配人格...</p>
      )}
    </div>
  )
}
