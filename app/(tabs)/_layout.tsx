import React from 'react'
import { Tabs, useRouter, usePathname } from 'expo-router'
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native'
import { BlurView } from 'expo-blur'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Home, User, FileText } from 'lucide-react-native'

export default function TabsLayout() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const pathname = usePathname()

  // Xác định tab nào đang active dựa trên pathname
  const getActiveTab = () => {
    if (pathname === '/feed') return 'feed'
    if (pathname === '/account') return 'account'
    return 'trips' // Mặc định là trips (pathname === '/' hoặc '/index')
  }

  const activeTab = getActiveTab()

  return (
    <View style={{ flex: 1, backgroundColor: '#0a0a0c' }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: false,
          tabBarStyle: {
            display: 'none', // Ẩn tabbar mặc định
          },
        }}
      >
        <Tabs.Screen name="index" />
        <Tabs.Screen name="feed" />
        <Tabs.Screen name="account" />
      </Tabs>

      {/* ── Floating Custom Tab Bar (Hiển thị cố định đè lên các Tab) ── */}
      <View style={[styles.navWrapper, { bottom: insets.bottom + 24 }]}>
        <BlurView
          intensity={Platform.OS === 'android' ? 40 : 20}
          tint="dark"
          style={styles.navPill}
        >
          <View style={styles.navPillInnerBorder} />

          {/* Feed — Tab */}
          <TouchableOpacity
            style={styles.navItem}
            activeOpacity={0.7}
            onPress={() => router.push('/feed')}
          >
            <Home
              size={20}
              color={activeTab === 'feed' ? '#ffffff' : 'rgba(255,255,255,0.5)'}
            />
            <Text
              style={
                activeTab === 'feed'
                  ? styles.navLabelActive
                  : styles.navLabelInactive
              }
            >
              Feed
            </Text>
          </TouchableOpacity>

          {/* Account — Tab */}
          <TouchableOpacity
            style={styles.navItem}
            activeOpacity={0.7}
            onPress={() => router.push('/account')}
          >
            <User
              size={20}
              color={activeTab === 'account' ? '#ffffff' : 'rgba(255,255,255,0.5)'}
            />
            <Text
              style={
                activeTab === 'account'
                  ? styles.navLabelActive
                  : styles.navLabelInactive
              }
            >
              Account
            </Text>
          </TouchableOpacity>

          {/* Trips (index) — Tab */}
          <TouchableOpacity
            style={styles.navItem}
            activeOpacity={0.7}
            onPress={() => router.push('/')}
          >
            <FileText
              size={20}
              color={activeTab === 'trips' ? '#ffffff' : 'rgba(255,255,255,0.5)'}
            />
            <Text
              style={
                activeTab === 'trips'
                  ? styles.navLabelActive
                  : styles.navLabelInactive
              }
            >
              Trips
            </Text>
          </TouchableOpacity>
        </BlurView>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  navWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 99, // Đảm bảo nổi lên trên cùng
  },
  navPill: {
    flexDirection: 'row',
    gap: 24,
    borderRadius: 999,
    paddingHorizontal: 24,
    paddingVertical: 8,
    overflow: 'hidden',
  },
  navPillInnerBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  navItem: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 2,
    minWidth: 50,
  },
  navLabelInactive: {
    fontFamily: 'System',
    fontSize: 10,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.5)',
  },
  navLabelActive: {
    fontFamily: 'System',
    fontSize: 10,
    fontWeight: '500',
    color: '#ffffff',
  },
})
