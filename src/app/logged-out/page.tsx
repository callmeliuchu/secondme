import Link from 'next/link'

export default function LoggedOutPage() {
  return (
    <div className="min-h-screen neo-mesh relative neo-grid overflow-hidden">
      <main className="max-w-3xl mx-auto px-4 min-h-screen flex items-center">
        <section className="w-full neo-glass rounded-3xl p-8 md:p-10 text-center">
          <div className="mx-auto w-20 h-20 rounded-3xl bg-gradient-to-br from-cyan-300 to-fuchsia-500 text-slate-950 font-bold text-xl flex items-center justify-center shadow-lg shadow-fuchsia-500/35">
            BYE
          </div>

          <h1 className="mt-5 text-3xl md:text-4xl font-bold text-white">你已安全退出</h1>
          <p className="mt-3 text-white/75">
            会话已结束，你可以重新登录继续进入 AI 相亲直播间。
          </p>

          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link href="/api/auth/login" className="neo-button px-6 py-3">
              重新登录
            </Link>
            <Link href="/" className="px-6 py-3 rounded-xl border border-white/30 text-white/90 hover:bg-white/10 transition-colors">
              返回首页
            </Link>
          </div>
        </section>
      </main>
    </div>
  )
}
