import React, { useMemo, useRef, useState, useCallback, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Platform,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Easing,
  Modal,
  Dimensions,
} from 'react-native'
import MapView, { Marker } from 'react-native-maps'
import { BlurView } from 'expo-blur'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Compass, MapPin, ArrowRight, X, Image as ImageIcon } from 'lucide-react-native'

import { useDestinations } from '../../hooks/useDestinations'
import { useTheme } from '../../hooks/useTheme'
import { globalStyles } from '../../styles/globalStyles'
import { useTranslation } from '../../context/LanguageContext'
import type { DestinationRow } from '../../constants/mockData'

// ── Dark map style ─────────────────────────────────────────────────────────────
const DARK_MAP_STYLE = [
  { "elementType": "geometry", "stylers": [{ "color": "#111115" }] },
  { "elementType": "labels.text.fill", "stylers": [{ "color": "#757480" }] },
  { "elementType": "labels.text.stroke", "stylers": [{ "color": "#111115" }] },
  { "featureType": "administrative", "elementType": "geometry", "stylers": [{ "color": "#282730" }] },
  { "featureType": "administrative.country", "elementType": "geometry.stroke", "stylers": [{ "color": "#3c3b46" }, { "weight": 1 }] },
  { "featureType": "landscape", "elementType": "geometry", "stylers": [{ "color": "#16151c" }] },
  { "featureType": "poi", "stylers": [{ "visibility": "off" }] },
  { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#1d1c24" }] },
  { "featureType": "road", "elementType": "labels.text.fill", "stylers": [{ "color": "#52515f" }] },
  { "featureType": "road.highway", "elementType": "geometry", "stylers": [{ "color": "#2c2b36" }] },
  { "featureType": "transit", "stylers": [{ "visibility": "off" }] },
  { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#0d0c11" }] },
  { "featureType": "water", "elementType": "labels.text.fill", "stylers": [{ "color": "#383742" }] },
]

const { height: SCREEN_HEIGHT } = Dimensions.get('window')
const SHEET_HEIGHT = 290

// ── Photo Marker ───────────────────────────────────────────────────────────────
function PhotoMarker({ imageUrl, selected }: { imageUrl: string; selected: boolean }) {
  return (
    <View pointerEvents="none" style={[photoMarkerStyles.container, selected && photoMarkerStyles.selectedContainer]}>
      <View pointerEvents="none" style={[photoMarkerStyles.ring, selected && photoMarkerStyles.selectedRing]}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={photoMarkerStyles.image} />
        ) : (
          <View style={photoMarkerStyles.placeholder}>
            <ImageIcon size={14} color="rgba(255,255,255,0.5)" />
          </View>
        )}
      </View>
      {/* Triangle tail */}
      <View pointerEvents="none" style={[photoMarkerStyles.tail, selected && photoMarkerStyles.selectedTail]} />

    </View>
  )
}

const photoMarkerStyles = StyleSheet.create({
  container: { alignItems: 'center' },
  selectedContainer: { transform: [{ scale: 1.15 }] },
  ring: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2.5,
    borderColor: 'rgba(255,255,255,0.85)',
    overflow: 'hidden',
    backgroundColor: '#1a1a24',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  selectedRing: {
    borderColor: '#ef4444',
    shadowColor: '#ef4444',
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  image: { width: '100%', height: '100%' },
  placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#2a2a38' },
  tail: {
    width: 0, height: 0,
    borderLeftWidth: 6, borderRightWidth: 6, borderTopWidth: 8,
    borderLeftColor: 'transparent', borderRightColor: 'transparent',
    borderTopColor: 'rgba(255,255,255,0.85)',
    marginTop: -1,
  },
  selectedTail: { borderTopColor: '#ef4444' },
})

// ─────────────────────────────────────────────────────────────────────────────

export default function MapTab() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { destinations, loading, error, refetch } = useDestinations()
  const { colors, isDark } = useTheme()
  const { t, locale } = useTranslation()

  const [selectedDest, setSelectedDest] = useState<DestinationRow | null>(null)
  const [sheetVisible, setSheetVisible] = useState(false)
  const sheetAnim = useRef(new Animated.Value(0)).current

  const validDestinations = useMemo(() =>
    destinations.filter(d => typeof d.latitude === 'number' && typeof d.longitude === 'number')
  , [destinations])

  const initialRegion = {
    latitude: 21.028511,
    longitude: 105.804817,
    latitudeDelta: 7.5,
    longitudeDelta: 7.5,
  }

  const showSheet = useCallback((dest: DestinationRow) => {
    setSelectedDest(dest)
    setSheetVisible(true)  // useEffect triggers animation after Modal renders
  }, [])

  const hideSheet = useCallback(() => {
    Animated.timing(sheetAnim, {
      toValue: 0,
      duration: 220,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      setSheetVisible(false)
      setSelectedDest(null)
    })
  }, [sheetAnim])

  // Animate in AFTER Modal renders (useEffect fires post-commit)
  useEffect(() => {
    if (sheetVisible) {
      sheetAnim.setValue(0)
      Animated.timing(sheetAnim, {
        toValue: 1,
        duration: 340,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start()
    }
  }, [sheetVisible, sheetAnim])

  const sheetTranslateY = sheetAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [SHEET_HEIGHT + 120, 0],
  })

  const backdropOpacity = sheetAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  })

  return (
    <View style={[globalStyles.container, { backgroundColor: colors.background }]}>
      {/* ── Header ── */}
      <BlurView
        intensity={Platform.OS === 'android' ? 40 : 60}
        tint={colors.blurTint}
        style={[globalStyles.headerBase, { paddingTop: insets.top + 12, zIndex: 10, borderBottomColor: colors.borderGlass }]}
      >
        <View>
          <Text style={[globalStyles.headerTitle, { color: colors.textActive }]}>{t('mapTitle')}</Text>
          {validDestinations.length > 0 && (
            <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
              {validDestinations.length} {locale === 'vi' ? 'điểm đến đã đánh dấu' : 'destinations marked'}
            </Text>
          )}
        </View>
        <TouchableOpacity
          style={[styles.headerIconBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)', borderColor: colors.borderGlass }]}
          onPress={refetch}
        >
          <Compass size={20} color={colors.textInactive} />
        </TouchableOpacity>
      </BlurView>

      {/* Loading state */}
      {loading && validDestinations.length === 0 && (
        <View style={[styles.centerState, { backgroundColor: colors.background }]}>
          <ActivityIndicator size="large" color={isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.3)'} />
          <Text style={[styles.stateText, { color: colors.textInactive }]}>
            {locale === 'vi' ? 'Đang tải bản đồ hành trình...' : 'Loading journey map...'}
          </Text>
        </View>
      )}

      {/* Error state */}
      {!loading && error && (
        <View style={[styles.centerState, { backgroundColor: colors.background }]}>
          <Text style={[styles.stateText, { color: colors.textInactive }]}>{error}</Text>
          <TouchableOpacity style={[styles.retryBtn, { backgroundColor: colors.cardBackground, borderColor: colors.borderGlass }]} onPress={refetch}>
            <Text style={[styles.retryText, { color: colors.textActive }]}>{locale === 'vi' ? 'Thử lại' : 'Retry'}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Map View ── */}
      {(!loading || validDestinations.length > 0) && (
        <MapView
          style={StyleSheet.absoluteFillObject}
          initialRegion={initialRegion}
          customMapStyle={isDark ? DARK_MAP_STYLE : undefined}
          provider={Platform.OS === 'android' ? 'google' : undefined}
          showsUserLocation
          showsCompass={false}
          showsMyLocationButton={false}
        >
          {validDestinations.map((dest) => (
            <Marker
              key={dest.id}
              coordinate={{ latitude: dest.latitude!, longitude: dest.longitude! }}
              tracksViewChanges={false}
              onPress={() => showSheet(dest)}
            >
              <PhotoMarker
                imageUrl={dest.image_url || ''}
                selected={selectedDest?.id === dest.id}
              />
            </Marker>
          ))}
        </MapView>
      )}

      {/* ── Bottom Sheet as Modal (renders outside parent, never clipped) ── */}
      <Modal
        visible={sheetVisible}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={hideSheet}
      >
        {/* Backdrop */}
        <Animated.View
          style={[styles.backdrop, { opacity: backdropOpacity }]}
        >
          <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={hideSheet} />
        </Animated.View>

        {/* Sheet */}
        <Animated.View
          style={[
            styles.sheet,
            {
              transform: [{ translateY: sheetTranslateY }],
              paddingBottom: insets.bottom + 16,
              borderColor: colors.borderGlass,
            }
          ]}
        >
          <BlurView
            intensity={Platform.OS === 'android' ? 60 : 80}
            tint={isDark ? 'dark' : 'light'}
            style={StyleSheet.absoluteFillObject}
          />
          <View style={[styles.sheetInnerBorder, { borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.8)' }]} />
          <View style={[styles.sheetHandle, { backgroundColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)' }]} />

          <TouchableOpacity
            style={[styles.closeBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)', borderColor: colors.borderGlass }]}
            onPress={hideSheet}
          >
            <X size={14} color={colors.textMuted} />
          </TouchableOpacity>

          {selectedDest && (
            <View style={styles.sheetContent}>
              <View style={[styles.sheetImageWrapper, { borderColor: colors.borderGlass }]}>
                {selectedDest.image_url ? (
                  <Image source={{ uri: selectedDest.image_url }} style={styles.sheetImage} />
                ) : (
                  <View style={[styles.sheetImagePlaceholder, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
                    <ImageIcon size={28} color={colors.textMuted} />
                  </View>
                )}
              </View>

              <View style={styles.sheetInfo}>
                <Text style={[styles.sheetName, { color: colors.textActive }]} numberOfLines={2}>
                  {selectedDest.name}
                </Text>

                <View style={styles.sheetCountryRow}>
                  <MapPin size={12} color="#ef4444" />
                  <Text style={[styles.sheetCountry, { color: colors.textSubtle }]}>
                    {selectedDest.country || 'Việt Nam'}
                  </Text>
                </View>

                {selectedDest.description ? (
                  <Text style={[styles.sheetDesc, { color: colors.textMuted }]} numberOfLines={2}>
                    {selectedDest.description}
                  </Text>
                ) : null}

                <View style={styles.sheetFooter}>
                  <View style={[styles.momentsBadge, { backgroundColor: isDark ? 'rgba(239,68,68,0.12)' : 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.25)' }]}>
                    <Text style={[styles.momentsBadgeText, { color: '#ef4444' }]}>
                      {selectedDest.moments_count ?? 0} {locale === 'vi' ? 'khoảnh khắc' : 'moments'}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.viewBtn,
                      {
                        backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                        borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.12)',
                        overflow: 'hidden',
                      }
                    ]}
                    onPress={() => {
                      hideSheet()
                      setTimeout(() => router.push(`/destination/${selectedDest.id}`), 260)
                    }}
                    activeOpacity={0.8}
                  >
                    <BlurView intensity={isDark ? 20 : 15} tint={colors.blurTint} style={StyleSheet.absoluteFillObject} />
                    <Text style={[styles.viewBtnText, { color: colors.textActive }]}>
                      {locale === 'vi' ? 'Xem chi tiết' : 'View Details'}
                    </Text>
                    <ArrowRight size={14} color={colors.textActive} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        </Animated.View>
      </Modal>
    </View>
  )
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  // Header
  headerSubtitle: {
    fontFamily: 'System',
    fontSize: 11,
    marginTop: 1,
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // States
  centerState: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  stateText: { fontFamily: 'System', fontSize: 14 },
  retryBtn: {
    paddingHorizontal: 20, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1,
  },
  retryText: { fontFamily: 'System', fontSize: 13 },

  // Backdrop
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.25)',
    zIndex: 10,
  },

  // Bottom Sheet
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingHorizontal: 20,
    paddingTop: 16,
    overflow: 'hidden',
  },
  sheetInnerBorder: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1.2,
    pointerEvents: 'none',
  },
  sheetHandle: {
    width: 36, height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  closeBtn: {
    position: 'absolute',
    top: 16, right: 20,
    width: 28, height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Sheet Content
  sheetContent: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'flex-start',
  },
  sheetImageWrapper: {
    width: 110,
    height: 145,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    flexShrink: 0,
  },
  sheetImage: { width: '100%', height: '100%' },
  sheetImagePlaceholder: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
  },
  sheetInfo: {
    flex: 1,
    gap: 6,
    paddingTop: 2,
  },
  sheetName: {
    fontFamily: 'System',
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 22,
  },
  sheetCountryRow: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
  },
  sheetCountry: {
    fontFamily: 'System', fontSize: 12, fontWeight: '500',
  },
  sheetDesc: {
    fontFamily: 'System', fontSize: 12, lineHeight: 17,
  },
  sheetFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
    flexWrap: 'wrap',
  },
  momentsBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  momentsBadgeText: {
    fontFamily: 'System', fontSize: 11, fontWeight: '700',
  },
  viewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  viewBtnText: {
    fontFamily: 'System', fontSize: 12, fontWeight: '700',
  },
})
