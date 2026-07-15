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
import { Plus, MapPin, ChevronDown } from 'lucide-react-native'
import { useRouter } from 'expo-router'

import { DestinationCard } from '../../components/travel/DestinationCard'
import { useStaggeredEntrance } from '../../hooks/useStaggeredEntrance'
import { globalStyles } from '../../styles/globalStyles'
import { useDestinations } from '../../hooks/useDestinations'
import { useTheme } from '../../hooks/useTheme'

const MAX_ANIM = 20
const STAGGER_DELAYS = Array.from({ length: MAX_ANIM }, (_, i) => i * 120 + 150)

export default function TripsTab() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { destinations, loading, error, refetch } = useDestinations()
  const animValues = useStaggeredEntrance(MAX_ANIM, STAGGER_DELAYS)
  const { colors, theme, isDark } = useTheme()

  const [selectedCountry, setSelectedCountry] = useState('Tất cả')
  const [dropdownOpen, setDropdownOpen] = useState(false)

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

  // 3. Chiều cao Header cố định
  const headerHeight = insets.top + 56

  return (
    <View style={[globalStyles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={theme === 'light' ? 'dark' : 'light'} translucent />

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
            <ActivityIndicator size="large" color={theme === 'light' ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.5)'} />
            <Text style={[styles.stateText, { color: colors.textInactive }]}>Đang tải địa điểm...</Text>
          </View>
        )}

        {/* Error */}
        {!loading && error && (
          <View style={styles.centerState}>
            <Text style={[styles.stateText, { color: colors.textInactive }]}>{error}</Text>
            <TouchableOpacity style={[styles.retryBtn, { backgroundColor: colors.cardBackground, borderColor: colors.borderGlass }]} onPress={refetch}>
              <Text style={[styles.retryText, { color: colors.textActive }]}>Thử lại</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Empty State (Khi chưa có địa điểm nào trong database) */}
        {!loading && !error && destinations.length === 0 && (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIconBg, { backgroundColor: theme === 'light' ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.05)', borderColor: colors.borderGlass }]}>
              <MapPin size={32} color={colors.textInactive} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.textActive }]}>Chưa có địa điểm nào</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textInactive }]}>
              Bắt đầu hành trình của bạn bằng cách tạo địa điểm đầu tiên!
            </Text>
            <TouchableOpacity
              style={[
                styles.createFirstBtn,
                { 
                  backgroundColor: colors.accentPrimaryGlass,
                  borderColor: colors.borderGlass,
                  shadowColor: colors.accentPrimary
                }
              ]}
              activeOpacity={0.8}
              onPress={() => router.push('/create-destination')}
            >
              <Plus size={16} color="#ffffff" />
              <Text style={styles.createFirstBtnText}>Tạo địa điểm đầu tiên</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Empty Filter State (Khi có địa điểm nhưng lọc ra trống) */}
        {!loading && !error && destinations.length > 0 && filteredDestinations.length === 0 && (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIconBg, { backgroundColor: theme === 'light' ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.05)', borderColor: colors.borderGlass }]}>
              <MapPin size={32} color={colors.textInactive} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.textActive }]}>Không có địa điểm phù hợp</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textInactive }]}>
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

      {/* ── Header + Filter Dropdown (Kính mờ bao phủ) ── */}
      <BlurView
        intensity={Platform.OS === 'android' ? 40 : 60}
        tint={colors.blurTint}
        style={[styles.headerContainer, { paddingTop: insets.top + 12, borderBottomColor: colors.borderGlass }]}
      >
        <View style={styles.headerTitleRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={[styles.headerTitle, { color: colors.textActive }]}>Trips</Text>
            {!loading && countries.length > 1 && (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setDropdownOpen(!dropdownOpen)}
                style={[
                  styles.countryDropdownBtn,
                  { 
                    backgroundColor: theme === 'light' ? 'rgba(0,0,0,0.03)' : 'rgba(255, 255, 255, 0.05)',
                    borderColor: colors.borderGlass
                  }
                ]}
              >
                <Text style={[styles.countryDropdownText, { color: colors.textSubtle }]}>
                  {selectedCountry}
                </Text>
                <ChevronDown size={14} color={colors.textInactive} />
              </TouchableOpacity>
            )}
          </View>

          {/* Nút thêm địa điểm mới */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.push('/create-destination')}
            style={[styles.glassRoundBtn, { backgroundColor: theme === 'light' ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.05)', borderColor: colors.borderGlass }]}
          >
            <Plus size={20} color={colors.textActive} />
          </TouchableOpacity>
        </View>

        {/* Hộp thoại kính mờ chọn quốc gia (Dropdown Overlay) */}
        {dropdownOpen && !loading && countries.length > 1 && (
          <View 
            style={[
              styles.dropdownList, 
              { 
                backgroundColor: theme === 'light' ? 'rgba(255,255,255,0.92)' : 'rgba(20, 20, 25, 0.92)',
                borderColor: colors.borderGlass,
                shadowColor: isDark ? '#000000' : 'rgba(0,0,0,0.1)'
              }
            ]}
          >
            <BlurView intensity={Platform.OS === 'android' ? 20 : 40} tint={colors.blurTint} style={StyleSheet.absoluteFillObject} />
            <View style={[styles.dropdownInnerBorder, { borderColor: colors.borderGlass }]} />
            <ScrollView style={{ maxHeight: 200 }} showsVerticalScrollIndicator={false}>
              {countries.map((country) => (
                <TouchableOpacity
                  key={country}
                  style={[
                    styles.dropdownItem,
                    selectedCountry === country && { backgroundColor: theme === 'light' ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.04)' }
                  ]}
                  onPress={() => {
                    setSelectedCountry(country)
                    setDropdownOpen(false)
                  }}
                >
                  <Text style={[
                    styles.dropdownItemText,
                    { 
                      color: selectedCountry === country ? colors.accentPrimary : colors.textActive,
                      fontWeight: selectedCountry === country ? '700' : '400'
                    }
                  ]}>
                    {country}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
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
    fontWeight: '700',
  },
  glassRoundBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countryDropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
  },
  countryDropdownText: {
    fontFamily: 'System',
    fontSize: 12,
  },
  dropdownList: {
    position: 'absolute',
    top: 56,
    left: 24,
    width: 160,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    elevation: 8,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    paddingVertical: 4,
    zIndex: 9999,
  },
  dropdownInnerBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 16,
    borderWidth: 1,
    pointerEvents: 'none',
  },
  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginHorizontal: 4,
    borderRadius: 10,
  },
  dropdownItemText: {
    fontFamily: 'System',
    fontSize: 13,
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
    textAlign: 'center',
  },
  retryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  retryText: {
    fontFamily: 'System',
    fontSize: 13,
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
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontFamily: 'System',
    fontSize: 18,
    fontWeight: '700',
  },
  emptySubtitle: {
    fontFamily: 'System',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },
  createFirstBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  createFirstBtnText: {
    fontFamily: 'System',
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
})
