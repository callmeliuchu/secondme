'use client'

import { useEffect, useRef, useState } from 'react'
import { ChatBubble } from './ChatBubble'
import { MatchResult } from './MatchResult'
import { LoveHearts } from './LoveHearts'
import { MatchPulseMeter } from './MatchPulseMeter'
import { RecapCard } from './RecapCard'

interface Message {
  agentId: string
  agentName: string
  content: string
  innerThought?: string | null
  matchScore?: number
}

interface MatchmakingRoomProps {
  sessionId: string
  agent1: { id: string; name: string; avatar?: string | null }
  agent2: { id: string; name: string; avatar?: string | null }
  initialStatus?: 'loading' | 'running' | 'ended'
  initialMessages?: Message[]
  initialMatchScore?: number
}

const DIRECTOR_PRESETS = [
  '主动追问对方最在意的价值观',
  '语气更温柔，减少防御感',
  '聊聊未来三年的生活规划',
  '给一个具体、真诚的夸奖',
]

export function MatchmakingRoom({
  sessionId,
  agent1,
  agent2,
  initialStatus = 'loading',
  initialMessages = [],
  initialMatchScore = 0,
}: MatchmakingRoomProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [status, setStatus] = useState<'loading' | 'running' | 'ended'>(initialStatus)
  const [matchScore, setMatchScore] = useState(initialMatchScore)
  const [error, setError] = useState<string | null>(null)
  const [currentRound, setCurrentRound] = useState(initialMessages.length + 1)
  const [maxRounds, setMaxRounds] = useState(6)
  const [currentSpeaker, setCurrentSpeaker] = useState<string | null>(null)
  const [directorText, setDirectorText] = useState('')
  const [directorMood, setDirectorMood] = useState('')
  const [directorQueue, setDirectorQueue] = useState(0)
  const [sendingDirective, setSendingDirective] = useState(false)
  const [directiveFeedback, setDirectiveFeedback] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const eventSourceRef = useRef<EventSource | null>(null)

  useEffect(() => {
    if (initialStatus === 'ended') {
      setStatus('ended')
      return
    }

    let retryCount = 0
    const maxRetries = 3
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null

    const connect = () => {
      const eventSource = new EventSource(`/api/matchmaking/${sessionId}/stream`)
      eventSourceRef.current = eventSource

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)

          switch (data.type) {
            case 'start':
              setStatus('running')
              setError(null)
              if (data.maxRounds) setMaxRounds(data.maxRounds)
              retryCount = 0
              break
            case 'round':
              setCurrentRound(data.round || 1)
              if (data.maxRounds) setMaxRounds(data.maxRounds)
              setCurrentSpeaker(data.speaker || null)
              break
            case 'director_applied':
              setDirectiveFeedback(`导演指令已生效 -> ${data.speaker}: ${data.text}`)
              setDirectorQueue((prev) => Math.max(prev - 1, 0))
              break
            case 'message':
              setMessages((prev) => [
                ...prev,
                {
                  agentId: data.agentId,
                  agentName: data.agentName,
                  content: data.content,
                  innerThought: data.innerThought,
                  matchScore: data.matchScore,
                },
              ])
              if (data.matchScore !== undefined) {
                setMatchScore(data.matchScore)
              }
              break
            case 'end':
              setStatus('ended')
              setCurrentSpeaker(null)
              setMatchScore(data.matchScore || 0)
              eventSource.close()
              eventSourceRef.current = null
              break
            case 'error':
              setError(data.message || '流式连接错误')
              eventSource.close()
              eventSourceRef.current = null
              break
            default:
              break
          }
        } catch {
          setError('消息解析失败，请刷新重试')
        }
      }

      eventSource.onerror = () => {
        if (eventSourceRef.current) {
          eventSourceRef.current.close()
          eventSourceRef.current = null
        }

        if (retryCount < maxRetries) {
          retryCount += 1
          reconnectTimer = setTimeout(connect, retryCount * 1000)
        } else {
          setError('连接失败，请刷新页面重试')
        }
      }
    }

    connect()

    return () => {
      if (reconnectTimer) clearTimeout(reconnectTimer)
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }
    }
  }, [sessionId, initialStatus])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, directiveFeedback])

  const handleDirectorSubmit = async () => {
    const text = directorText.trim()
    if (!text || sendingDirective || status !== 'running') return

    setSendingDirective(true)
    try {
      const response = await fetch(`/api/matchmaking/${sessionId}/director`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, mood: directorMood || undefined }),
      })

      const result = await response.json()
      if (result.code !== 0) {
        setDirectiveFeedback(result.message || '导演指令发送失败')
        return
      }

      setDirectorQueue(result.data.queueLength || 0)
      setDirectiveFeedback('导演指令已入队，下一轮会生效')
      setDirectorText('')
    } catch {
      setDirectiveFeedback('导演指令发送失败，请重试')
    } finally {
      setSendingDirective(false)
    }
  }

  return (
    <div className="flex flex-col h-full relative overflow-hidden bg-[radial-gradient(circle_at_20%_10%,rgba(59,130,246,0.2),transparent_42%),radial-gradient(circle_at_80%_0%,rgba(236,72,153,0.25),transparent_40%),linear-gradient(140deg,#0b1020,#111a35_45%,#26123f)]">
      <div className="absolute inset-0 pointer-events-none opacity-30 bg-[linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:34px_34px]" />

      <div className="relative px-4 pt-4 pb-3 border-b border-white/10 bg-black/20 backdrop-blur-md">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-pink-500 to-fuchsia-500 text-white font-bold flex items-center justify-center">
              {agent1.name.charAt(0)}
            </div>
            <div className="min-w-0">
              <div className="text-sm text-white/70">左侧分身</div>
              <div className="font-semibold text-white truncate">{agent1.name}</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <MatchPulseMeter score={matchScore} />
            <div className="hidden sm:block">
              <LoveHearts score={matchScore} />
            </div>
          </div>

          <div className="flex items-center gap-3 min-w-0">
            <div className="min-w-0 text-right">
              <div className="text-sm text-white/70">右侧分身</div>
              <div className="font-semibold text-white truncate">{agent2.name}</div>
            </div>
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white font-bold flex items-center justify-center">
              {agent2.name.charAt(0)}
            </div>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
          <span className="px-2.5 py-1 rounded-full bg-white/15 border border-white/20 text-white">
            回合 {Math.max(currentRound, 1)} / {maxRounds}
          </span>
          <span className={`px-2.5 py-1 rounded-full border ${
            status === 'running'
              ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-200'
              : status === 'ended'
                ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-100'
                : 'bg-white/10 border-white/20 text-white/80'
          }`}>
            {status === 'running' ? '直播中' : status === 'ended' ? '已结束' : '准备中'}
          </span>
          {currentSpeaker && status === 'running' && (
            <span className="px-2.5 py-1 rounded-full bg-fuchsia-500/20 border border-fuchsia-400/40 text-fuchsia-100">
              当前发言: {currentSpeaker}
            </span>
          )}
          <span className="px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-400/40 text-amber-100">
            导演队列 {directorQueue}
          </span>
        </div>
      </div>

      <div className="relative px-4 py-3 border-b border-white/10 bg-black/25">
        <div className="flex flex-col gap-2">
          <div className="text-sm text-white/80 font-medium">导演模式</div>
          <div className="flex flex-wrap gap-2">
            {DIRECTOR_PRESETS.map((preset) => (
              <button
                key={preset}
                disabled={status !== 'running'}
                onClick={() => setDirectorText(preset)}
                className="px-2.5 py-1 rounded-full text-xs border border-white/20 bg-white/10 text-white/90 hover:bg-white/20 disabled:opacity-50"
              >
                {preset}
              </button>
            ))}
          </div>
          <div className="grid sm:grid-cols-[1fr_140px_120px] gap-2">
            <input
              value={directorText}
              onChange={(e) => setDirectorText(e.target.value)}
              placeholder="给下一轮发言一个导演指令，例如：别绕圈，直接聊婚姻观"
              disabled={status !== 'running'}
              className="px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/50 outline-none focus:border-cyan-300"
            />
            <input
              value={directorMood}
              onChange={(e) => setDirectorMood(e.target.value)}
              placeholder="情绪风格(可选)"
              disabled={status !== 'running'}
              className="px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/50 outline-none focus:border-cyan-300"
            />
            <button
              onClick={handleDirectorSubmit}
              disabled={!directorText.trim() || status !== 'running' || sendingDirective}
              className="px-4 py-2 rounded-lg bg-cyan-400 text-slate-950 font-semibold hover:bg-cyan-300 disabled:opacity-50"
            >
              {sendingDirective ? '发送中' : '推送指令'}
            </button>
          </div>
          {directiveFeedback && (
            <div className="text-xs text-cyan-100 bg-cyan-500/20 border border-cyan-300/30 rounded-lg px-3 py-2">
              {directiveFeedback}
            </div>
          )}
          {error && (
            <div className="text-xs text-rose-100 bg-rose-500/25 border border-rose-300/40 rounded-lg px-3 py-2">
              {error}
            </div>
          )}
        </div>
      </div>

      <div className="relative flex-1 overflow-y-auto px-4 py-5 space-y-4">
        {messages.length === 0 && (status === 'loading' || status === 'running') && (
          <div className="text-center py-14">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-white/80">
              对话即将开始，请准备导演指令
            </div>
          </div>
        )}

        {messages.map((msg, index) => {
          const isLeft = msg.agentId === agent1.id
          return (
            <div key={`${msg.agentId}-${index}`} className="cinema-fade-in">
              <ChatBubble
                agentName={msg.agentName}
                content={msg.content}
                innerThought={msg.innerThought}
                isLeft={isLeft}
                avatar={isLeft ? agent1.avatar : agent2.avatar}
              />
            </div>
          )
        })}

        <div ref={messagesEndRef} />

        {status === 'ended' && (
          <div className="pt-4">
            <div className="rounded-2xl bg-white p-3">
              <MatchResult matchScore={matchScore} agent1Name={agent1.name} agent2Name={agent2.name} />
            </div>
            <RecapCard
              matchScore={matchScore}
              agent1Name={agent1.name}
              agent2Name={agent2.name}
              messages={messages}
            />
          </div>
        )}
      </div>
    </div>
  )
}
