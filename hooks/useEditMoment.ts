import { useState, useEffect } from 'react'
import { Alert } from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { useRouter } from 'expo-router'
import { supabase } from '../lib/supabase'
import type { DestinationRow } from '../constants/mockData'

const WORKER_URL = process.env.EXPO_PUBLIC_WORKER_URL || 'https://your-cloudflare-worker.workers.dev'

export function useEditMoment(id: string | undefined) {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [locationName, setLocationName] = useState('')
  const [selectedDestId, setSelectedDestId] = useState<string | null>(null)
  const [imageUri, setImageUri] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)

  // Danh sách các địa điểm để chọn
  const [destinations, setDestinations] = useState<DestinationRow[]>([])
  const [loadingDestinations, setLoadingDestinations] = useState(true)

  // Tải danh sách destinations
  useEffect(() => {
    const fetchDestinations = async () => {
      setLoadingDestinations(true)
      const { data, error } = await supabase
        .from('destinations')
        .select('*')
        .order('created_at', { ascending: false })
      if (!error && data) {
        setDestinations(data)
      }
      setLoadingDestinations(false)
    }
    fetchDestinations()
  }, [])

  // Tải chi tiết moment hiện tại
  useEffect(() => {
    const fetchMoment = async () => {
      if (!id) return
      setFetching(true)
      try {
        const { data, error } = await supabase
          .from('moments')
          .select('*')
          .eq('id', id)
          .single()
        if (error) throw error
        if (data) {
          setTitle(data.title)
          setDescription(data.description || '')
          setLocationName(data.location)
          setSelectedDestId(data.destination_id)
          setImageUri(data.image_url)
        }
      } catch (err: any) {
        Alert.alert('Lỗi', err.message || 'Không thể tải thông tin khoảnh khắc.')
      } finally {
        setFetching(false)
      }
    }
    fetchMoment()
  }, [id])

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

  const uploadImageToR2 = async (localUri: string): Promise<string> => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('Vui lòng đăng nhập để upload ảnh.')

    const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`

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

  const handleUpdateMoment = async () => {
    if (!title || !locationName || !imageUri || !selectedDestId || !id) {
      Alert.alert('Thiếu thông tin', 'Vui lòng điền đầy đủ tiêu đề, địa danh và ảnh.')
      return
    }

    setLoading(true)
    try {
      let imageUrl = imageUri
      if (!imageUri.startsWith('http')) {
        imageUrl = await uploadImageToR2(imageUri)
      }

      const { error } = await supabase
        .from('moments')
        .update({
          title,
          description: description.trim() || null,
          location: locationName,
          destination_id: selectedDestId,
          image_url: imageUrl,
        })
        .eq('id', id)

      if (error) throw error

      Alert.alert('Thành công', 'Khoảnh khắc đã được cập nhật!', [
        { text: 'OK', onPress: () => router.back() },
      ])
    } catch (err: any) {
      Alert.alert('Lỗi', err.message || 'Đã có lỗi xảy ra.')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteMoment = async () => {
    if (!id) return
    Alert.alert(
      'Xóa khoảnh khắc',
      'Bạn có chắc chắn muốn xóa khoảnh khắc này vĩnh viễn?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            setLoading(true)
            try {
              const { error } = await supabase
                .from('moments')
                .delete()
                .eq('id', id)
              if (error) throw error
              router.back()
            } catch (err: any) {
              Alert.alert('Lỗi', err.message || 'Không thể xóa khoảnh khắc.')
            } finally {
              setLoading(false)
            }
          },
        },
      ]
    )
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
    fetching,
    handleUpdateMoment,
    handleDeleteMoment,
  }
}
