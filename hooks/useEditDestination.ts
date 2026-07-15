import { useState, useEffect } from 'react'
import { Alert } from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { useRouter } from 'expo-router'
import { supabase } from '../lib/supabase'

const WORKER_URL = process.env.EXPO_PUBLIC_WORKER_URL || 'https://your-cloudflare-worker.workers.dev'

export function useEditDestination(id: string | undefined) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [country, setCountry] = useState('Việt Nam')
  const [imageUri, setImageUri] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    const fetchDestination = async () => {
      if (!id) return
      setFetching(true)
      try {
        const { data, error } = await supabase
          .from('destinations')
          .select('*')
          .eq('id', id)
          .single()
        if (error) throw error
        if (data) {
          setName(data.name)
          setDescription(data.description || '')
          setCountry(data.country || 'Việt Nam')
          setImageUri(data.image_url)
        }
      } catch (err: any) {
        Alert.alert('Lỗi', err.message || 'Không thể tải thông tin địa điểm.')
      } finally {
        setFetching(false)
      }
    }
    fetchDestination()
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
      aspect: [16, 9],
      quality: 0.85,
    })

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImageUri(result.assets[0].uri)
    }
  }

  const uploadImageToR2 = async (localUri: string): Promise<string> => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('Vui lòng đăng nhập để upload ảnh.')

    const filename = `dest-${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`

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

  const handleUpdateDestination = async () => {
    if (!name.trim() || !imageUri || !id || !country.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập tên địa điểm, quốc gia và chọn ảnh bìa.')
      return
    }

    setLoading(true)
    try {
      let imageUrl = imageUri
      // Nếu là ảnh mới chọn từ máy (file:// hoặc ph://), upload lên R2
      if (!imageUri.startsWith('http')) {
        imageUrl = await uploadImageToR2(imageUri)
      }

      const { error } = await supabase
        .from('destinations')
        .update({
          name: name.trim(),
          description: description.trim() || null,
          country: country.trim(),
          image_url: imageUrl,
        })
        .eq('id', id)

      if (error) throw error

      Alert.alert('Thành công', 'Thông tin địa điểm đã được cập nhật!', [
        { text: 'OK', onPress: () => router.back() },
      ])
    } catch (err: any) {
      Alert.alert('Lỗi', err.message || 'Đã có lỗi xảy ra.')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteDestination = async () => {
    if (!id) return
    Alert.alert(
      'Xóa địa điểm',
      'Bạn có chắc chắn muốn xóa địa điểm này? Toàn bộ khoảnh khắc thuộc địa điểm này cũng sẽ bị xóa vĩnh viễn!',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            setLoading(true)
            try {
              const { error } = await supabase
                .from('destinations')
                .delete()
                .eq('id', id)
              if (error) throw error
              router.replace('/')
            } catch (err: any) {
              Alert.alert('Lỗi', err.message || 'Không thể xóa địa điểm.')
            } finally {
              setLoading(false)
            }
          },
        },
      ]
    )
  }

  return {
    name,
    setName,
    description,
    setDescription,
    country,
    setCountry,
    imageUri,
    pickImage,
    loading,
    fetching,
    handleUpdateDestination,
    handleDeleteDestination,
  }
}
