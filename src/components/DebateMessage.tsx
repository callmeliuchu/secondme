interface DebateMessageProps {
  role: 'positive' | 'negative' | 'user'
  content: string
  isStreaming?: boolean
}

export function DebateMessage({ role, content, isStreaming }: DebateMessageProps) {
  const styles = {
    positive: {
      container: 'bg-gradient-to-br from-blue-50 to-blue-100/50',
      border: 'border-blue-200',
      label: '正方',
      labelBg: 'bg-blue-500',
      text: 'text-blue-800',
    },
    negative: {
      container: 'bg-gradient-to-br from-red-50 to-red-100/50',
      border: 'border-red-200',
      label: '反方',
      labelBg: 'bg-red-500',
      text: 'text-red-800',
    },
    user: {
      container: 'bg-gradient-to-br from-gray-50 to-gray-100/50',
      border: 'border-gray-200',
      label: '观众',
      labelBg: 'bg-gray-500',
      text: 'text-gray-800',
    },
  }

  const style = styles[role]

  return (
    <div className={`flex ${role === 'positive' || role === 'user' ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[80%] p-4 rounded-2xl border ${style.container} ${style.border}`}>
        <div className="flex items-center gap-2 mb-2">
          <span className={`px-2.5 py-0.5 text-xs text-white font-medium rounded-full ${style.labelBg}`}>
            {style.label}
          </span>
          {isStreaming && (
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </span>
          )}
        </div>
        <p className={`${style.text} whitespace-pre-wrap leading-relaxed`}>{content}</p>
      </div>
    </div>
  )
}
