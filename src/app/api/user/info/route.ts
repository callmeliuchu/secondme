import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'

export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { code: 401, message: '未登录', data: null },
        { status: 401 }
      )
    }

    // 调用 SecondMe API 获取用户信息
    const response = await fetch(
      `${process.env.SECONDME_API_BASE_URL}/api/secondme/user/info`,
      {
        headers: {
          Authorization: `Bearer ${user.accessToken}`,
        },
      }
    )

    if (!response.ok) {
      throw new Error('Failed to get user info')
    }

    const result = await response.json()
    return NextResponse.json(result)
  } catch (error) {
    console.error('Get user info error:', error)
    return NextResponse.json(
      { code: 500, message: '获取用户信息失败', data: null },
      { status: 500 }
    )
  }
}
