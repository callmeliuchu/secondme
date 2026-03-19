interface AgentCardProps {
  agent: {
    id: string
    name: string
    personality: string
    hobbies?: string | null
    appearance?: string | null
    avatar?: string | null
    status: string
    createdAt: string | Date
  }
  onSelect?: () => void
  onDelete?: () => void
  selected?: boolean
}

export function AgentCard({ agent, onSelect, onDelete, selected }: AgentCardProps) {
  return (
    <div
      className={`rounded-2xl border p-4 transition-all cursor-pointer group backdrop-blur-xl ${
        selected
          ? 'border-cyan-300/80 bg-cyan-400/15 ring-2 ring-cyan-200/30'
          : 'border-white/15 bg-white/10 hover:border-fuchsia-200/40 hover:bg-white/15'
      }`}
      onClick={onSelect}
    >
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-400 to-fuchsia-500 flex items-center justify-center text-slate-950 font-bold text-lg flex-shrink-0">
          {agent.avatar ? (
            <img src={agent.avatar} alt={agent.name} className="w-full h-full rounded-full object-cover" />
          ) : (
            agent.name.charAt(0)
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-white group-hover:text-cyan-200 transition-colors">
            {agent.name}
          </h3>
          <p className="text-sm text-white/70 mt-0.5 line-clamp-1">
            {agent.personality}
          </p>
        </div>
        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
            className="p-1.5 text-white/45 hover:text-rose-300 hover:bg-rose-500/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>

      {agent.hobbies && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          <span className="px-2 py-0.5 bg-white/12 border border-white/20 text-cyan-100 text-xs rounded-full">
            {agent.hobbies}
          </span>
        </div>
      )}

      {selected !== undefined && (
        <div className="mt-3 pt-3 border-t border-white/12">
          <div className="flex items-center justify-between text-sm">
            <span className="text-white/55">状态</span>
            <span className={`font-medium ${agent.status === 'active' ? 'text-emerald-300' : 'text-white/45'}`}>
              {agent.status === 'active' ? '✓ 可用' : '已停用'}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
