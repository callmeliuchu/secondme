interface DebateMessageProps {
  role: 'positive' | 'negative' | 'user'
  content: string
  isStreaming?: boolean
}

export function DebateMessage({ role, content, isStreaming }: DebateMessageProps) {
  const styles = {
    positive: {
      container: 'bg-blue-50 ml-auto',
      label: '正方',
      labelBg: 'bg-blue-500',
    },
    negative: {
      container: 'bg-red-50',
      label: '反方',
      labelBg: 'bg-red-500',
    },
    user: {
      container: 'bg-gray-50 ml-auto',
      label: '观众',
      labelBg: 'bg-gray-500',
    },
  }

  const style = styles[role]

  return (
    <div className={`max-w-[70%] p-3 rounded-lg ${style.container}`}>
      <div className="flex items-center gap-2 mb-1">
        <span className={`px-2 py-0.5 text-xs text-white rounded ${style.labelBg}`}>
          {style.label}
        </span>
        {isStreaming && (
          <span className="text-xs text-gray-400">正在输入...</span>
        )}
      </div>
      <p className="text-gray-800 whitespace-pre-wrap">{content}</p>
    </div>
  )
}
