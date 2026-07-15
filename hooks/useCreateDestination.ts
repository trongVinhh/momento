import { useState } from 'react'
import { Alert } from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { useRouter } from 'expo-router'
import { supabase } from '../lib/supabase'

const WORKER_URL = process.env.EXPO_PUBLIC_WORKER_URL || 'https://your-cloudflare-worker.workers.dev'

export function useCreateDestination() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [country, setCountry] = useState('Việt Nam')
  const [imageUri, setImageUri] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

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

  const handleSaveDestination = async () => {
    if (!name.trim() || !imageUri || !country.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập tên địa điểm, quốc gia và chọn ảnh bìa.')
      return
    }

    setLoading(true)
    try {
      // 1. Geocoding thông qua OpenStreetMap Nominatim
      let latitude = 21.028511 // Mặc định Hà Nội
      let longitude = 105.804817

      try {
        const query = encodeURIComponent(`${name.trim()}, ${country.trim()}`)
        const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`, {
          headers: {
            'User-Agent': 'MomentoTravelApp/1.0', // Yêu cầu từ Nominatim
          },
        })
        if (response.ok) {
          const geoData = await response.json()
          if (geoData && geoData.length > 0) {
            latitude = parseFloat(geoData[0].lat)
            longitude = parseFloat(geoData[0].lon)
          }
        }
      } catch (geoErr) {
        console.warn('Không thể geocode địa điểm, dùng tọa độ mặc định (Hà Nội):', geoErr)
      }

      // 2. Upload ảnh bìa lên R2
      const imageUrl = await uploadImageToR2(imageUri)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Không tìm thấy tài khoản người dùng.')

      // 3. Lưu vào cơ sở dữ liệu
      const { error } = await supabase.from('destinations').insert({
        name: name.trim(),
        description: description.trim() || null,
        country: country.trim(),
        latitude,
        longitude,
        image_url: imageUrl,
        user_id: user.id,
      })

      if (error) throw error

      Alert.alert('Thành công', `Địa điểm "${name}" đã được tạo!`, [
        { text: 'OK', onPress: () => router.back() },
      ])
    } catch (err: any) {
      Alert.alert('Lỗi', err.message || 'Đã có lỗi xảy ra.')
    } finally {
      setLoading(false)
    }
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
    handleSaveDestination,
  }
}
