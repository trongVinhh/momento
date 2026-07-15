import React, { useEffect, useState, useRef } from 'react'
import { Stack, useRouter, useSegments } from 'expo-router'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { View, ActivityIndicator, Animated, Text, StyleSheet } from 'react-native'
import { Session } from '@supabase/supabase-js'

import { supabase } from '../lib/supabase'
import { ThemeProvider, useThemeContext } from '../context/ThemeContext'

function RootLayoutContent() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const segments = useSegments()
  const { theme, colors } = useThemeContext()

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
        }),
      ]).start(() => {
        // 2. Sau khi hiện lên, chạy lặp lại vô hạn hiệu ứng thở (Breathing/Pulse)
        Animated.loop(
          Animated.sequence([
            Animated.timing(pulseAnim, {
              toValue: 1.05,
              duration: 1500,
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnim, {
              toValue: 0.95,
              duration: 1500,
              useNativeDriver: true,
            }),
          ])
        ).start()
      })
    }
  }, [loading])

  // 3. Điều hướng Auth (Màn Login & Main App)
  useEffect(() => {
    if (loading) return

    const isAtLoginScreen = segments[0] === 'login'

    if (session && isAtLoginScreen) {
      // Đã đăng nhập nhưng đang ở màn login -> Vào app chính
      router.replace('/')
    } else if (!session && !isAtLoginScreen) {
      // Chưa đăng nhập mà đang ở màn khác màn login -> Bắt buộc ra màn login
      router.replace('/login')
    }
  }, [session, loading, segments])

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        {/* Glowing background blobs */}
        <View style={[styles.bgBlobLeft, { backgroundColor: colors.accentPrimarySubtle }]} />
        <View style={[styles.bgBlobRight, { backgroundColor: theme === 'light' ? 'rgba(139, 92, 246, 0.05)' : 'rgba(139, 92, 246, 0.1)' }]} />

        {/* Brand visual stack with animated fade & scale */}
        <Animated.View
          style={[
            styles.brandContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }, { scale: pulseAnim }],
            },
          ]}
        >
          <Text style={[styles.brandTitle, { color: colors.textActive }]}>Momento</Text>
          <Text style={[styles.brandSubtitle, { color: colors.textSubtle }]}>Moment maps</Text>
        </Animated.View>

        {/* Continuous activity spinner */}
        <View style={styles.spinnerWrapper}>
          <ActivityIndicator size="small" color={theme === 'light' ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.4)'} />
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

export default function RootLayout() {
  return (
    <ThemeProvider>
      <RootLayoutContent />
    </ThemeProvider>
  )
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
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
    letterSpacing: -1.5,
  },
  brandSubtitle: {
    fontFamily: 'System',
    fontSize: 14,
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
  },
  bgBlobRight: {
    position: 'absolute',
    right: -100,
    bottom: '30%',
    width: 300,
    height: 300,
    borderRadius: 150,
  },
})
