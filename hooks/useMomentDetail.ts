import { useState, useEffect } from 'react'
import { Alert } from 'react-native'
import { supabase } from '../lib/supabase'

export function useMomentDetail(id: string | undefined) {
  const [moment, setMoment] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const fetchMoment = async () => {
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
  }

  useEffect(() => {
    fetchMoment()
  }, [id])

  return { moment, loading, refetch: fetchMoment }
}
