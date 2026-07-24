import React from 'react'
import { Tabs, useRouter, usePathname } from 'expo-router'
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native'
import { BlurView } from 'expo-blur'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Home, User, FileText, Map, MessageCircle } from 'lucide-react-native'
import { useTheme } from '../../hooks/useTheme'

export default function TabsLayout() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const pathname = usePathname()
  const { colors, theme } = useTheme()

  // Xác định tab nào đang active dựa trên pathname
  const getActiveTab = () => {
    if (pathname === '/feed') return 'feed'
    if (pathname === '/account') return 'account'
    if (pathname === '/map') return 'map'
    if (pathname === '/bot') return 'bot'
    return 'trips' // Mặc định là trips (pathname === '/' hoặc '/index')
  }

  const activeTab = getActiveTab()

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
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
        <Tabs.Screen name="map" />
        <Tabs.Screen name="bot" />
        <Tabs.Screen name="feed" />
        <Tabs.Screen name="account" />
      </Tabs>

      {/* ── Floating Custom Tab Bar (Hiển thị cố định đè lên các Tab) ── */}
      <View style={[styles.navWrapper, { bottom: insets.bottom + 24 }]}>
        <BlurView
          intensity={Platform.OS === 'android' ? 40 : 20}
          tint={colors.blurTint}
          style={[styles.navPill, { 
            backgroundColor: theme === 'light' ? 'rgba(255,255,255,0.7)' : 'rgba(15,15,20,0.5)',
            borderColor: colors.borderGlass
          }]}
        >
          <View style={[styles.navPillInnerBorder, { borderColor: colors.borderGlass }]} />

          {/* Feed — Tab */}
          <TouchableOpacity
            style={styles.navItem}
            activeOpacity={0.7}
            onPress={() => router.push('/feed')}
          >
            <Home
              size={20}
              color={activeTab === 'feed' ? colors.textActive : colors.textInactive}
            />
            <Text
              style={[
                activeTab === 'feed'
                  ? styles.navLabelActive
                  : styles.navLabelInactive,
                { color: activeTab === 'feed' ? colors.textActive : colors.textInactive }
              ]}
            >
              Feed
            </Text>
          </TouchableOpacity>

          {/* Map — Tab */}
          <TouchableOpacity
            style={styles.navItem}
            activeOpacity={0.7}
            onPress={() => router.push('/map')}
          >
            <Map
              size={20}
              color={activeTab === 'map' ? colors.textActive : colors.textInactive}
            />
            <Text
              style={[
                activeTab === 'map'
                  ? styles.navLabelActive
                  : styles.navLabelInactive,
                { color: activeTab === 'map' ? colors.textActive : colors.textInactive }
              ]}
            >
              Map
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
              color={activeTab === 'trips' ? colors.textActive : colors.textInactive}
            />
            <Text
              style={[
                activeTab === 'trips'
                  ? styles.navLabelActive
                  : styles.navLabelInactive,
                { color: activeTab === 'trips' ? colors.textActive : colors.textInactive }
              ]}
            >
              Trips
            </Text>
          </TouchableOpacity>

          {/* Bot — Tab */}
          <TouchableOpacity
            style={styles.navItem}
            activeOpacity={0.7}
            onPress={() => router.push('/bot')}
          >
            <MessageCircle
              size={20}
              color={activeTab === 'bot' ? colors.textActive : colors.textInactive}
            />
            <Text
              style={[
                activeTab === 'bot'
                  ? styles.navLabelActive
                  : styles.navLabelInactive,
                { color: activeTab === 'bot' ? colors.textActive : colors.textInactive }
              ]}
            >
              Bot
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
              color={activeTab === 'account' ? colors.textActive : colors.textInactive}
            />
            <Text
              style={[
                activeTab === 'account'
                  ? styles.navLabelActive
                  : styles.navLabelInactive,
                { color: activeTab === 'account' ? colors.textActive : colors.textInactive }
              ]}
            >
              Account
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
    gap: 20,
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 8,
    overflow: 'hidden',
    borderWidth: 1,
  },
  navPillInnerBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 999,
    borderWidth: 1,
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
  },
  navLabelActive: {
    fontFamily: 'System',
    fontSize: 10,
    fontWeight: '600',
  },
})
