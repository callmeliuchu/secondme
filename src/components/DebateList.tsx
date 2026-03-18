'use client'

import { useState, useEffect } from 'react'
import { DebateCard } from './DebateCard'

interface DebateListProps {
  onDebateClick?: (id: string) => void
}

export function DebateList({ onDebateClick }: DebateListProps) {
  const [debates, setDebates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDebates()
  }, [])

  const fetchDebates = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/debate')
      const result = await response.json()

      if (result.code === 0) {
        setDebates(result.data)
      } else {
        setError(result.message || '获取辩论列表失败')
      }
    } catch (err) {
      setError('网络错误')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12 text-red-500">
        {error}
      </div>
    )
  }

  if (debates.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        暂无辩论，点击上方按钮发起第一场辩论
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {debates.map((debate) => (
        <DebateCard
          key={debate.id}
          debate={debate}
          onClick={() => onDebateClick?.(debate.id)}
        />
      ))}
    </div>
  )
}
