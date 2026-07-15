import { useState, useEffect, useCallback } from 'react'
import { Alert } from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { useRouter, useNavigation } from 'expo-router'
import { supabase } from '../lib/supabase'
import type { DestinationRow } from '../constants/mockData'

const WORKER_URL = process.env.EXPO_PUBLIC_WORKER_URL || 'https://your-cloudflare-worker.workers.dev'

export function useCreateMoment() {
  const router = useRouter()
  const navigation = useNavigation()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [locationName, setLocationName] = useState('')
  const [selectedDestId, setSelectedDestId] = useState<string | null>(null)
  const [imageUri, setImageUri] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Danh sách destinations động từ Supabase
  const [destinations, setDestinations] = useState<DestinationRow[]>([])
  const [loadingDestinations, setLoadingDestinations] = useState(true)

  const fetchDestinations = useCallback(async (showLoading = true) => {
    if (showLoading) setLoadingDestinations(true)
    const { data, error } = await supabase
      .from('destinations')
      .select('*')
      .order('created_at', { ascending: false })
    if (!error && data) {
      setDestinations(data)
      // Tự động chọn destination đầu tiên nếu có và chưa chọn gì
      if (data.length > 0 && !selectedDestId) {
        setSelectedDestId(data[0].id)
      }
    }
    setLoadingDestinations(false)
  }, [selectedDestId])

  // Tải dữ liệu ban đầu
  useEffect(() => {
    fetchDestinations(true)
  }, [fetchDestinations])

  // Tải lại khi màn hình được active/focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchDestinations(false)
    })
    return unsubscribe
  }, [navigation, fetchDestinations])

  // 1. Chọn ảnh từ thư viện
  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!permissionResult.granted) {
      Alert.alert('Quyền truy cập', 'Ứng dụng cần quyền truy cập thư viện ảnh để chọn hình.')
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    })

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImageUri(result.assets[0].uri)
    }
  }

  // 2. Upload ảnh lên Cloudflare R2 qua Worker Presigned URL
  const uploadImageToR2 = async (localUri: string): Promise<string> => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('Vui lòng đăng nhập để upload ảnh.')

    const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`

    const response = await fetch(`${WORKER_URL}/presign?filename=${filename}`, {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    })

    if (!response.ok) {
      const errText = await response.text()
      throw new Error(`Không thể lấy URL upload từ Cloudflare Worker: ${errText}`)
    }

    const { uploadUrl, publicUrl } = await response.json()

    const fileResult = await fetch(localUri)
    const blob = await fileResult.blob()

    const uploadResult = await fetch(uploadUrl, {
      method: 'PUT',
      body: blob,
      headers: {
        'Content-Type': 'image/jpeg',
      },
    })

    if (!uploadResult.ok) {
      throw new Error('Upload ảnh lên Cloudflare R2 thất bại.')
    }

    return publicUrl
  }

  // 3. Đăng khoảnh khắc mới
  const handleSaveMoment = async () => {
    if (!title || !locationName || !imageUri || !selectedDestId) {
      Alert.alert('Thiếu thông tin', 'Vui lòng chọn ảnh, nhập tiêu đề, địa danh và chọn địa điểm.')
      return
    }

    setLoading(true)

    try {
      let imageUrl = imageUri
      if (!imageUri.startsWith('http')) {
        imageUrl = await uploadImageToR2(imageUri)
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Không tìm thấy tài khoản người dùng.')

      const { error } = await supabase.from('moments').insert({
        title,
        description,
        location: locationName,
        destination_id: selectedDestId,
        image_url: imageUrl,
        user_id: user.id,
        likes: 0,
        date: new Date().toLocaleDateString('vi-VN'),
      })

      if (error) throw error

      Alert.alert('Thành công', 'Hành trình của bạn đã được ghi lại thành công!', [
        { text: 'OK', onPress: () => router.replace('/') },
      ])
    } catch (err: any) {
      Alert.alert('Lỗi lưu trữ', err.message || 'Đã có lỗi xảy ra.')
    } finally {
      setLoading(false)
    }
  }

  return {
    title,
    setTitle,
    description,
    setDescription,
    locationName,
    setLocationName,
    selectedDestId,
    setSelectedDestId,
    destinations,
    loadingDestinations,
    imageUri,
    pickImage,
    loading,
    handleSaveMoment,
  }
}
