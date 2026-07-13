import React, { useEffect, useState } from 'react'
import { Stack, useRouter, useSegments } from 'expo-router'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { View, ActivityIndicator } from 'react-native'
import { Session } from '@supabase/supabase-js'

import { supabase } from '../lib/supabase'
import { COLORS } from '../constants/theme'

export default function RootLayout() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const segments = useSegments()

  // 1. Lắng nghe thay đổi trạng thái Authentication từ Supabase
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // 2. Tự động điều hướng dựa trên Session và Màn hình hiện tại
  useEffect(() => {
    if (loading) return

    // segments[0] xác định xem user đang ở tab group "(tabs)", hay màn hình "login", v.v.
    const inAuthGroup = segments[0] === '(tabs)' || segments[0] === 'destination'

    if (!session && inAuthGroup) {
      // Chưa login nhưng cố vào tab hoặc chi tiết -> Chuyển sang màn Login
      router.replace('/login')
    } else if (session && segments[0] === 'login') {
      // Đã login nhưng đang ở màn Login -> Chuyển về màn hình chính Trips
      router.replace('/')
    }
  }, [session, loading, segments])

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={COLORS.white} />
      </View>
    )
  }

  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="destination/[id]"
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }}
        />
      </Stack>
    </SafeAreaProvider>
  )
}
