import React, { useEffect, useState, useRef } from 'react'
import { Stack, useRouter, useSegments } from 'expo-router'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { View, ActivityIndicator, Animated, Text, StyleSheet } from 'react-native'
import { Session } from '@supabase/supabase-js'

import { supabase } from '../lib/supabase'
import { COLORS } from '../constants/theme'

export default function RootLayout() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const segments = useSegments()

  // Các giá trị để làm animation cho loading screen
  const fadeAnim = useRef(new Animated.Value(0)).current
  const scaleAnim = useRef(new Animated.Value(0.92)).current
  const pulseAnim = useRef(new Animated.Value(1)).current

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

  // 2. Chạy Animation cho màn hình Loading
  useEffect(() => {
    if (loading) {
      // 1. Fade in + Scale up logo ban đầu
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        })
      ]).start()

      // 2. Nhịp thở (Pulse) lặp vô tận
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1200,
            useNativeDriver: true,
          })
        ])
      ).start()
    }
  }, [loading])

  // 3. Tự động điều hướng dựa trên Session và Màn hình hiện tại
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
      <View style={styles.loadingContainer}>
        {/* Background neon blobs cho phong cách glassmorphic */}
        <View style={styles.bgBlobLeft} />
        <View style={styles.bgBlobRight} />

        <Animated.View
          style={[
            styles.brandContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }, { scale: pulseAnim }],
            },
          ]}
        >
          <Text style={styles.brandTitle}>Momento</Text>
          <Text style={styles.brandSubtitle}>Ghi lại hành trình du lịch của bạn</Text>
        </Animated.View>

        <View style={styles.spinnerWrapper}>
          <ActivityIndicator size="small" color="rgba(255, 255, 255, 0.4)" />
        </View>
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

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0a0a0c',
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandContainer: {
    alignItems: 'center',
    gap: 10,
    zIndex: 10,
  },
  brandTitle: {
    fontFamily: 'System',
    fontSize: 48,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: -1.5,
  },
  brandSubtitle: {
    fontFamily: 'System',
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
  },
  spinnerWrapper: {
    position: 'absolute',
    bottom: 80,
  },
  bgBlobLeft: {
    position: 'absolute',
    left: -100,
    top: '30%',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(59, 130, 246, 0.12)',
    // Dùng cho web build hoặc fallback, fallback trên app là shadow/opacity
  },
  bgBlobRight: {
    position: 'absolute',
    right: -100,
    bottom: '30%',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
  },
})
