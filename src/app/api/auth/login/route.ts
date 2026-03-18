import { NextResponse } from 'next/server'
import { generateOAuthUrl, generateState } from '@/lib/auth'

export async function GET() {
  const state = generateState()

  // 将 state 存储在 cookie 中（有效期 10 分钟）
  const response = NextResponse.redirect(generateOAuthUrl(state), {
    status: 302,
  })

  response.cookies.set('oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 10, // 10 分钟
    path: '/',
  })

  return response
}
