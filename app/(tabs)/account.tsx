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
  ActivityIndicator,
} from 'react-native'
import { BlurView } from 'expo-blur'
import { LogOut, Image as ImageIcon } from 'lucide-react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { supabase } from '../../lib/supabase'
import { COLORS, GLASS_STYLES } from '../../constants/theme'
import { globalStyles } from '../../styles/globalStyles'
import { useProfile } from '../../hooks/useProfile'

export default function AccountTab() {
  const insets = useSafeAreaInsets()
  const headerHeight = insets.top + 56
  const { profile, loading, error, refetch } = useProfile()

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
          <LogOut size={20} color={COLORS.textInactive} />
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
        {/* Loading */}
        {loading && !profile && (
          <View style={styles.centerState}>
            <ActivityIndicator size="large" color="rgba(255,255,255,0.4)" />
            <Text style={styles.stateText}>Đang tải thông tin cá nhân...</Text>
          </View>
        )}

        {/* Error */}
        {!loading && error && (
          <View style={styles.centerState}>
            <Text style={styles.stateText}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={refetch}>
              <Text style={styles.retryText}>Thử lại</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Main Content */}
        {!loading && profile && (
          <>
            {/* Profile Card */}
            <View style={styles.profileCard}>
              <Image
                source={{ uri: profile.avatarUrl }}
                style={styles.avatar}
              />
              <Text style={styles.nameText}>{profile.displayName}</Text>
              <Text style={styles.emailText}>{profile.email}</Text>
              <Text style={styles.bioText}>
                Ghi lại hành trình khám phá thế giới ✈️ | Yêu những khung cảnh hoang sơ và ẩm thực châu Á.
              </Text>

              {/* Stats Bar */}
              <View style={styles.statsBar}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{profile.destinationsCount}</Text>
                  <Text style={styles.statLabel}>Trips</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{profile.momentsCount}</Text>
                  <Text style={styles.statLabel}>Moments</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>1</Text>
                  <Text style={styles.statLabel}>Followers</Text>
                </View>
              </View>
            </View>

            {/* My Moments Gallery Grid */}
            <View style={styles.galleryContainer}>
              <Text style={styles.sectionTitle}>Captured Moments ({profile.momentsImages.length})</Text>
              
              {profile.momentsImages.length === 0 ? (
                <View style={styles.emptyGallery}>
                  <View style={styles.emptyIconBg}>
                    <ImageIcon size={24} color={COLORS.textInactive} />
                  </View>
                  <Text style={styles.emptyText}>Chưa có khoảnh khắc nào được lưu lại.</Text>
                </View>
              ) : (
                <View style={styles.grid}>
                  {profile.momentsImages.map((img, i) => (
                    <TouchableOpacity key={i} style={styles.gridItem} activeOpacity={0.8}>
                      <Image source={{ uri: img }} style={styles.gridImage} />
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </>
        )}
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
  emailText: {
    fontFamily: 'System',
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: 12,
  },
  centerState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  stateText: {
    fontFamily: 'System',
    fontSize: 14,
    color: COLORS.textInactive,
  },
  retryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginTop: 8,
  },
  retryText: {
    fontFamily: 'System',
    fontSize: 13,
    color: COLORS.white,
  },
  emptyGallery: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 12,
    backgroundColor: COLORS.cardBackground,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  emptyIconBg: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontFamily: 'System',
    fontSize: 13,
    color: COLORS.textInactive,
    textAlign: 'center',
  },
})
