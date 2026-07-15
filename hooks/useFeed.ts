import { useState, useEffect, useCallback } from 'react'
import { useNavigation } from 'expo-router'
import { supabase } from '../lib/supabase'

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
