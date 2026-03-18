'use client'

import { useState, useEffect, useRef } from 'react'
import { DebateMessage } from './DebateMessage'

interface DebatePanelProps {
  debateId: string
  messages?: Array<{
    id: string
    role: 'positive' | 'negative' | 'user'
    content: string
  }>
}

export function DebatePanel({ debateId, messages: initialMessages }: DebatePanelProps) {
  const [messages, setMessages] = useState(initialMessages || [])
  const [streamingContent, setStreamingContent] = useState<{
    side: 'positive' | 'negative'
    content: string
  } | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [status, setStatus] = useState<'waiting' | 'debating' | 'ended'>('waiting')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (initialMessages) {
      setMessages(initialMessages)
    }

    const startStream = async () => {
      try {
        const response = await fetch(`/api/debate/${debateId}/stream`, {
          method: 'GET',
          credentials: 'include',
        })

        if (!response.ok || !response.body) {
          console.error('SSE 连接失败:', response.status)
          return
        }

        setIsConnected(true)
        setStatus('debating')
        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6))

                if (data.type === 'message') {
                  setStreamingContent((prev) => ({
                    side: data.side,
                    content: (prev?.content || '') + data.content,
                  }))
                } else if (data.type === 'end') {
                  if (streamingContent) {
                    setMessages((prev) => [
                      ...prev,
                      {
                        id: Date.now().toString(),
                        role: streamingContent.side,
                        content: streamingContent.content,
                      },
                    ])
                    setStreamingContent(null)
                  }
                  setStatus('ended')
                } else if (data.type === 'persona') {
                  setMessages((prev) => [
                    ...prev,
                    {
                      id: Date.now().toString(),
                      role: data.side,
                      content: data.content,
                    },
                  ])
                } else if (data.type === 'error') {
                  console.error('辩论错误:', data.message)
                }
              } catch (err) {
                console.error('解析消息失败:', err)
              }
            }
          }
        }
      } catch (err) {
        console.error('SSE 连接错误:', err)
      }
    }

    startStream()
  }, [debateId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingContent])

  return (
    <div className="flex flex-col h-full">
      {/* 状态栏 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${
            status === 'debating' ? 'bg-green-500 animate-pulse' :
            status === 'ended' ? 'bg-gray-400' : 'bg-yellow-500'
          }`} />
          <span className="text-sm text-gray-600">
            {status === 'debating' ? '辩论进行中' :
             status === 'ended' ? '辩论已结束' : '等待开始...'}
          </span>
        </div>
        <span className="text-xs text-gray-400">
          {messages.length} 条消息
        </span>
      </div>

      {/* 消息区域 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && !streamingContent && (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <svg className="w-12 h-12 mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p>AI 正在准备辩论...</p>
          </div>
        )}

        {messages.map((msg) => (
          <DebateMessage key={msg.id} role={msg.role} content={msg.content} />
        ))}

        {streamingContent && (
          <DebateMessage
            role={streamingContent.side}
            content={streamingContent.content}
            isStreaming
          />
        )}

        <div ref={messagesEndRef} />
      </div>
    </div>
  )
}
