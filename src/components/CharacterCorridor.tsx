'use client'

import { useMemo, useRef } from 'react'

interface CorridorAgent {
  id: string
  name: string
  personality: string
  intro?: string | null
  appearance?: string | null
  avatar?: string | null
}

interface CharacterCorridorProps {
  agents: CorridorAgent[]
  selectedAgentId?: string | null
  onSelect: (id: string) => void
}

const ROLE_EMOJI_MAP: Record<string, string> = {
  小阳光: '🌞',
  文艺青年: '📚',
  运动健将: '🏀',
  美食达人: '🍜',
  科技宅: '🤖',
  量子侦探: '🕵️',
  火星领航员: '🚀',
  时空档案员: '⏳',
  深海歌者: '🫧',
  蒸汽炼金师: '⚗️',
  废土修复师: '🧭',
  宫廷谜语师: '🀄',
  虚拟偶像主理人: '🎤',
}

const FALLBACK_EMOJIS = ['🎭', '🧠', '🛰️', '🧬', '🗝️', '🪐', '⚔️', '🧪']

function getRoleEmoji(name: string, index: number) {
  return ROLE_EMOJI_MAP[name] || FALLBACK_EMOJIS[index % FALLBACK_EMOJIS.length]
}

export function CharacterCorridor({ agents, selectedAgentId, onSelect }: CharacterCorridorProps) {
  const scrollerRef = useRef<HTMLDivElement>(null)

  const selectedIndex = useMemo(
    () => agents.findIndex((agent) => agent.id === selectedAgentId),
    [agents, selectedAgentId]
  )

  const selectedAgent = selectedIndex >= 0 ? agents[selectedIndex] : null

  const scrollByCards = (direction: 'left' | 'right') => {
    const el = scrollerRef.current
    if (!el) return
    const width = 280
    el.scrollBy({ left: direction === 'left' ? -width : width, behavior: 'smooth' })
  }

  return (
    <div className="neo-card rounded-3xl p-5 md:p-6 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_18%,rgba(34,211,238,0.2),transparent_38%),radial-gradient(circle_at_88%_8%,rgba(244,114,182,0.2),transparent_40%)]" />
        <div className="absolute bottom-0 left-0 right-0 h-24 corridor-floor opacity-35" />
      </div>

      <div className="relative flex items-start justify-between gap-3 mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white">角色走廊</h3>
          <p className="text-sm text-white/70">横向滑动，选一个你要挑战的世界观角色</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => scrollByCards('left')}
            className="w-9 h-9 rounded-lg border border-white/30 text-white/80 hover:bg-white/10"
            aria-label="向左滑动"
          >
            ←
          </button>
          <button
            type="button"
            onClick={() => scrollByCards('right')}
            className="w-9 h-9 rounded-lg border border-white/30 text-white/80 hover:bg-white/10"
            aria-label="向右滑动"
          >
            →
          </button>
        </div>
      </div>

      <div
        ref={scrollerRef}
        className="relative flex gap-3 overflow-x-auto pb-3 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {agents.map((agent, index) => {
          const selected = agent.id === selectedAgentId
          return (
            <button
              key={agent.id}
              type="button"
              onClick={() => onSelect(agent.id)}
              className={`snap-center min-w-[250px] max-w-[250px] rounded-2xl text-left p-4 transition-all ${
                selected
                  ? 'bg-cyan-300/20 border border-cyan-200/80 ring-2 ring-cyan-200/25'
                  : 'bg-white/10 border border-white/20 hover:bg-white/15'
              }`}
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-300 to-fuchsia-400 text-slate-950 text-2xl flex items-center justify-center shadow">
                  {agent.avatar ? <img src={agent.avatar} alt={agent.name} className="w-full h-full rounded-2xl object-cover" /> : getRoleEmoji(agent.name, index)}
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-white truncate">{agent.name}</div>
                  <div className="text-xs text-white/65 line-clamp-2">{agent.personality}</div>
                </div>
              </div>
              <div className="text-xs text-cyan-100/90 line-clamp-3 min-h-[50px]">
                {agent.intro || agent.appearance || '神秘角色，等待你解锁对话剧情'}
              </div>
            </button>
          )
        })}
      </div>

      {selectedAgent && (
        <div className="relative mt-3 rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white/85">
          已选角色:
          <span className="font-semibold text-cyan-200 ml-1">{selectedAgent.name}</span>
          <span className="text-white/65 ml-2">{selectedAgent.personality}</span>
        </div>
      )}
    </div>
  )
}
