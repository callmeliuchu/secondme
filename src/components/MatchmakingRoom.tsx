'use client'

import { useEffect, useState, useRef } from 'react'
import { ChatBubble } from './ChatBubble'
import { MatchResult } from './MatchResult'
import { LoveHearts } from './LoveHearts'

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
}

export function MatchmakingRoom({ sessionId, agent1, agent2 }: MatchmakingRoomProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [status, setStatus] = useState<'loading' | 'running' | 'ended'>('loading')
  const [matchScore, setMatchScore] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let retryCount = 0
    const maxRetries = 3

    const connect = () => {
      const eventSource = new EventSource(`/api/matchmaking/${sessionId}/stream`)

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)

          switch (data.type) {
            case 'start':
              setStatus('running')
              setError(null)
              retryCount = 0
              break
            case 'message':
              setMessages((prev) => [...prev, {
                agentId: data.agentId,
                agentName: data.agentName,
                content: data.content,
                innerThought: data.innerThought,
                matchScore: data.matchScore,
              }])
              if (data.matchScore !== undefined) {
                setMatchScore(data.matchScore)
              }
              break
            case 'end':
              setStatus('ended')
              setMatchScore(data.matchScore || 0)
              eventSource.close()
              break
            case 'error':
              setError(data.message)
              eventSource.close()
              break
          }
        } catch (e) {
          console.error('Failed to parse SSE data:', e)
        }
      }

      eventSource.onerror = () => {
        if (retryCount < maxRetries) {
          retryCount++
          eventSource.close()
          setTimeout(connect, 1000 * retryCount)
        } else {
          setError('连接失败，请刷新页面重试')
          eventSource.close()
        }
      }
    }

    connect()

    return () => {
      // Cleanup handled in onerror/close
    }
  }, [sessionId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (status === 'ended') {
    return <MatchResult matchScore={matchScore} agent1Name={agent1.name} agent2Name={agent2.name} />
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-center gap-4 px-4 py-4 border-b border-gray-100 bg-white">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
            {agent1.name.charAt(0)}
          </div>
          <div className="text-sm mt-1">{agent1.name}</div>
        </div>

        <div className="flex flex-col items-center">
          <LoveHearts score={matchScore} />
          <span className="text-xs text-gray-500 mt-1">{matchScore}%</span>
        </div>

        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-white font-bold text-lg">
            {agent2.name.charAt(0)}
          </div>
          <div className="text-sm mt-1">{agent2.name}</div>
        </div>
      </div>

      <div className="absolute top-16 right-4">
        {status === 'running' && (
          <span className="flex items-center gap-1.5 text-sm text-green-600 bg-white px-2 py-1 rounded-full shadow-sm">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            相亲中
          </span>
        )}
        {status === 'loading' && (
          <span className="flex items-center gap-1.5 text-sm text-gray-400 bg-white px-2 py-1 rounded-full shadow-sm">
            <span className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" />
            等待开始
          </span>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mx-4 mt-4 px-4 py-3 bg-red-50 text-red-600 text-sm rounded-lg">
          {error}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && status === 'running' && (
          <div className="text-center py-8">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-pink-50 flex items-center justify-center">
              <svg className="w-6 h-6 text-pink-400 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-gray-500">对话即将开始...</p>
          </div>
        )}

        {messages.map((msg, index) => {
          const isLeft = msg.agentId === agent1.id
          return (
            <ChatBubble
              key={index}
              agentName={msg.agentName}
              agentId={msg.agentId}
              content={msg.content}
              innerThought={msg.innerThought}
              isLeft={isLeft}
              avatar={isLeft ? agent1.avatar : agent2.avatar}
            />
          )
        })}

        <div ref={messagesEndRef} />
      </div>
    </div>
  )
}