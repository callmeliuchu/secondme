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
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const eventSourceRef = useRef<EventSource | null>(null)

  useEffect(() => {
    if (initialMessages) {
      setMessages(initialMessages)
    }

    // 开始 SSE 连接
    const eventSource = new EventSource(`/api/debate/${debateId}/stream`)
    eventSourceRef.current = eventSource

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)

        if (data.type === 'message') {
          // 流式消息
          setStreamingContent((prev) => ({
            side: data.side,
            content: (prev?.content || '') + data.content,
          }))
        } else if (data.type === 'end') {
          // 流式结束，将内容添加到消息列表
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
          // 人格介绍
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

    eventSource.onerror = () => {
      eventSource.close()
    }

    return () => {
      eventSource.close()
    }
  }, [debateId])

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingContent])

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
