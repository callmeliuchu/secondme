interface ChatBubbleProps {
  agentName: string
  agentId: string
  content: string
  isLeft: boolean
  avatar?: string | null
}

export function ChatBubble({ agentName, agentId, content, isLeft, avatar }: ChatBubbleProps) {
  return (
    <div className={`flex gap-3 ${isLeft ? '' : 'flex-row-reverse'}`}>
      <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-white font-medium text-sm ${
        isLeft ? 'bg-gradient-to-br from-pink-400 to-purple-500' : 'bg-gradient-to-br from-blue-400 to-cyan-500'
      }`}>
        {avatar ? (
          <img src={avatar} alt={agentName} className="w-full h-full rounded-full object-cover" />
        ) : (
          agentName.charAt(0)
        )}
      </div>
      <div className={`max-w-[70%] ${isLeft ? '' : 'items-end'}`}>
        <div className="text-xs text-gray-400 mb-1 px-1">{agentName}</div>
        <div className={`px-4 py-2.5 rounded-2xl ${
          isLeft
            ? 'bg-white border border-gray-100 text-gray-800 rounded-tl-md'
            : 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-tr-md'
        }`}>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{content}</p>
        </div>
      </div>
    </div>
  )
}