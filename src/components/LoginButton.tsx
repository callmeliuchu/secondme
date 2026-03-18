'use client'

export default function LoginButton() {
  const handleLogin = () => {
    // 直接跳转到登录 API，让服务器处理重定向
    window.location.href = '/api/auth/login'
  }

  return (
    <button
      onClick={handleLogin}
      className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
    >
      登录 SecondMe
    </button>
  )
}
