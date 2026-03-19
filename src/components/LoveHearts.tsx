'use client'

interface LoveHeartsProps {
  score: number
}

export function LoveHearts({ score }: LoveHeartsProps) {
  const filledCount = score < 31 ? 0 : score < 51 ? 1 : score < 71 ? 3 : 5
  const hearts = [false, false, false, false, false].map((_, i) => i < filledCount)

  const getHeartStyle = (index: number, filled: boolean) => {
    const base = 'text-2xl transition-all duration-300'
    if (!filled) return `${base} text-gray-300`
    if (score >= 86) return `${base} text-yellow-400 animate-pulse drop-shadow-lg`
    if (score >= 71) return `${base} text-rose-500 animate-bounce`
    return `${base} text-pink-500 animate-pulse`
  }

  return (
    <div className="flex items-center gap-1">
      {[0, 1, 2, 3, 4].map(i => (
        <span key={i} className={getHeartStyle(i, hearts[i])}>
          {hearts[i] ? '❤️' : '🖤'}
        </span>
      ))}
    </div>
  )
}
