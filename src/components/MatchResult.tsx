interface MatchResultProps {
  matchScore: number
  agent1Name: string
  agent2Name: string
}

export function MatchResult({ matchScore, agent1Name, agent2Name }: MatchResultProps) {
  const getResultText = (score: number) => {
    if (score >= 80) return { text: '天作之合', emoji: '💕', color: 'text-pink-500' }
    if (score >= 60) return { text: '很有缘分', emoji: '✨', color: 'text-purple-500' }
    if (score >= 40) return { text: '可以试试', emoji: '🤔', color: 'text-blue-500' }
    return { text: '还需努力', emoji: '💪', color: 'text-gray-500' }
  }

  const result = getResultText(matchScore)

  return (
    <div className="text-center py-8">
      <div className="text-6xl mb-4">{result.emoji}</div>
      <h3 className={`text-2xl font-bold mb-2 ${result.color}`}>{result.text}</h3>

      <div className="mt-6 inline-flex items-center gap-4">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
            {agent1Name.charAt(0)}
          </div>
          <p className="text-sm text-gray-600 mt-1">{agent1Name}</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
        </div>

        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center text-white font-bold text-lg">
            {agent2Name.charAt(0)}
          </div>
          <p className="text-sm text-gray-600 mt-1">{agent2Name}</p>
        </div>
      </div>

      <div className="mt-8">
        <div className="text-5xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
          {matchScore}%
        </div>
        <p className="text-sm text-gray-400 mt-1">匹配度</p>
      </div>
    </div>
  )
}