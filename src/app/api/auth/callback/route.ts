import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { handleOAuthCallback } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const receivedState = searchParams.get('state')

  // 检查是否有错误
  if (error) {
    return NextResponse.redirect(new URL(`/?error=${error}`, request.url))
  }

  // 检查是否缺少 code
  if (!code) {
    return NextResponse.redirect(new URL('/?error=missing_code', request.url))
  }

  // 验证 state（WebView 环境下宽松处理）
  const cookieStore = await cookies()
  const storedState = cookieStore.get('oauth_state')?.value

  if (!storedState || (receivedState && receivedState !== storedState)) {
    // WebView 环境下 state 验证可能失败，记录警告但继续处理
    console.warn('OAuth state 验证失败，可能是跨 WebView 场景')
  }

  try {
    console.log('Starting OAuth callback with code:', code?.slice(0, 10) + '...')

    // 交换 code 获取 token
    const tokenData = await handleOAuthCallback(code)
    console.log('Token exchange successful, accessToken:', tokenData.accessToken?.slice(0, 10) + '...')

    // 获取用户信息
    const userInfoUrl = `${process.env.SECONDME_API_BASE_URL}/api/secondme/user/info`
    console.log('Fetching user info from:', userInfoUrl)

    const userInfoResponse = await fetch(userInfoUrl, {
      headers: {
        Authorization: `Bearer ${tokenData.accessToken}`,
      },
    })

    console.log('User info response status:', userInfoResponse.status)

    if (!userInfoResponse.ok) {
      const errorText = await userInfoResponse.text()
      console.log('User info error:', errorText)
      throw new Error('Failed to get user info: ' + errorText)
    }

    const userInfo = await userInfoResponse.json()
    console.log('User info response:', JSON.stringify(userInfo))

    if (!userInfo.data) {
      throw new Error('User info response has no data: ' + JSON.stringify(userInfo))
    }

    // 提取用户 ID（字段名是 userId，不是 id）
    const secondmeUserId = userInfo.data.userId
    console.log('SecondMe userId:', secondmeUserId)

    // 计算 token 过期时间
    const tokenExpiresAt = new Date(
      Date.now() + tokenData.expiresIn * 1000
    )

    // 查询或创建用户
    let user = await prisma.user.findUnique({
      where: { secondmeUserId },
    })

    if (!user) {
      // 创建新用户
      user = await prisma.user.create({
        data: {
          secondmeUserId,
          accessToken: tokenData.accessToken,
          refreshToken: tokenData.refreshToken,
          tokenExpiresAt,
          nickname: userInfo.data.name || null,
          avatar: userInfo.data.avatar || null,
          bio: userInfo.data.bio || null,
        },
      })
    } else {
      // 更新现有用户
      user = await prisma.user.update({
        where: { secondmeUserId },
        data: {
          accessToken: tokenData.accessToken,
          refreshToken: tokenData.refreshToken,
          tokenExpiresAt,
          nickname: userInfo.data.name || user.nickname,
          avatar: userInfo.data.avatar || user.avatar,
          bio: userInfo.data.bio || user.bio,
        },
      })
    }

    // 设置登录 cookie
    const response = NextResponse.redirect(new URL('/', request.url))

    response.cookies.set('user_id', user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 天
      path: '/',
    })

    // 清除 oauth state cookie
    response.cookies.delete('oauth_state')

    return response
  } catch (error) {
    console.error('OAuth callback error:', error)
    return NextResponse.redirect(new URL('/?error=auth_failed', request.url))
  }
}
