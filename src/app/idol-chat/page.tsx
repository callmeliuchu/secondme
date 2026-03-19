'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { CharacterCorridor } from '@/components/CharacterCorridor'

type Idol = {
  id: string
  name: string
  personality: string
  hobbies?: string | null
  appearance?: string | null
  intro?: string | null
  avatar?: string | null
}

type ChatItem = {
  role: 'user' | 'assistant'
  content: string
}

export default function IdolChatPage() {
  const [idols, setIdols] = useState<Idol[]>([])
  const [selectedIdolId, setSelectedIdolId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatItem[]>([])
  const [input, setInput] = useState('')
  const [loadingIdols, setLoadingIdols] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const scrollRef = useRef<HTMLDivElement>(null)
  const selectedIdol = useMemo(
    () => idols.find((idol) => idol.id === selectedIdolId) || null,
    [idols, selectedIdolId]
  )

  useEffect(() => {
    const fetchIdols = async () => {
      setLoadingIdols(true)
      setError(null)
      try {
        const res = await fetch('/api/platform-agents')
        const data = await res.json()
        if (data.code === 0) {
          setIdols(data.data)
          setSelectedIdolId(data.data[0]?.id || null)
        } else {
          setError(data.message || '加载偶像失败')
        }
      } catch {
        setError('加载偶像失败')
      } finally {
        setLoadingIdols(false)
      }
    }

    fetchIdols()
  }, [])

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, sending])

  useEffect(() => {
    setMessages([])
  }, [selectedIdolId])

  const updateLastAssistantMessage = (content: string) => {
    setMessages((prev) => {
      if (!prev.length) return prev
      const next = [...prev]
      const last = next[next.length - 1]
      if (last.role !== 'assistant') return prev
      next[next.length - 1] = { ...last, content }
      return next
    })
  }

  const sendMessage = async () => {
    if (!selectedIdolId || sending) return

    const message = input.trim()
    if (!message) return

    const history = messages.slice(-10).map((item) => ({ role: item.role, content: item.content }))
    setInput('')
    setSending(true)
    setError(null)

    setMessages((prev) => [...prev, { role: 'user', content: message }, { role: 'assistant', content: '' }])

    try {
      const response = await fetch('/api/idol-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idolId: selectedIdolId,
          message,
          history,
        }),
      })

      if (!response.ok || !response.body) {
        const fallback = await response.json().catch(() => ({ message: '虚拟偶像掉线了，请稍后再试' }))
        throw new Error(fallback.message || '虚拟偶像掉线了，请稍后再试')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let assistantText = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        assistantText += decoder.decode(value, { stream: true })
        updateLastAssistantMessage(assistantText)
      }

      if (!assistantText.trim()) {
        updateLastAssistantMessage('舞台灯光闪了一下，我刚刚没听清，你再说一次好不好？')
      }
    } catch (e) {
      const text = e instanceof Error ? e.message : '虚拟偶像掉线了，请稍后再试'
      updateLastAssistantMessage(`抱歉，当前连接中断：${text}`)
      setError(text)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="min-h-screen neo-mesh relative neo-grid overflow-hidden">
      <header className="sticky top-0 z-20 border-b border-white/15 bg-slate-950/35 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between gap-3">
          <div>
            <div className="text-sm text-cyan-100/80 tracking-wide">Virtual Idol Studio</div>
            <h1 className="text-lg font-semibold text-white">虚拟偶像对话舱</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/matchmaking" className="px-4 py-2 rounded-xl border border-white/30 text-white/90 hover:bg-white/10 text-sm">
              相亲模式
            </Link>
            <Link href="/" className="px-4 py-2 rounded-xl border border-white/30 text-white/90 hover:bg-white/10 text-sm">
              返回首页
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 md:py-10 space-y-6">
        {loadingIdols ? (
          <section className="neo-card rounded-3xl p-8 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-cyan-300 border-t-transparent rounded-full animate-spin" />
          </section>
        ) : (
          <>
            {idols.length > 0 ? (
              <CharacterCorridor
                agents={idols}
                selectedAgentId={selectedIdolId}
                onSelect={setSelectedIdolId}
              />
            ) : (
              <section className="neo-card rounded-3xl p-8 text-white/80">
                当前没有可用的虚拟偶像，请先执行种子数据初始化。
              </section>
            )}

            <section className="grid gap-6 lg:grid-cols-[360px_1fr]">
              <aside className="neo-card rounded-3xl p-5 md:p-6">
                <h2 className="text-lg font-semibold text-white mb-4">当前登台角色</h2>
                {selectedIdol ? (
                  <div className="space-y-4">
                    <div className="rounded-2xl border border-white/20 bg-white/10 p-4">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-300 to-fuchsia-400 mb-3 overflow-hidden flex items-center justify-center text-2xl text-slate-950 font-bold">
                        {selectedIdol.avatar ? (
                          <img src={selectedIdol.avatar} alt={selectedIdol.name} className="w-full h-full object-cover" />
                        ) : (
                          selectedIdol.name.charAt(0)
                        )}
                      </div>
                      <div className="font-semibold text-white text-lg">{selectedIdol.name}</div>
                      <div className="text-sm text-cyan-100/90 mt-1">{selectedIdol.personality}</div>
                    </div>

                    <div className="rounded-2xl border border-white/20 bg-white/5 p-4 text-sm text-white/85 leading-6">
                      {selectedIdol.intro || selectedIdol.appearance || '这是一个尚未公开完整设定的角色。'}
                    </div>
                  </div>
                ) : (
                  <div className="text-white/70 text-sm">请先在上方走廊选择一个偶像。</div>
                )}
              </aside>

              <section className="neo-glass rounded-3xl p-4 md:p-5 flex flex-col min-h-[560px]">
                <div className="pb-3 px-1 border-b border-white/15">
                  <div className="text-white font-medium">实时对话</div>
                  <div className="text-xs text-white/65 mt-1">和偶像聊天，剧情会根据你每句话实时变化</div>
                </div>

                <div className="flex-1 overflow-y-auto px-1 py-4 space-y-3">
                  {messages.length === 0 ? (
                    <div className="h-full flex items-center justify-center">
                      <div className="text-center text-white/70">
                        <p>舞台已经准备就绪。</p>
                        <p className="text-sm mt-1">发第一句话，让偶像开麦。</p>
                      </div>
                    </div>
                  ) : (
                    messages.map((item, index) => (
                      <div
                        key={`${item.role}-${index}`}
                        className={`flex ${item.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in-right`}
                      >
                        <div
                          className={`max-w-[84%] rounded-2xl px-4 py-3 text-sm leading-6 ${
                            item.role === 'user'
                              ? 'bg-gradient-to-r from-cyan-300 to-violet-300 text-slate-950'
                              : 'bg-white/12 border border-white/15 text-white'
                          }`}
                        >
                          {item.content || (sending && item.role === 'assistant' ? '...' : '')}
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={scrollRef} />
                </div>

                <div className="pt-3 border-t border-white/15">
                  <div className="flex gap-2">
                    <input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          void sendMessage()
                        }
                      }}
                      placeholder={selectedIdol ? `对 ${selectedIdol.name} 说点什么...` : '先选择一个偶像'}
                      disabled={!selectedIdolId || sending}
                      className="flex-1 rounded-xl border border-white/25 bg-slate-950/40 text-white placeholder:text-white/45 px-4 py-3 outline-none focus:border-cyan-300/80 disabled:opacity-60"
                    />
                    <button
                      type="button"
                      onClick={() => void sendMessage()}
                      disabled={!selectedIdolId || sending || !input.trim()}
                      className="neo-button px-5 py-3 disabled:opacity-50"
                    >
                      {sending ? '连线中...' : '发送'}
                    </button>
                  </div>
                  {error && <p className="text-xs text-rose-200/90 mt-2">{error}</p>}
                </div>
              </section>
            </section>
          </>
        )}
      </main>
    </div>
  )
}
