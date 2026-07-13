import React from 'react'
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Dimensions,
} from 'react-native'
import { BlurView } from 'expo-blur'
import { LogOut } from 'lucide-react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { supabase } from '../../lib/supabase'
import { USER_STATS, MY_MOMENTS } from '../../constants/mockData'
import { COLORS, GLASS_STYLES } from '../../constants/theme'
import { globalStyles } from '../../styles/globalStyles'

export default function AccountTab() {
  const insets = useSafeAreaInsets()
  const headerHeight = insets.top + 56

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  return (
    <View style={globalStyles.container}>
      {/* ── Header ── */}
      <BlurView
        intensity={Platform.OS === 'android' ? 40 : GLASS_STYLES.headerIntensity}
        tint={COLORS.tintDark}
        style={[globalStyles.headerBase, { paddingTop: insets.top + 12 }]}
      >
        <Text style={globalStyles.headerTitle}>My Travel Profile</Text>
        <TouchableOpacity style={styles.headerButton} onPress={handleLogout}>
          <LogOut size={22} color={COLORS.textInactive} />
        </TouchableOpacity>
      </BlurView>

      <ScrollView
        style={globalStyles.scrollBase}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: headerHeight + 16, paddingBottom: insets.bottom + 96 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80' }}
            style={styles.avatar}
          />
          <Text style={styles.nameText}>Trong Vinh</Text>
          <Text style={styles.bioText}>
            Ghi lại hành trình khám phá thế giới ✈️ | Yêu những khung cảnh hoang sơ và ẩm thực châu Á.
          </Text>

          {/* Stats Bar */}
          <View style={styles.statsBar}>
            {USER_STATS.map((stat) => (
              <View key={stat.label} style={styles.statItem}>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* My Moments Gallery Grid */}
        <View style={styles.galleryContainer}>
          <Text style={styles.sectionTitle}>My Captured Moments</Text>
          <View style={styles.grid}>
            {MY_MOMENTS.map((img, i) => (
              <TouchableOpacity key={i} style={styles.gridItem} activeOpacity={0.8}>
                <Image source={{ uri: img }} style={styles.gridImage} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  )
}

const { width } = Dimensions.get('window')
const gridItemWidth = (width - 48) / 2 // 2 columns dynamically matching layout width

const styles = StyleSheet.create({
  headerButton: {
    padding: 4,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 20,
  },
  profileCard: {
    alignItems: 'center',
    backgroundColor: COLORS.cardBackground,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
    marginBottom: 12,
  },
  nameText: {
    fontFamily: 'System',
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 6,
  },
  bioText: {
    fontFamily: 'System',
    fontSize: 12,
    color: COLORS.textSubtle,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 12,
    marginBottom: 20,
  },
  statsBar: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    paddingTop: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontFamily: 'System',
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
  },
  statLabel: {
    fontFamily: 'System',
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  galleryContainer: {
    gap: 12,
  },
  sectionTitle: {
    fontFamily: 'System',
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
    paddingLeft: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  gridItem: {
    width: gridItemWidth,
    height: gridItemWidth,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: COLORS.cardBackground,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
})
