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
import { useTranslation } from '../../context/LanguageContext'

const MAX_ANIM = 20
const STAGGER_DELAYS = Array.from({ length: MAX_ANIM }, (_, i) => i * 120 + 150)

export default function TripsTab() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { destinations, loading, error, refetch } = useDestinations()
  const animValues = useStaggeredEntrance(MAX_ANIM, STAGGER_DELAYS)
  const { colors, theme, isDark } = useTheme()
  const { t, locale } = useTranslation()

  const [selectedCountry, setSelectedCountry] = useState('Tất cả')
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const translateCountry = (c: string) => {
    return c === 'Tất cả' ? (locale === 'vi' ? 'Tất cả' : 'All') : c
  }

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

  // 3. Chiều cao Header động để chừa khoảng cho dải filter chips
  const headerHeight = insets.top + 56 + (!loading && countries.length > 1 ? 52 : 0)

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
            <Text style={[styles.stateText, { color: colors.textInactive }]}>{t('loading')}</Text>
          </View>
        )}

        {/* Error */}
        {!loading && error && (
          <View style={styles.centerState}>
            <Text style={[styles.stateText, { color: colors.textInactive }]}>{error}</Text>
            <TouchableOpacity style={[styles.retryBtn, { backgroundColor: colors.cardBackground, borderColor: colors.borderGlass }]} onPress={refetch}>
              <Text style={[styles.retryText, { color: colors.textActive }]}>{locale === 'vi' ? 'Thử lại' : 'Retry'}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Empty State (Khi chưa có địa điểm nào trong database) */}
        {!loading && !error && destinations.length === 0 && (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIconBg, { backgroundColor: theme === 'light' ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.05)', borderColor: colors.borderGlass }]}>
              <MapPin size={32} color={colors.textInactive} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.textActive }]}>{t('emptyDestinations')}</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textInactive }]}>
              {t('emptyDestinationsSub')}
            </Text>
            <TouchableOpacity
              style={[
                styles.createFirstBtn,
                { 
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.05)',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.15)',
                  shadowColor: isDark ? '#ffffff' : '#000000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: isDark ? 0.12 : 0.06,
                  shadowRadius: 6,
                  elevation: 2,
                  overflow: 'hidden',
                }
              ]}
              activeOpacity={0.8}
              onPress={() => router.push('/destination/create')}
            >
              <BlurView
                intensity={Platform.OS === 'android' ? 20 : 35}
                tint={colors.blurTint}
                style={StyleSheet.absoluteFillObject}
              />
              <View style={[styles.innerHighlight, { borderRadius: 12, borderColor: isDark ? 'rgba(255, 255, 255, 0.35)' : 'rgba(255, 255, 255, 0.75)' }]} />
              <Plus size={16} color={colors.textActive} />
              <Text style={[styles.createFirstBtnText, { color: colors.textActive }]}>{t('addDestination')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Empty Filter State (Khi có địa điểm nhưng lọc ra trống) */}
        {!loading && !error && destinations.length > 0 && filteredDestinations.length === 0 && (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIconBg, { backgroundColor: theme === 'light' ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.05)', borderColor: colors.borderGlass }]}>
              <MapPin size={32} color={colors.textInactive} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.textActive }]}>
              {locale === 'vi' ? 'Không có địa điểm phù hợp' : 'No destinations match this country'}
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textInactive }]}>
              {locale === 'vi'
                ? `Bạn chưa tạo hành trình nào ở quốc gia "${selectedCountry}"`
                : `You haven't created any trips in "${selectedCountry}"`}
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

      {/* ── Header Container (Kính mờ bao phủ) ── */}
      <BlurView
        intensity={Platform.OS === 'android' ? 40 : 60}
        tint={colors.blurTint}
        style={[styles.headerContainer, { paddingTop: insets.top + 12, borderBottomColor: colors.borderGlass }]}
      >
        <View style={styles.headerTitleRow}>
          <Text style={[styles.headerTitle, { color: colors.textActive }]}>{t('tabHome')}</Text>
          
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.push('/destination/create')}
            style={[styles.glassRoundBtn, { backgroundColor: theme === 'light' ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.05)', borderColor: colors.borderGlass }]}
          >
            <Plus size={20} color={colors.textActive} />
          </TouchableOpacity>
        </View>

        {/* Horizontal scroll of country chips */}
        {!loading && countries.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScroll}
          >
            {countries.map((country) => {
              const isActive = selectedCountry === country
              return (
                <TouchableOpacity
                  key={country}
                  style={[
                    styles.filterChip,
                    {
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.02)',
                      borderColor: colors.borderGlass,
                    },
                    isActive && {
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.75)',
                      borderColor: isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.2)',
                      borderWidth: 1.5,
                    }
                  ]}
                  onPress={() => setSelectedCountry(country)}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      { color: colors.textInactive },
                      isActive && { color: colors.textActive, fontWeight: '700' }
                    ]}
                  >
                    {translateCountry(country)}
                  </Text>
                </TouchableOpacity>
              )
            })}
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
  filterScroll: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingBottom: 12,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterChipText: {
    fontFamily: 'System',
    fontSize: 13,
    fontWeight: '500',
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
    overflow: 'hidden',
  },
  innerHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 1.2,
    opacity: 0.8,
  },
  createFirstBtnText: {
    fontFamily: 'System',
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
})
