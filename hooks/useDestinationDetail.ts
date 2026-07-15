import { useState, useEffect, useCallback } from 'react'
import { useNavigation } from 'expo-router'
import { supabase } from '../lib/supabase'
import type { DestinationRow, MomentRow } from '../constants/mockData'

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
