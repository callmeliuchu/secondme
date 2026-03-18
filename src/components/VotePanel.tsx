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
    if (loading || userVote) return

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
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
      <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        投票支持
      </h3>

      <div className="space-y-3">
        {/* 正方 */}
        <button
          onClick={() => handleVote('positive')}
          disabled={loading || !!userVote}
          className={`w-full p-4 rounded-xl border-2 transition-all duration-200 ${
            userVote === 'positive'
              ? 'border-blue-500 bg-blue-50 shadow-md'
              : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
          } ${userVote ? 'opacity-75' : ''}`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-blue-600">正方</span>
            <span className="text-sm font-medium text-gray-500">{votes.positive} 票</span>
          </div>
          <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-400 to-blue-500 transition-all duration-500"
              style={{ width: `${positivePercent}%` }}
            />
          </div>
          <div className="text-right text-xs text-blue-500 mt-1">{positivePercent}%</div>
        </button>

        {/* 反方 */}
        <button
          onClick={() => handleVote('negative')}
          disabled={loading || !!userVote}
          className={`w-full p-4 rounded-xl border-2 transition-all duration-200 ${
            userVote === 'negative'
              ? 'border-red-500 bg-red-50 shadow-md'
              : 'border-gray-200 hover:border-red-300 hover:shadow-md'
          } ${userVote ? 'opacity-75' : ''}`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-red-600">反方</span>
            <span className="text-sm font-medium text-gray-500">{votes.negative} 票</span>
          </div>
          <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-red-400 to-red-500 transition-all duration-500"
              style={{ width: `${100 - positivePercent}%` }}
            />
          </div>
          <div className="text-right text-xs text-red-500 mt-1">{100 - positivePercent}%</div>
        </button>
      </div>

      {userVote && (
        <p className="text-center text-sm text-gray-500 mt-4">
          你已投票，支持 {userVote === 'positive' ? '正方' : '反方'}
        </p>
      )}
    </div>
  )
}
