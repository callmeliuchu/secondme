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
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (initialMessages) {
      setMessages(initialMessages)
    }

    // 使用 fetch 获取 SSE 流
    const startStream = async () => {
      try {
        const response = await fetch(`/api/debate/${debateId}/stream`, {
          method: 'GET',
          credentials: 'include', // 包含 cookie
        })

        if (!response.ok) {
          console.error('SSE 连接失败:', response.status)
          return
        }

        if (!response.body) {
          console.error('SSE 响应体为空')
          return
        }

        setIsConnected(true)
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

    return () => {
      if (abortRef.current) {
        abortRef.current.abort()
      }
    }
  }, [debateId])

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingContent])

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {!isConnected && messages.length === 0 && (
        <div className="flex items-center justify-center h-full text-gray-400">
          等待辩论开始...
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
  )
}
