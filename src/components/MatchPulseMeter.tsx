'use client'

interface MatchPulseMeterProps {
  score: number
}

export function MatchPulseMeter({ score }: MatchPulseMeterProps) {
  const safeScore = Math.max(0, Math.min(100, score))
  const radius = 34
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (safeScore / 100) * circumference

  const ringColor =
    safeScore >= 80
      ? 'text-fuchsia-300'
      : safeScore >= 60
        ? 'text-cyan-300'
        : safeScore >= 40
          ? 'text-amber-300'
          : 'text-slate-400'

  return (
    <div className="relative w-24 h-24 flex items-center justify-center">
      <div className="absolute inset-0 rounded-full bg-white/10 blur-xl animate-pulse" />
      <svg className="w-24 h-24 -rotate-90" viewBox="0 0 88 88">
        <circle cx="44" cy="44" r={radius} stroke="currentColor" strokeWidth="7" className="text-white/20" fill="none" />
        <circle
          cx="44"
          cy="44"
          r={radius}
          stroke="currentColor"
          strokeWidth="7"
          className={`${ringColor} transition-all duration-700 ease-out`}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
        />
      </svg>
      <div className="absolute text-center leading-tight">
        <div className="text-lg font-bold text-white">{safeScore}</div>
        <div className="text-[10px] uppercase tracking-widest text-white/70">match</div>
      </div>
    </div>
  )
}
