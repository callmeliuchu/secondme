'use client'

import { AgentCard } from './AgentCard'

interface Agent {
  id: string
  name: string
  personality: string
  hobbies?: string | null
  appearance?: string | null
  avatar?: string | null
  status: string
  createdAt: string | Date
}

interface AgentListProps {
  agents: Agent[]
  selectedAgentId?: string
  onSelect?: (id: string) => void
  onDelete?: (id: string) => void
  emptyText?: string
}

export function AgentList({ agents, selectedAgentId, onSelect, onDelete, emptyText }: AgentListProps) {
  if (agents.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <p className="text-gray-500">{emptyText || '暂无分身'}</p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {agents.map((agent) => (
        <AgentCard
          key={agent.id}
          agent={agent}
          selected={selectedAgentId === agent.id}
          onSelect={() => onSelect?.(agent.id)}
          onDelete={onDelete ? () => onDelete(agent.id) : undefined}
        />
      ))}
    </div>
  )
}