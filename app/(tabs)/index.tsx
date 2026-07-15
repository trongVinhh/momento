import React, { useState, useMemo } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ActivityIndicator,
  Animated,
} from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { BlurView } from 'expo-blur'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Plus, MapPin } from 'lucide-react-native'
import { useRouter } from 'expo-router'

import { DestinationCard } from '../../components/travel/DestinationCard'
import { COLORS, GLASS_STYLES } from '../../constants/theme'
import { useStaggeredEntrance } from '../../hooks/useStaggeredEntrance'
import { globalStyles } from '../../styles/globalStyles'
import { useDestinations } from '../../hooks/useDestinations'

const MAX_ANIM = 20
const STAGGER_DELAYS = Array.from({ length: MAX_ANIM }, (_, i) => i * 120 + 150)

export default function TripsTab() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { destinations, loading, error, refetch } = useDestinations()
  const animValues = useStaggeredEntrance(MAX_ANIM, STAGGER_DELAYS)

  const [selectedCountry, setSelectedCountry] = useState('Tất cả')

  // 1. Trích xuất danh sách Quốc gia duy nhất
  const countries = useMemo(() => {
    const list = destinations.map((d) => d.country).filter(Boolean)
    return ['Tất cả', ...Array.from(new Set(list))]
  }, [destinations])

  // 2. Lọc Địa điểm theo Quốc gia đang chọn
  const filteredDestinations = useMemo(() => {
    if (selectedCountry === 'Tất cả') return destinations
    return destinations.filter((d) => d.country === selectedCountry)
  }, [destinations, selectedCountry])

  // 3. Tính toán chiều cao của Header động để scroll padding khớp
  const filterBarHeight = countries.length > 1 ? 52 : 0
  const headerHeight = insets.top + 56 + filterBarHeight

  return (
    <View style={globalStyles.container}>
      <StatusBar style="light" translucent />

      {/* ── Scrollable Content ── */}
      <ScrollView
        style={globalStyles.scrollBase}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: headerHeight + 16, paddingBottom: insets.bottom + 96 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Loading */}
        {loading && (
          <View style={styles.centerState}>
            <ActivityIndicator size="large" color="rgba(255,255,255,0.5)" />
            <Text style={styles.stateText}>Đang tải địa điểm...</Text>
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

        {/* Empty State (Khi chưa có địa điểm nào trong database) */}
        {!loading && !error && destinations.length === 0 && (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconBg}>
              <MapPin size={32} color={COLORS.textInactive} />
            </View>
            <Text style={styles.emptyTitle}>Chưa có địa điểm nào</Text>
            <Text style={styles.emptySubtitle}>
              Bắt đầu hành trình của bạn bằng cách tạo địa điểm đầu tiên!
            </Text>
            <TouchableOpacity
              style={styles.createFirstBtn}
              activeOpacity={0.8}
              onPress={() => router.push('/create-destination')}
            >
              <Plus size={16} color={COLORS.white} />
              <Text style={styles.createFirstBtnText}>Tạo địa điểm đầu tiên</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Empty Filter State (Khi có địa điểm nhưng lọc ra trống) */}
        {!loading && !error && destinations.length > 0 && filteredDestinations.length === 0 && (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconBg}>
              <MapPin size={32} color={COLORS.textInactive} />
            </View>
            <Text style={styles.emptyTitle}>Không có địa điểm phù hợp</Text>
            <Text style={styles.emptySubtitle}>
              Bạn chưa tạo hành trình nào ở quốc gia "{selectedCountry}"
            </Text>
          </View>
        )}

        {/* Destination List */}
        {!loading && filteredDestinations.map((dest, i) => (
          <DestinationCard
            key={dest.id}
            name={dest.name}
            moments={dest.moments_count ?? 0}
            image={dest.image_url}
            animValue={animValues[i] || new Animated.Value(1)}
            onPress={() => router.push(`/destination/${dest.id}`)}
          />
        ))}
      </ScrollView>

      {/* ── Header + Filter Bar (Kính mờ bao phủ) ── */}
      <BlurView
        intensity={Platform.OS === 'android' ? 40 : GLASS_STYLES.headerIntensity}
        tint={COLORS.tintDark}
        style={[styles.headerContainer, { paddingTop: insets.top + 12 }]}
      >
        <View style={styles.headerTitleRow}>
          <Text style={styles.headerTitle}>Trips</Text>

          {/* Nút thêm địa điểm mới */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.push('/create-destination')}
            style={styles.glassRoundBtn}
          >
            <Plus size={20} color={COLORS.white} />
          </TouchableOpacity>
        </View>

        {/* Dynamic Country Filter Scroll (Chỉ hiện khi có từ 2 quốc gia trở lên bao gồm "Tất cả") */}
        {!loading && countries.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.countryFilterRow}
            style={styles.countryFilterScroll}
          >
            {countries.map((country) => (
              <TouchableOpacity
                key={country}
                style={[
                  styles.countryPill,
                  selectedCountry === country && styles.countryPillActive,
                ]}
                onPress={() => setSelectedCountry(country)}
              >
                <Text
                  style={[
                    styles.countryPillText,
                    selectedCountry === country && styles.countryPillTextActive,
                  ]}
                >
                  {country}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </BlurView>
    </View>
  )
}

const styles = StyleSheet.create({
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 99,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  headerTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    height: 56,
  },
  headerTitle: {
    fontFamily: 'System',
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.white,
  },
  glassRoundBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  countryFilterScroll: {
    height: 52,
    maxHeight: 52,
  },
  countryFilterRow: {
    paddingHorizontal: 24,
    alignItems: 'center',
    gap: 8,
    height: '100%',
  },
  countryPill: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  countryPillActive: {
    backgroundColor: 'rgba(59, 130, 246, 0.75)',
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  countryPillText: {
    fontFamily: 'System',
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textInactive,
  },
  countryPillTextActive: {
    color: COLORS.white,
    fontWeight: '600',
  },
  scrollContent: {
    paddingHorizontal: 24,
    gap: 16,
  },
  centerState: {
    alignItems: 'center',
    paddingTop: 60,
    gap: 12,
  },
  stateText: {
    fontFamily: 'System',
    fontSize: 14,
    color: COLORS.textInactive,
    textAlign: 'center',
  },
  retryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  retryText: {
    fontFamily: 'System',
    fontSize: 13,
    color: COLORS.white,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 32,
    gap: 12,
  },
  emptyIconBg: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontFamily: 'System',
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.white,
  },
  emptySubtitle: {
    fontFamily: 'System',
    fontSize: 13,
    color: COLORS.textInactive,
    textAlign: 'center',
    lineHeight: 20,
  },
  createFirstBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(59, 130, 246, 0.75)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  createFirstBtnText: {
    fontFamily: 'System',
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
  },
})
