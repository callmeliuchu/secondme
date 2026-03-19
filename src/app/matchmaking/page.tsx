'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AgentList } from '@/components/AgentList'
import { CreateAgentForm } from '@/components/CreateAgentForm'
import { CharacterCorridor } from '@/components/CharacterCorridor'

interface Agent {
  id: string
  name: string
  personality: string
  hobbies?: string | null
  appearance?: string | null
  intro?: string | null
  avatar?: string | null
  status: string
  isPlatform?: boolean
  createdAt: string
}

type MatchType = 'platform' | 'self'

export default function MatchmakingPage() {
  const router = useRouter()
  const [agents, setAgents] = useState<Agent[]>([])
  const [platformAgents, setPlatformAgents] = useState<Agent[]>([])
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null)
  const [selectedSecondAgentId, setSelectedSecondAgentId] = useState<string | null>(null)
  const [selectedPlatformAgentId, setSelectedPlatformAgentId] = useState<string | null>(null)
  const [matchType, setMatchType] = useState<MatchType>('platform')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)

  useEffect(() => {
    fetchAgents()

    const fetchPlatforms = async () => {
      try {
        const res = await fetch('/api/platform-agents')
        const data = await res.json()
        if (data.code === 0) {
          setPlatformAgents(data.data)
          setSelectedPlatformAgentId((prev) => prev || data.data[0]?.id || null)
        }
      } catch (error) {
        console.error('Failed to fetch platform agents:', error)
      }
    }

    fetchPlatforms()
  }, [])

  const fetchAgents = async () => {
    try {
      const res = await fetch('/api/agent')
      const data = await res.json()
      if (data.code === 0) {
        setAgents(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch agents:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateAgent = async (formData: {
    name: string
    personality: string
    hobbies?: string
    appearance?: string
    intro?: string
  }) => {
    const res = await fetch('/api/agent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    })
    const data = await res.json()
    if (data.code === 0) {
      await fetchAgents()
      setShowCreateForm(false)
    } else {
      alert(data.message || '创建失败')
    }
  }

  const handleStartMatchmaking = async () => {
    if (!selectedAgentId) {
      alert('请先选择一个分身')
      return
    }

    if (matchType === 'self' && !selectedSecondAgentId) {
      alert('请选择第二个分身')
      return
    }

    if (matchType === 'platform' && !selectedPlatformAgentId) {
      alert('请先在角色走廊选择一个平台角色')
      return
    }

    setStarting(true)
    try {
      const res = await fetch('/api/matchmaking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: selectedAgentId,
          matchType,
          selfMatchAgentId: matchType === 'self' ? selectedSecondAgentId : undefined,
          platformAgentId: matchType === 'platform' ? selectedPlatformAgentId : undefined,
        }),
      })
      const data = await res.json()
      if (data.code === 0) {
        router.push(`/matchmaking/${data.data.id}`)
      } else {
        alert(data.message || '匹配失败')
      }
    } catch (error) {
      console.error('Failed to start matchmaking:', error)
      alert('匹配失败')
    } finally {
      setStarting(false)
    }
  }

  const otherAgents = agents.filter(a => a.id !== selectedAgentId)

  return (
    <div className="min-h-screen neo-mesh relative neo-grid overflow-hidden">
      <header className="sticky top-0 z-20 border-b border-white/15 bg-slate-950/35 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-cyan-400 to-fuchsia-500 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-fuchsia-500/40">
              ❤
            </div>
            <div>
              <div className="text-sm text-cyan-100/80 tracking-wide">Match Control</div>
              <h1 className="text-lg font-semibold text-white">发起相亲</h1>
            </div>
          </Link>
          <Link href="/" className="px-4 py-2 rounded-xl border border-white/30 text-white/90 hover:bg-white/10 text-sm">
            返回首页
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 md:py-10 space-y-8">
        <section className="neo-glass rounded-3xl p-6 md:p-8">
          {showCreateForm ? (
            <>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-semibold text-white">创建新分身</h2>
                <button onClick={() => setShowCreateForm(false)} className="text-white/70 hover:text-white text-sm">
                  收起
                </button>
              </div>
              <div className="bg-white rounded-2xl p-5">
                <CreateAgentForm onSubmit={handleCreateAgent} onCancel={() => setShowCreateForm(false)} />
              </div>
            </>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-white mb-1">分身工厂</h2>
                <p className="text-white/75 text-sm">先打造人设，再让它进入实时匹配场。</p>
              </div>
              <button onClick={() => setShowCreateForm(true)} className="neo-button px-5 py-2.5">
                创建分身
              </button>
            </div>
          )}
        </section>

        <section className="neo-card rounded-3xl p-5 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">选择你的分身</h3>
            <span className="text-sm text-white/70">{agents.length > 0 ? `${agents.length} 个分身` : '暂无分身'}</span>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-cyan-300 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <AgentList
              agents={agents}
              selectedAgentId={selectedAgentId || undefined}
              onSelect={(id) => {
                setSelectedAgentId(id)
                setSelectedSecondAgentId(null)
                if (!selectedPlatformAgentId && platformAgents.length > 0) {
                  setSelectedPlatformAgentId(platformAgents[0].id)
                }
              }}
            />
          )}
        </section>

        {agents.length > 0 && selectedAgentId && (
          <section className="neo-card rounded-3xl p-5 md:p-6">
            <h3 className="text-lg font-semibold text-white mb-4">选择匹配方式</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              <button
                onClick={() => {
                  setMatchType('platform')
                  setSelectedSecondAgentId(null)
                }}
                className={`p-4 rounded-2xl border text-left transition-all ${
                  matchType === 'platform'
                    ? 'border-cyan-300 bg-cyan-300/20'
                    : 'border-white/20 bg-white/5 hover:bg-white/10'
                }`}
              >
                <div className="text-2xl mb-1">🎭</div>
                <div className="font-medium text-white">平台角色匹配</div>
                <div className="text-sm text-white/70 mt-1">系统角色池随机匹配</div>
              </button>
              <button
                onClick={() => setMatchType('self')}
                disabled={otherAgents.length === 0}
                className={`p-4 rounded-2xl border text-left transition-all ${
                  matchType === 'self'
                    ? 'border-fuchsia-300 bg-fuchsia-300/20'
                    : 'border-white/20 bg-white/5 hover:bg-white/10'
                } ${otherAgents.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="text-2xl mb-1">🤝</div>
                <div className="font-medium text-white">自匹配</div>
                <div className="text-sm text-white/70 mt-1">{otherAgents.length > 0 ? '两个分身互相相亲' : '需要至少2个分身'}</div>
              </button>
            </div>
          </section>
        )}

        {matchType === 'self' && otherAgents.length > 0 && (
          <section className="neo-card rounded-3xl p-5 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">选择第二个分身</h3>
              <span className="text-sm text-white/70">{otherAgents.length} 个可选</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {otherAgents.map((agent) => (
                <button
                  key={agent.id}
                  onClick={() => setSelectedSecondAgentId(agent.id)}
                  className={`rounded-2xl border p-4 text-left transition-all ${
                    selectedSecondAgentId === agent.id
                      ? 'border-cyan-300 bg-cyan-300/20'
                      : 'border-white/20 bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-fuchsia-500 flex items-center justify-center text-slate-950 font-bold">
                      {agent.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-medium text-white">{agent.name}</div>
                      <div className="text-sm text-white/70">{agent.personality}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {matchType === 'platform' && platformAgents.length > 0 && (
          <CharacterCorridor
            agents={platformAgents}
            selectedAgentId={selectedPlatformAgentId}
            onSelect={setSelectedPlatformAgentId}
          />
        )}

        {agents.length > 0 && selectedAgentId && (
          <section className="neo-glass rounded-3xl p-5 md:p-6">
            <button
              onClick={handleStartMatchmaking}
              disabled={!selectedAgentId || (matchType === 'self' && !selectedSecondAgentId) || starting}
              className="neo-button w-full px-6 py-3.5 flex items-center justify-center gap-2"
            >
              {starting ? (
                <>
                  <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  匹配中...
                </>
              ) : (
                <>
                  {matchType === 'platform'
                    ? `开始匹配 ${platformAgents.find((a) => a.id === selectedPlatformAgentId)?.name || '平台角色'}`
                    : '开始自匹配'}
                </>
              )}
            </button>
          </section>
        )}
      </main>
    </div>
  )
}
