import { cookies } from 'next/headers'

// 获取当前登录用户
export async function getCurrentUser() {
  const cookieStore = await cookies()
  const userId = cookieStore.get('user_id')?.value

  if (!userId) return null

  const { prisma } = await import('./prisma')
  const user = await prisma.user.findUnique({
    where: { id: userId },
  })

  return user
}

// 检查用户是否已登录
export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser()
  return !!user
}

// 获取 SecondMe OAuth 配置
export function getOAuthConfig() {
  return {
    clientId: process.env.SECONDME_CLIENT_ID!,
    redirectUri: process.env.SECONDME_REDIRECT_URI!,
    oauthUrl: process.env.SECONDME_OAUTH_URL!,
    scopes: 'user.info user.info.shades user.info.softmemory chat'.split(' '),
  }
}

// 生成 OAuth 授权 URL
export function generateOAuthUrl(state: string): string {
  const config = getOAuthConfig()
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: 'code',
    scope: config.scopes.join(' '),
    state,
  })
  return `${config.oauthUrl}?${params.toString()}`
}

// 刷新 Access Token
export async function refreshAccessToken(refreshToken: string) {
  const response = await fetch(process.env.SECONDME_REFRESH_ENDPOINT!, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: process.env.SECONDME_CLIENT_ID,
      client_secret: process.env.SECONDME_CLIENT_SECRET,
      refresh_token: refreshToken,
    }),
  })

  if (!response.ok) {
    throw new Error('Failed to refresh token')
  }

  return response.json()
}

// 验证并处理 OAuth 回调
export async function handleOAuthCallback(code: string) {
  const response = await fetch(process.env.SECONDME_TOKEN_ENDPOINT!, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: process.env.SECONDME_REDIRECT_URI!,
      client_id: process.env.SECONDME_CLIENT_ID!,
      client_secret: process.env.SECONDME_CLIENT_SECRET!,
    }),
  })

  const result = await response.json()

  // 检查响应 code 字段
  if (result.code !== 0 || !result.data) {
    throw new Error(`Token exchange failed: ${result.message}`)
  }

  // 从 data 中提取，使用 camelCase
  const { accessToken, refreshToken, expiresIn } = result.data

  return {
    accessToken,
    refreshToken,
    expiresIn,
  }
}

// 生成随机 state
export function generateState(): string {
  return crypto.randomUUID()
}
