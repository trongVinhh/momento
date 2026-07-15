import { useState, useEffect, useCallback } from 'react'
import { useNavigation } from 'expo-router'
import { supabase } from '../lib/supabase'
import { parseImageUrls } from '../utils/imageParser'

export interface UserProfileData {
  email: string
  displayName: string
  avatarUrl: string
  destinationsCount: number
  momentsCount: number
  momentsImages: string[]
}

export function useProfile() {
  const navigation = useNavigation()
  const [profile, setProfile] = useState<UserProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProfileData = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Chưa đăng nhập.')

      // 1. Tải thông tin từ profiles
      const { data: profData, error: profErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profErr) throw profErr

      // 2. Đếm số destinations của user này
      const { count: destCount, error: destErr } = await supabase
        .from('destinations')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)

      if (destErr) throw destErr

      // 3. Đếm số moments của user này
      const { count: momCount, error: momErr } = await supabase
        .from('moments')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)

      if (momErr) throw momErr

      // 4. Tải danh sách ảnh moments của user này
      const { data: momImgs, error: imgsErr } = await supabase
        .from('moments')
        .select('image_url')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (imgsErr) throw imgsErr

      setProfile({
        email: user.email || '',
        displayName: profData.display_name || 'Traveler',
        avatarUrl: profData.avatar_url,
        destinationsCount: destCount || 0,
        momentsCount: momCount || 0,
        momentsImages: (momImgs || []).map((m: any) => {
          const urls = parseImageUrls(m.image_url)
          return urls[0] || ''
        }).filter(Boolean),
      })
    } catch (err: any) {
      setError(err.message || 'Không thể tải thông tin cá nhân.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProfileData(true)
  }, [fetchProfileData])

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchProfileData(false)
    })
    return unsubscribe
  }, [navigation, fetchProfileData])

  return { profile, loading, error, refetch: () => fetchProfileData(true) }
}
