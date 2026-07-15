import { useState, useEffect, useCallback } from 'react'
import { useNavigation } from 'expo-router'
import { supabase } from '../lib/supabase'
import type { DestinationRow } from '../constants/mockData'

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
