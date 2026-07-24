import { useState, useEffect, useCallback } from 'react'
import { Alert } from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { useRouter, useNavigation } from 'expo-router'
import { supabase } from '../lib/supabase'
import type { DestinationRow, MomentRow } from '../constants/mockData'

const WORKER_URL = process.env.EXPO_PUBLIC_WORKER_URL || 'https://your-cloudflare-worker.workers.dev'

// 1. Hook for Destinations List (e.g. Map, Index list)
export function useDestinations() {
  const navigation = useNavigation()
  const [destinations, setDestinations] = useState<DestinationRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDestinations = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true)
    setError(null)
    try {
      // Tải destinations kèm count moments qua foreign table aggregation
      const { data, error: supaErr } = await supabase
        .from('destinations')
        .select('*, moments(count)')
        .order('created_at', { ascending: false })

      if (supaErr) throw supaErr

      // Flatten count từ kết quả join
      const mapped: DestinationRow[] = (data || []).map((d: any) => ({
        ...d,
        moments_count: d.moments?.[0]?.count ?? 0,
      }))

      setDestinations(mapped)
    } catch (err: any) {
      setError(err.message || 'Không thể tải danh sách địa điểm.')
    } finally {
      setLoading(false)
    }
  }, [])

  // Tải dữ liệu ban đầu
  useEffect(() => {
    fetchDestinations(true)
  }, [fetchDestinations])

  // Tự động tải lại khi màn hình được active/focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchDestinations(false) // Tải lại ngầm, không hiện loading indicator để tránh nhấp nháy UI
    })
    return unsubscribe
  }, [navigation, fetchDestinations])

  return { destinations, loading, error, refetch: () => fetchDestinations(true) }
}

// 2. Hook for Single Destination Detail (and moments in that destination)
export function useDestinationDetail(id: string | undefined) {
  const navigation = useNavigation()
  const [destination, setDestination] = useState<DestinationRow | null>(null)
  const [moments, setMoments] = useState<MomentRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDetail = useCallback(async (showLoading = true) => {
    if (!id) {
      setLoading(false)
      setError('Không tìm thấy địa điểm.')
      return
    }

    if (showLoading) setLoading(true)
    setError(null)

    try {
      // Tải destination theo ID
      const { data: destData, error: destErr } = await supabase
        .from('destinations')
        .select('*')
        .eq('id', id)
        .single()

      if (destErr) throw destErr
      setDestination(destData)

      // Tải moments thuộc destination này
      const { data: momentsData, error: momentsErr } = await supabase
        .from('moments')
        .select('*')
        .eq('destination_id', id)
        .order('created_at', { ascending: false })

      if (momentsErr) throw momentsErr
      setMoments(momentsData || [])
    } catch (err: any) {
      setError(err.message || 'Không thể tải chi tiết địa điểm.')
    } finally {
      setLoading(false)
    }
  }, [id])

  // Tải dữ liệu ban đầu
  useEffect(() => {
    fetchDetail(true)
  }, [fetchDetail])

  // Tự động tải lại khi màn hình được active/focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchDetail(false) // Tải lại ngầm, không hiện loading indicator để tránh nhấp nháy UI
    })
    return unsubscribe
  }, [navigation, fetchDetail])

  return { destination, moments, loading, error, refetch: () => fetchDetail(true) }
}

// Helper function to upload image to R2 via Cloudflare Worker Presigned URL
async function uploadImageToR2(localUri: string): Promise<string> {
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

// 3. Hook for Creating a Destination
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

// 4. Hook for Editing/Deleting a Destination
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

  const handleUpdateDestination = async () => {
    if (!name.trim() || !imageUri || !id || !country.trim()) {
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
            'User-Agent': 'MomentoTravelApp/1.0',
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
          latitude,
          longitude,
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
