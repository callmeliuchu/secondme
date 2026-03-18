'use client'

import { useState, useEffect } from 'react'

interface VotePanelProps {
  debateId: string
  initialVotes?: {
    positive: number
    negative: number
  }
}

export function VotePanel({ debateId, initialVotes }: VotePanelProps) {
  const [votes, setVotes] = useState(initialVotes || { positive: 0, negative: 0 })
  const [userVote, setUserVote] = useState<'positive' | 'negative' | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (initialVotes) {
      setVotes(initialVotes)
    }
  }, [initialVotes])

  const handleVote = async (side: 'positive' | 'negative') => {
    if (loading) return

    try {
      setLoading(true)
      const response = await fetch(`/api/debate/${debateId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ side }),
      })

      const result = await response.json()

      if (result.code === 0) {
        setUserVote(side)
        setVotes((prev) => ({
          ...prev,
          [side]: prev[side] + 1,
        }))
      } else {
        alert(result.message || '投票失败')
      }
    } catch (err) {
      console.error('投票失败:', err)
    } finally {
      setLoading(false)
    }
  }

  const total = votes.positive + votes.negative
  const positivePercent = total > 0 ? Math.round((votes.positive / total) * 100) : 50

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <h3 className="font-medium text-gray-900 mb-4">投票支持</h3>

      <div className="space-y-3">
        {/* 正方 */}
        <button
          onClick={() => handleVote('positive')}
          disabled={loading || userVote === 'positive'}
          className={`w-full p-3 rounded-lg border-2 transition-colors ${
            userVote === 'positive'
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-blue-300'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="font-medium text-blue-600">正方</span>
            <span className="text-sm text-gray-500">{votes.positive} 票</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all"
              style={{ width: `${positivePercent}%` }}
            />
          </div>
        </button>

        {/* 反方 */}
        <button
          onClick={() => handleVote('negative')}
          disabled={loading || userVote === 'negative'}
          className={`w-full p-3 rounded-lg border-2 transition-colors ${
            userVote === 'negative'
              ? 'border-red-500 bg-red-50'
              : 'border-gray-200 hover:border-red-300'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="font-medium text-red-600">反方</span>
            <span className="text-sm text-gray-500">{votes.negative} 票</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-red-500 transition-all"
              style={{ width: `${100 - positivePercent}%` }}
            />
          </div>
        </button>
      </div>
    </div>
  )
}
