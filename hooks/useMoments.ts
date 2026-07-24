import { useState, useEffect, useCallback } from 'react'
import { Alert } from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { useRouter, useNavigation } from 'expo-router'
import { supabase } from '../lib/supabase'
import type { DestinationRow, MomentRow } from '../constants/mockData'
import { parseImageUrls } from '../utils/imageParser'

const WORKER_URL = process.env.EXPO_PUBLIC_WORKER_URL || 'https://your-cloudflare-worker.workers.dev'

export interface FeedItem {
  id: string
  title: string
  description: string | null
  location: string
  destinationName: string
  imageUrl: string
  likes: number
  date: string
  createdAt: string
  user: {
    email: string
    displayName: string
    avatarUrl: string
  }
}

// Helper: Upload image to R2 via Cloudflare Worker Presigned URL
async function uploadImageToR2(localUri: string): Promise<string> {
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

// 1. Hook for Moments Feed List
export function useFeed() {
  const navigation = useNavigation()
  const [feed, setFeed] = useState<FeedItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchFeed = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true)
    setError(null)

    try {
      const { data, error: supaErr } = await supabase
        .from('moments')
        .select(`
          id,
          title,
          description,
          location,
          image_url,
          likes,
          date,
          created_at,
          profiles (
            email,
            display_name,
            avatar_url
          ),
          destinations (
            name
          )
        `)
        .order('created_at', { ascending: false })

      if (supaErr) throw supaErr

      const mapped: FeedItem[] = (data || []).map((item: any) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        location: item.location,
        destinationName: item.destinations?.name || '',
        imageUrl: item.image_url,
        likes: item.likes || 0,
        date: item.date,
        createdAt: item.created_at,
        user: {
          email: item.profiles?.email || '',
          displayName: item.profiles?.display_name || 'Traveler',
          avatarUrl: item.profiles?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&q=80',
        },
      }))

      setFeed(mapped)
    } catch (err: any) {
      setError(err.message || 'Không thể tải bản tin.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchFeed(true)
  }, [fetchFeed])

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchFeed(false)
    })
    return unsubscribe
  }, [navigation, fetchFeed])

  return { feed, loading, error, refetch: () => fetchFeed(true) }
}

// 2. Hook for Single Moment Detail
export function useMomentDetail(id: string | undefined) {
  const [moment, setMoment] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const fetchMoment = useCallback(async () => {
    if (!id) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('moments')
        .select(`
          *,
          destination:destinations(name)
        `)
        .eq('id', id)
        .single()

      if (error) throw error
      setMoment(data)
    } catch (err: any) {
      Alert.alert('Lỗi', err.message || 'Không thể tải thông tin khoảnh khắc.')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchMoment()
  }, [id, fetchMoment])

  return { moment, loading, refetch: fetchMoment }
}

// 3. Hook for Creating a Moment
export function useCreateMoment(initialDestId?: string) {
  const router = useRouter()
  const navigation = useNavigation()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [locationName, setLocationName] = useState('')
  const [selectedDestId, setSelectedDestId] = useState<string | null>(initialDestId || null)
  const [imageUris, setImageUris] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (initialDestId) {
      setSelectedDestId(initialDestId)
    }
  }, [initialDestId])

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

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!permissionResult.granted) {
      Alert.alert('Quyền truy cập', 'Ứng dụng cần quyền truy cập thư viện ảnh để chọn hình.')
      return
    }

    if (imageUris.length >= 10) {
      Alert.alert('Giới hạn', 'Bạn chỉ có thể chọn tối đa 10 ảnh cho mỗi khoảnh khắc.')
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.8,
    })

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const selectedUris = result.assets.map(a => a.uri)
      const totalUris = [...imageUris, ...selectedUris]
      if (totalUris.length > 10) {
        Alert.alert('Giới hạn', 'Đã tự động cắt bớt hình ảnh. Chỉ cho phép tối đa 10 ảnh.')
        setImageUris(totalUris.slice(0, 10))
      } else {
        setImageUris(totalUris)
      }
    }
  }

  const removeImage = (index: number) => {
    setImageUris(prev => prev.filter((_, idx) => idx !== index))
  }

  const handleSaveMoment = async () => {
    if (imageUris.length === 0 || !title || !locationName || !selectedDestId) {
      Alert.alert('Thiếu thông tin', 'Vui lòng chọn ảnh, nhập tiêu đề, địa danh và chọn địa điểm.')
      return
    }

    setLoading(true)

    try {
      // Tải lên song song tất cả các ảnh mới
      const uploadedUrls = await Promise.all(
        imageUris.map(async (uri) => {
          if (uri.startsWith('http')) return uri
          return await uploadImageToR2(uri)
        })
      )

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Không tìm thấy tài khoản người dùng.')

      const { error } = await supabase.from('moments').insert({
        title,
        description,
        location: locationName,
        destination_id: selectedDestId,
        image_url: JSON.stringify(uploadedUrls),
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
    imageUris,
    pickImage,
    removeImage,
    loading,
    handleSaveMoment,
  }
}

// 4. Hook for Editing/Deleting a Moment
export function useEditMoment(id: string | undefined) {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [locationName, setLocationName] = useState('')
  const [selectedDestId, setSelectedDestId] = useState<string | null>(null)
  const [imageUris, setImageUris] = useState<string[]>([])
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
          setImageUris(parseImageUrls(data.image_url))
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

    if (imageUris.length >= 10) {
      Alert.alert('Giới hạn', 'Bạn chỉ có thể chọn tối đa 10 ảnh cho mỗi khoảnh khắc.')
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.8,
    })

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const selectedUris = result.assets.map(a => a.uri)
      const totalUris = [...imageUris, ...selectedUris]
      if (totalUris.length > 10) {
        Alert.alert('Giới hạn', 'Đã tự động cắt bớt hình ảnh. Chỉ cho phép tối đa 10 ảnh.')
        setImageUris(totalUris.slice(0, 10))
      } else {
        setImageUris(totalUris)
      }
    }
  }

  const removeImage = (index: number) => {
    setImageUris(prev => prev.filter((_, idx) => idx !== index))
  }

  const handleUpdateMoment = async () => {
    if (imageUris.length === 0 || !title || !locationName || !selectedDestId || !id) {
      Alert.alert('Thiếu thông tin', 'Vui lòng điền đầy đủ tiêu đề, địa danh và ảnh.')
      return
    }

    setLoading(true)
    try {
      // Tải lên song song các ảnh mới
      const uploadedUrls = await Promise.all(
        imageUris.map(async (uri) => {
          if (uri.startsWith('http')) return uri
          return await uploadImageToR2(uri)
        })
      )

      const { error } = await supabase
        .from('moments')
        .update({
          title,
          description: description.trim() || null,
          location: locationName,
          destination_id: selectedDestId,
          image_url: JSON.stringify(uploadedUrls),
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
    imageUris,
    pickImage,
    removeImage,
    loading,
    fetching,
    handleUpdateMoment,
    handleDeleteMoment,
  }
}
