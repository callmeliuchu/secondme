'use client'

import { useEffect, useState } from 'react'

interface UserInfo {
  id: string
  nickname?: string
  avatar?: string
  bio?: string
}

interface Shade {
  id: string
  name: string
  category?: string
}

export default function UserProfile() {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const [shades, setShades] = useState<Shade[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 获取用户信息
        const infoRes = await fetch('/api/user/info')
        const infoData = await infoRes.json()

        if (infoData.code === 0) {
          setUserInfo(infoData.data)
        }

        // 获取兴趣标签
        const shadesRes = await fetch('/api/user/shades')
        const shadesData = await shadesRes.json()

        if (shadesData.code === 0) {
          setShades(shadesData.data?.shades || [])
        }
      } catch (err) {
        setError('加载数据失败')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">加载中...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-red-500">{error}</div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      {/* 用户头像和基本信息 */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-2xl font-medium">
          {userInfo?.avatar ? (
            <img
              src={userInfo.avatar}
              alt={userInfo.nickname || '用户'}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            (userInfo?.nickname || '用户')[0]
          )}
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            {userInfo?.nickname || '未设置昵称'}
          </h2>
          {userInfo?.bio && (
            <p className="text-gray-500 text-sm mt-1">{userInfo.bio}</p>
          )}
        </div>
      </div>

      {/* 兴趣标签 */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-3">兴趣标签</h3>
        <div className="flex flex-wrap gap-2">
          {shades.length > 0 ? (
            shades.map((shade) => (
              <span
                key={shade.id}
                className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-sm"
              >
                {shade.name}
              </span>
            ))
          ) : (
            <span className="text-gray-400 text-sm">暂无兴趣标签</span>
          )}
        </div>
      </div>
    </div>
  )
}
