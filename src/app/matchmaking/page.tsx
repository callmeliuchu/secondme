'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AgentList } from '@/components/AgentList'
import { CreateAgentForm } from '@/components/CreateAgentForm'

interface Agent {
  id: string
  name: string
  personality: string
  hobbies?: string | null
  appearance?: string | null
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
  const [matchType, setMatchType] = useState<MatchType>('platform')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)

  useEffect(() => {
    fetchAgents()
    fetchPlatformAgents()
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

  const fetchPlatformAgents = async () => {
    try {
      const res = await fetch('/api/platform-agents')
      const data = await res.json()
      if (data.code === 0) {
        setPlatformAgents(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch platform agents:', error)
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

    setStarting(true)
    try {
      const res = await fetch('/api/matchmaking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: selectedAgentId,
          matchType,
          selfMatchAgentId: matchType === 'self' ? selectedSecondAgentId : undefined,
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
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
      {/* 顶部导航 */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                AI 相亲大会
              </h1>
            </Link>
          </div>
          <nav className="flex items-center gap-6">
            <Link
              href="/"
              className="text-gray-500 hover:text-gray-700 transition-colors text-sm font-medium"
            >
              返回首页
            </Link>
          </nav>
        </div>
      </header>

      {/* 主内容 */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* 创建分身表单 */}
        {showCreateForm ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">创建新分身</h2>
              <button
                onClick={() => setShowCreateForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <CreateAgentForm
              onSubmit={handleCreateAgent}
              onCancel={() => setShowCreateForm(false)}
            />
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-1">还没有分身？</h2>
                <p className="text-sm text-gray-500">创建一个 AI 分身，让它代表你去相亲</p>
              </div>
              <button
                onClick={() => setShowCreateForm(true)}
                className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg font-medium hover:from-pink-600 hover:to-purple-600 transition-all"
              >
                创建分身
              </button>
            </div>
          </div>
        )}

        {/* 分身列表 */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">选择你的分身</h2>
            <span className="text-sm text-gray-500">
              {agents.length > 0 ? `${agents.length} 个分身` : '暂无分身'}
            </span>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <AgentList
              agents={agents}
              selectedAgentId={selectedAgentId || undefined}
              onSelect={(id) => {
                setSelectedAgentId(id)
                setSelectedSecondAgentId(null)
              }}
            />
          )}
        </div>

        {/* 匹配类型选择 */}
        {agents.length > 0 && selectedAgentId && (
          <div className="mb-8">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">选择匹配方式</h3>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => {
                    setMatchType('platform')
                    setSelectedSecondAgentId(null)
                  }}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    matchType === 'platform'
                      ? 'border-pink-500 bg-pink-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-2xl mb-2">🎭</div>
                  <div className="font-medium text-gray-900">平台角色匹配</div>
                  <div className="text-sm text-gray-500 mt-1">与系统预设角色相亲</div>
                </button>
                <button
                  onClick={() => setMatchType('self')}
                  disabled={otherAgents.length === 0}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    matchType === 'self'
                      ? 'border-pink-500 bg-pink-50'
                      : 'border-gray-200 hover:border-gray-300'
                  } ${otherAgents.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="text-2xl mb-2">🤝</div>
                  <div className="font-medium text-gray-900">自匹配</div>
                  <div className="text-sm text-gray-500 mt-1">
                    {otherAgents.length > 0 ? '两个分身互相相亲' : '需要至少2个分身'}
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 自匹配：选择第二个分身 */}
        {matchType === 'self' && otherAgents.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">选择第二个分身</h3>
              <span className="text-sm text-gray-500">{otherAgents.length} 个可选</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {otherAgents.map((agent) => (
                <div
                  key={agent.id}
                  onClick={() => setSelectedSecondAgentId(agent.id)}
                  className={`bg-white rounded-xl shadow-sm border p-4 cursor-pointer transition-all ${
                    selectedSecondAgentId === agent.id
                      ? 'border-pink-500 ring-2 ring-pink-100'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-white font-bold">
                      {agent.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{agent.name}</div>
                      <div className="text-sm text-gray-500">{agent.personality}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 平台角色预览 */}
        {matchType === 'platform' && platformAgents.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">可用平台角色</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {platformAgents.map((agent) => (
                <div
                  key={agent.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 text-center"
                >
                  <div className="w-12 h-12 mx-auto rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-white font-bold text-lg mb-2">
                    {agent.name.charAt(0)}
                  </div>
                  <div className="font-medium text-gray-900 text-sm">{agent.name}</div>
                  <div className="text-xs text-gray-500 mt-1 line-clamp-1">{agent.personality}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 发起相亲按钮 */}
        {agents.length > 0 && selectedAgentId && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <button
              onClick={handleStartMatchmaking}
              disabled={
                !selectedAgentId ||
                (matchType === 'self' && !selectedSecondAgentId) ||
                starting
              }
              className="w-full px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-xl font-semibold hover:from-pink-600 hover:to-purple-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {starting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  匹配中...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  {matchType === 'platform' ? '开始匹配平台角色' : '开始自匹配'}
                </>
              )}
            </button>
          </div>
        )}
      </main>
    </div>
  )
}