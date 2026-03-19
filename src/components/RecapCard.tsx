'use client'

import { useMemo, useState } from 'react'

type RecapMessage = {
  agentName: string
  content: string
  innerThought?: string | null
}

interface RecapCardProps {
  matchScore: number
  agent1Name: string
  agent2Name: string
  messages: RecapMessage[]
}

type Metric = {
  label: string
  value: number
}

const TOPIC_KEYWORDS = [
  '旅行', '电影', '音乐', '美食', '运动', '工作', '家庭', '宠物',
  '游戏', '阅读', '摄影', '编程', '学习', '理想', '婚姻', '价值观',
]

const POSITIVE_WORDS = ['喜欢', '开心', '期待', '不错', '有趣', '合适', '共鸣', '温柔', '真诚', '太棒了']
const NEGATIVE_WORDS = ['尴尬', '无聊', '算了', '不太', '一般', '冷场', '怀疑', '犹豫', '抱歉', '走神']

const clamp = (value: number, min = 0, max = 100) => Math.max(min, Math.min(max, value))

function metricColor(value: number) {
  if (value >= 80) return 'text-fuchsia-300'
  if (value >= 60) return 'text-cyan-300'
  if (value >= 40) return 'text-amber-300'
  return 'text-slate-300'
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const chars = text.split('')
  const lines: string[] = []
  let line = ''

  for (const ch of chars) {
    const test = line + ch
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line)
      line = ch
    } else {
      line = test
    }
  }

  if (line) lines.push(line)
  return lines
}

export function RecapCard({ matchScore, agent1Name, agent2Name, messages }: RecapCardProps) {
  const [copied, setCopied] = useState(false)

  const analysis = useMemo(() => {
    const first = messages[0]
    const last = messages[messages.length - 1]
    const peak = [...messages].sort((a, b) => b.content.length - a.content.length)[0]

    const perAgent = new Map<string, string[]>()
    for (const msg of messages) {
      const list = perAgent.get(msg.agentName) ?? []
      list.push(msg.content)
      perAgent.set(msg.agentName, list)
    }

    const allText = messages.map((m) => m.content).join('\n')
    const positiveHits = POSITIVE_WORDS.reduce((acc, word) => acc + (allText.match(new RegExp(word, 'g'))?.length ?? 0), 0)
    const negativeHits = NEGATIVE_WORDS.reduce((acc, word) => acc + (allText.match(new RegExp(word, 'g'))?.length ?? 0), 0)
    const positivity = clamp(55 + (positiveHits - negativeHits) * 8)

    const questionCount = (allText.match(/[?？]/g) ?? []).length
    const initiative = clamp(35 + questionCount * 10 + Math.min(messages.length, 10) * 4)

    const avgLength = messages.length ? allText.length / messages.length : 0
    const depth = clamp(30 + avgLength * 1.7)

    const topicByAgent = [...perAgent.entries()].map(([name, list]) => {
      const joined = list.join('\n')
      const topics = new Set(TOPIC_KEYWORDS.filter((topic) => joined.includes(topic)))
      return { name, topics }
    })

    let overlap = 0
    if (topicByAgent.length >= 2) {
      for (const topic of topicByAgent[0].topics) {
        if (topicByAgent[1].topics.has(topic)) overlap++
      }
    }
    const resonance = clamp(40 + overlap * 15 + Math.min(questionCount, 5) * 4)

    const metrics: Metric[] = [
      { label: '情绪热度', value: Math.round(positivity) },
      { label: '话题共鸣', value: Math.round(resonance) },
      { label: '沟通主动', value: Math.round(initiative) },
      { label: '交流深度', value: Math.round(depth) },
    ]

    const advice: string[] = []
    if (metrics[0].value < 60) advice.push('增加积极反馈，先认可再表达观点。')
    if (metrics[1].value < 60) advice.push('多追问共同兴趣，别急着换话题。')
    if (metrics[2].value < 60) advice.push('每轮至少抛出一个具体问题，避免冷场。')
    if (metrics[3].value < 60) advice.push('从事实延伸到价值观，话题会更深入。')
    if (!advice.length) advice.push('节奏与氛围都很好，可以尝试更深层的未来话题。')

    return { first, peak, last, metrics, advice }
  }, [messages])

  const polygonPoints = useMemo(() => {
    const center = 140
    const radius = 86
    const total = analysis.metrics.length

    const points = analysis.metrics.map((metric, index) => {
      const angle = -Math.PI / 2 + (2 * Math.PI * index) / total
      const ratio = metric.value / 100
      const x = center + radius * ratio * Math.cos(angle)
      const y = center + radius * ratio * Math.sin(angle)
      return `${x},${y}`
    })

    return points.join(' ')
  }, [analysis.metrics])

  const axisPoints = useMemo(() => {
    const center = 140
    const radius = 90
    const total = analysis.metrics.length
    return analysis.metrics.map((metric, index) => {
      const angle = -Math.PI / 2 + (2 * Math.PI * index) / total
      return {
        label: metric.label,
        x: center + radius * Math.cos(angle),
        y: center + radius * Math.sin(angle),
      }
    })
  }, [analysis.metrics])

  const summaryText = useMemo(() => {
    return [
      `《AI 相亲高光战报》`,
      `${agent1Name} x ${agent2Name}`,
      `匹配度：${Math.round(matchScore)}%`,
      ...analysis.metrics.map((metric) => `${metric.label}: ${metric.value}`),
      `高光时刻：${analysis.peak?.agentName || '未知'} - ${analysis.peak?.content || '暂无'}`,
      `建议：${analysis.advice[0]}`,
    ].join('\n')
  }, [agent1Name, agent2Name, matchScore, analysis])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(summaryText)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      setCopied(false)
    }
  }

  const handleDownloadPoster = () => {
    const canvas = document.createElement('canvas')
    canvas.width = 1080
    canvas.height = 1350
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const gradient = ctx.createLinearGradient(0, 0, 1080, 1350)
    gradient.addColorStop(0, '#0f172a')
    gradient.addColorStop(0.5, '#1d4ed8')
    gradient.addColorStop(1, '#a21caf')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    ctx.fillStyle = 'rgba(255,255,255,0.15)'
    ctx.fillRect(60, 60, 960, 1230)

    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 58px "Noto Sans SC", sans-serif'
    ctx.fillText('AI 相亲高光战报', 100, 170)

    ctx.font = '42px "Noto Sans SC", sans-serif'
    ctx.fillText(`${agent1Name} × ${agent2Name}`, 100, 250)

    ctx.font = 'bold 148px "Noto Sans SC", sans-serif'
    ctx.fillText(`${Math.round(matchScore)}%`, 100, 420)

    ctx.font = '34px "Noto Sans SC", sans-serif'
    let y = 520
    for (const metric of analysis.metrics) {
      ctx.fillText(`${metric.label}: ${metric.value}`, 100, y)
      y += 56
    }

    ctx.font = 'bold 36px "Noto Sans SC", sans-serif'
    ctx.fillText('高光片段', 100, 820)
    ctx.font = '30px "Noto Sans SC", sans-serif'

    const highlight = `${analysis.peak?.agentName || '未知'}：${analysis.peak?.content || '暂无'}`
    const lines = wrapText(ctx, highlight, 860).slice(0, 4)
    let textY = 880
    for (const line of lines) {
      ctx.fillText(line, 100, textY)
      textY += 48
    }

    ctx.font = 'bold 36px "Noto Sans SC", sans-serif'
    ctx.fillText('下一步建议', 100, 1110)
    ctx.font = '30px "Noto Sans SC", sans-serif'
    const adviceLines = wrapText(ctx, analysis.advice[0], 860).slice(0, 2)
    for (const line of adviceLines) {
      ctx.fillText(line, 100, textY)
      textY += 48
    }

    const link = document.createElement('a')
    link.download = `match-recap-${Date.now()}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  return (
    <section className="mt-6 rounded-3xl p-6 bg-gradient-to-br from-slate-900 via-blue-950 to-fuchsia-950 border border-white/20 text-white shadow-2xl">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-xl font-semibold">赛后高光复盘卡</h3>
        <div className="text-sm text-white/70">{agent1Name} x {agent2Name}</div>
      </div>

      <div className="mt-6 grid md:grid-cols-[300px_1fr] gap-6">
        <div className="rounded-2xl bg-white/10 border border-white/20 p-4">
          <svg viewBox="0 0 280 280" className="w-full">
            <polygon points="140,50 230,140 140,230 50,140" fill="none" stroke="rgba(255,255,255,0.25)" />
            <polygon points={polygonPoints} fill="rgba(56,189,248,0.35)" stroke="#67e8f9" strokeWidth="2.5" />
            {axisPoints.map((point) => (
              <g key={point.label}>
                <line x1="140" y1="140" x2={point.x} y2={point.y} stroke="rgba(255,255,255,0.2)" />
                <text x={point.x} y={point.y} fill="white" fontSize="12" textAnchor="middle" dy={point.y < 140 ? -8 : 16}>
                  {point.label}
                </text>
              </g>
            ))}
          </svg>
        </div>

        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">
            {analysis.metrics.map((metric) => (
              <div key={metric.label} className="rounded-xl bg-white/10 border border-white/15 px-4 py-3">
                <div className="text-sm text-white/70">{metric.label}</div>
                <div className={`text-2xl font-bold ${metricColor(metric.value)}`}>{metric.value}</div>
              </div>
            ))}
          </div>

          <div className="rounded-xl bg-white/10 border border-white/15 p-4 space-y-3">
            <div className="text-sm text-white/80">关键转折</div>
            <p className="text-sm text-white/90">破冰: {analysis.first ? `${analysis.first.agentName}「${analysis.first.content}」` : '暂无'}</p>
            <p className="text-sm text-white/90">高光: {analysis.peak ? `${analysis.peak.agentName}「${analysis.peak.content}」` : '暂无'}</p>
            <p className="text-sm text-white/90">收官: {analysis.last ? `${analysis.last.agentName}「${analysis.last.content}」` : '暂无'}</p>
          </div>

          <div className="rounded-xl bg-white/10 border border-white/15 p-4">
            <div className="text-sm text-white/80 mb-2">下一场建议</div>
            <ul className="space-y-1 text-sm text-white/90">
              {analysis.advice.map((item) => (
                <li key={item}>- {item}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          onClick={handleDownloadPoster}
          className="px-4 py-2 rounded-lg bg-cyan-400 text-slate-950 font-semibold hover:bg-cyan-300 transition-colors"
        >
          下载分享海报
        </button>
        <button
          onClick={handleCopy}
          className="px-4 py-2 rounded-lg bg-white/15 border border-white/25 text-white hover:bg-white/25 transition-colors"
        >
          {copied ? '已复制战报' : '复制战报文案'}
        </button>
      </div>
    </section>
  )
}
