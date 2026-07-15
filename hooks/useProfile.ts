import { useState, useEffect, useCallback } from 'react'
import { Alert } from 'react-native'
import { useNavigation } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
import { supabase } from '../lib/supabase'
import { parseImageUrls } from '../utils/imageParser'

const WORKER_URL = process.env.EXPO_PUBLIC_WORKER_URL || 'https://your-cloudflare-worker.workers.dev'

export interface UserProfileData {
  email: string
  displayName: string
  avatarUrl: string
  bio: string
  destinationsCount: number
  momentsCount: number
  countriesCount: number
  momentsImages: string[]
}

export function useProfile() {
  const navigation = useNavigation()
  const [profile, setProfile] = useState<UserProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
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

      // 2. Đếm số destinations và lấy danh sách quốc gia
      const { data: destData, error: destErr } = await supabase
        .from('destinations')
        .select('id, country')
        .eq('user_id', user.id)

      if (destErr) throw destErr

      const destCount = destData?.length || 0
      const uniqueCountries = new Set((destData || []).map((d: any) => (d.country || '').trim().toLowerCase()).filter(Boolean))
      const countriesCount = uniqueCountries.size

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
        bio: profData.bio || '',
        destinationsCount: destCount,
        momentsCount: momCount || 0,
        countriesCount,
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

  const uploadAvatarToR2 = async (localUri: string): Promise<string> => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('Vui lòng đăng nhập để upload ảnh.')

    const filename = `avatar-${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`

    const response = await fetch(`${WORKER_URL}/presign?filename=${filename}`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })

    if (!response.ok) {
      const errText = await response.text()
      throw new Error(`Không thể lấy URL upload: ${errText}`)
    }

    const { uploadUrl, publicUrl } = await response.json()

    const fileResult = await fetch(localUri)
    const blob = await fileResult.blob()

    const uploadResult = await fetch(uploadUrl, {
      method: 'PUT',
      body: blob,
      headers: { 'Content-Type': 'image/jpeg' },
    })

    if (!uploadResult.ok) throw new Error('Upload ảnh thất bại.')

    return publicUrl
  }

  const pickAvatar = async (): Promise<string | null> => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!permissionResult.granted) {
      Alert.alert('Quyền truy cập', 'Ứng dụng cần quyền truy cập thư viện ảnh để chọn hình.')
      return null
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    })

    if (!result.canceled && result.assets && result.assets.length > 0) {
      return result.assets[0].uri
    }
    return null
  }

  const updateProfile = async (displayName: string, bio: string, newAvatarUri?: string | null) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Chưa đăng nhập.')

    setSaving(true)
    try {
      let avatarUrl = profile?.avatarUrl

      if (newAvatarUri && newAvatarUri.startsWith('file://')) {
        avatarUrl = await uploadAvatarToR2(newAvatarUri)
      }

      const { error: updateErr } = await supabase
        .from('profiles')
        .update({
          display_name: displayName.trim(),
          bio: bio.trim(),
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      if (updateErr) throw updateErr

      await fetchProfileData(false)
    } finally {
      setSaving(false)
    }
  }

  return { profile, loading, saving, error, refetch: () => fetchProfileData(true), pickAvatar, updateProfile }
}
