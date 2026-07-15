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
  ScrollView,
  Alert,
} from 'react-native'
import MapView, { Marker, Polygon } from 'react-native-maps'
import { BlurView } from 'expo-blur'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Compass, MapPin, ArrowRight, X, Image as ImageIcon, Share2 } from 'lucide-react-native'
import * as Sharing from 'expo-sharing'
import { captureRef } from 'react-native-view-shot'

import { useDestinations } from '../../hooks/useDestinations'
import { useTheme } from '../../hooks/useTheme'
import { globalStyles } from '../../styles/globalStyles'
import { useTranslation } from '../../context/LanguageContext'
import { supabase } from '../../lib/supabase'
import { parseImageUrls } from '../../utils/imageParser'
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
const SHEET_HEIGHT = 365

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
  container: { 
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0)',
    opacity: 0.99, // Force offscreen alpha composition buffer on Android to avoid black corners
  },
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
    shadowOpacity: Platform.OS === 'ios' ? 0.35 : 0,
    shadowRadius: Platform.OS === 'ios' ? 8 : 0,
    elevation: 0,
  },
  selectedRing: {
    borderColor: '#ef4444',
    shadowColor: '#ef4444',
    shadowOpacity: Platform.OS === 'ios' ? 0.5 : 0,
    shadowRadius: Platform.OS === 'ios' ? 10 : 0,
  },
  image: { 
    width: '100%', 
    height: '100%',
    borderRadius: 22, // Clip image directly as a circle in bitmap rendering
  },
  placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#2a2a38', borderRadius: 22 },
  tail: {
    width: 0, height: 0,
    borderLeftWidth: 6, borderRightWidth: 6, borderTopWidth: 8,
    borderLeftColor: 'rgba(0,0,0,0)', borderRightColor: 'rgba(0,0,0,0)',
    borderTopColor: 'rgba(255,255,255,0.85)',
    marginTop: -1,
    backgroundColor: 'rgba(0,0,0,0)',
  },
  selectedTail: { borderTopColor: '#ef4444' },
})

// Memoized marker component to completely avoid parent re-renders causing marker flicker
const MemoizedMarker = React.memo(
  ({ dest, onPress }: { dest: DestinationRow; onPress: () => void }) => {
    return (
      <Marker
        coordinate={{ latitude: dest.latitude!, longitude: dest.longitude! }}
        tracksViewChanges={false}
        onPress={onPress}
      >
        <PhotoMarker imageUrl={dest.image_url || ''} selected={false} />
      </Marker>
    )
  },
  (prev, next) => {
    return (
      prev.dest.id === next.dest.id &&
      prev.dest.image_url === next.dest.image_url &&
      prev.dest.latitude === next.dest.latitude &&
      prev.dest.longitude === next.dest.longitude
    )
  }
)

const COUNTRY_CODES: Record<string, string> = {
  'Việt Nam': 'VNM',
  'Vietnam': 'VNM',
  'Nhật Bản': 'JPN',
  'Japan': 'JPN',
  'Hàn Quốc': 'KOR',
  'Korea': 'KOR',
  'Thái Lan': 'THA',
  'Thailand': 'THA',
  'Singapore': 'SGP',
  'Malaysia': 'MYS',
  'Pháp': 'FRA',
  'France': 'FRA',
  'Đức': 'DEU',
  'Germany': 'DEU',
  'Ý': 'ITA',
  'Italy': 'ITA',
  'Mỹ': 'USA',
  'United States': 'USA',
  'Úc': 'AUS',
  'Australia': 'AUS',
  'Anh': 'GBR',
  'United Kingdom': 'GBR',
}

interface MapCoordinate {
  latitude: number
  longitude: number
}

// Convert GeoJSON Polygon / MultiPolygon geometries into MapCoordinate paths
const parseGeoJsonGeometry = (geometry: any): MapCoordinate[][] => {
  if (!geometry) return []
  const { type, coordinates } = geometry
  const polygonPaths: MapCoordinate[][] = []

  if (type === 'Polygon') {
    coordinates.forEach((ring: any) => {
      const path = ring.map((coord: any) => ({
        latitude: coord[1],
        longitude: coord[0],
      }))
      polygonPaths.push(path)
    })
  } else if (type === 'MultiPolygon') {
    coordinates.forEach((polygon: any) => {
      polygon.forEach((ring: any) => {
        const path = ring.map((coord: any) => ({
          latitude: coord[1],
          longitude: coord[0],
        }))
        polygonPaths.push(path)
      })
    })
  }

  return polygonPaths
}

// ─────────────────────────────────────────────────────────────────────────────

export default function MapTab() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { destinations, loading, error, refetch } = useDestinations()
  const { colors, isDark } = useTheme()
  const { t, locale } = useTranslation()

  const [selectedDest, setSelectedDest] = useState<DestinationRow | null>(null)
  const [sheetVisible, setSheetVisible] = useState(false)
  const [selectedDestMoments, setSelectedDestMoments] = useState<any[]>([])
  const [loadingMoments, setLoadingMoments] = useState(false)
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

  const mapRef = useRef<MapView | null>(null)
  const mapContainerRef = useRef<View | null>(null)
  const [sharing, setSharing] = useState(false)
  const [shareModalVisible, setShareModalVisible] = useState(false)
  const [shareCountry, setShareCountry] = useState<string | null>(null)
  const [geoJsonPolygons, setGeoJsonPolygons] = useState<MapCoordinate[][]>([])

  // Unique list of visited countries
  const countries = useMemo(() => {
    const list = destinations.map((d) => d.country).filter(Boolean)
    return ['Tất cả', ...Array.from(new Set(list))]
  }, [destinations])

  const translateCountry = (c: string) => {
    return c === 'Tất cả' ? (locale === 'vi' ? 'Tất cả' : 'All') : c
  }

  // Bounding box calculation for fallback
  const calculateBoundingBox = (countryName: string): MapCoordinate[] | null => {
    const coords = validDestinations
      .filter((d) => d.country === countryName)
      .map((d) => ({ lat: d.latitude!, lng: d.longitude! }))
    if (coords.length === 0) return null

    let minLat = Math.min(...coords.map((c) => c.lat))
    let maxLat = Math.max(...coords.map((c) => c.lat))
    let minLng = Math.min(...coords.map((c) => c.lng))
    let maxLng = Math.max(...coords.map((c) => c.lng))

    // Expand boundary slightly so pins are padded nicely
    const padding = 0.35
    minLat -= padding
    maxLat += padding
    minLng -= padding
    maxLng += padding

    return [
      { latitude: minLat, longitude: minLng },
      { latitude: minLat, longitude: maxLng },
      { latitude: maxLat, longitude: maxLng },
      { latitude: maxLat, longitude: minLng },
    ]
  }

  const handleShareMap = () => {
    setShareModalVisible(true)
  }

  const executeShareMap = async (countryName: string) => {
    setShareModalVisible(false)
    setSharing(true)
    setShareCountry(countryName)
    setGeoJsonPolygons([]) // clear previous

    let polygonsToRender: MapCoordinate[][] = []

    if (countryName !== 'Tất cả') {
      const code = COUNTRY_CODES[countryName]
      if (code) {
        try {
          // Fetch simplified country boundary GeoJSON
          const res = await fetch(`https://raw.githubusercontent.com/johan/world.geo.json/master/countries/${code}.geo.json`)
          if (res.ok) {
            const data = await res.json()
            if (data.features && data.features[0] && data.features[0].geometry) {
              polygonsToRender = parseGeoJsonGeometry(data.features[0].geometry)
              setGeoJsonPolygons(polygonsToRender)
            }
          }
        } catch (fetchErr) {
          console.warn('Failed to fetch country geojson boundary, falling back to bounding box:', fetchErr)
        }
      }

      // Fallback: if fetch failed or country code not mapped, calculate rectangular bounding box
      if (polygonsToRender.length === 0) {
        const box = calculateBoundingBox(countryName)
        if (box) {
          polygonsToRender = [box]
          setGeoJsonPolygons(polygonsToRender)
        }
      }
    }

    // Give state updates time to apply boundary coordinates highlight
    setTimeout(async () => {
      try {
        if (mapRef.current) {
          // If we are sharing a specific country and fetched its boundary GeoJSON, fit map to all boundary coordinates
          const boundaryCoords = polygonsToRender.flat()
          
          if (boundaryCoords.length > 0) {
            mapRef.current.fitToCoordinates(boundaryCoords, {
              edgePadding: { top: 90, right: 90, bottom: 90, left: 90 },
              animated: false,
            })
          } else {
            // Fallback / "Tất cả" - fit map to visited destinations coordinates
            const countryCoords = validDestinations
              .filter((d) => countryName === 'Tất cả' || d.country === countryName)
              .map((d) => ({ latitude: d.latitude!, longitude: d.longitude! }))

            if (countryCoords.length > 0) {
              mapRef.current.fitToCoordinates(countryCoords, {
                edgePadding: { top: 120, right: 120, bottom: 120, left: 120 },
                animated: false,
              })
            }
          }
        }

        // Wait another brief tick for layout rendering to settle
        setTimeout(async () => {
          try {
            if (!mapContainerRef.current) return
            const uri = await captureRef(mapContainerRef.current, {
              format: 'png',
              quality: 0.95,
            })

            const isAvailable = await Sharing.isAvailableAsync()
            if (isAvailable) {
              await Sharing.shareAsync(uri, {
                dialogTitle: locale === 'vi' ? 'Chia sẻ bản đồ hành trình của bạn' : 'Share your journey map',
                mimeType: 'image/png',
              })
            } else {
              Alert.alert(
                locale === 'vi' ? 'Thông báo' : 'Notice',
                locale === 'vi' 
                  ? 'Tính năng chia sẻ không khả dụng trên thiết bị của bạn.' 
                  : 'Sharing is not available on your device.'
              )
            }
          } catch (err) {
            console.error('Error sharing map snapshot:', err)
            Alert.alert(
              locale === 'vi' ? 'Lỗi' : 'Error',
              locale === 'vi' ? 'Không thể xuất ảnh chụp bản đồ.' : 'Failed to export map snapshot.'
            )
          } finally {
            setSharing(false)
            setShareCountry(null)
            setGeoJsonPolygons([]) // clear boundary highlighting
          }
        }, 1250)
      } catch (err) {
        console.error('Error fitting map layout viewport:', err)
        setSharing(false)
        setShareCountry(null)
        setGeoJsonPolygons([])
      }
    }, 750)
  }

  // Fetch moments for the selected destination when it is opened
  useEffect(() => {
    if (!selectedDest) {
      setSelectedDestMoments([])
      return
    }

    const fetchMoments = async () => {
      setLoadingMoments(true)
      try {
        const { data, error } = await supabase
          .from('moments')
          .select('id, image_url, title')
          .eq('destination_id', selectedDest.id)
          .order('created_at', { ascending: false })
          .limit(8)

        if (error) throw error
        setSelectedDestMoments(data || [])
      } catch (err) {
        console.error('Failed to load destination moments:', err)
      } finally {
        setLoadingMoments(false)
      }
    }

    fetchMoments()
  }, [selectedDest])

  const showSheet = useCallback((dest: DestinationRow) => {
    setSelectedDest(dest)
    setSheetVisible(true)  // useEffect triggers animation after Modal renders

    if (mapRef.current && typeof dest.latitude === 'number' && typeof dest.longitude === 'number') {
      // Offset latitude slightly (pushing pin up) so it is not covered by the 360dp bottom sheet
      const latOffset = 0.52
      mapRef.current.animateToRegion({
        latitude: dest.latitude - latOffset,
        longitude: dest.longitude,
        latitudeDelta: 2.2,
        longitudeDelta: 2.2,
      }, 550)
    }
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
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <TouchableOpacity
            style={[styles.headerIconBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)', borderColor: colors.borderGlass }]}
            onPress={refetch}
          >
            <Compass size={20} color={colors.textInactive} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.headerIconBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)', borderColor: colors.borderGlass }]}
            onPress={handleShareMap}
          >
            <Share2 size={18} color={colors.textInactive} />
          </TouchableOpacity>
        </View>
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
        <View ref={mapContainerRef} style={StyleSheet.absoluteFillObject} collapsable={false}>
          <MapView
            ref={mapRef}
            style={StyleSheet.absoluteFillObject}
          initialRegion={initialRegion}
          customMapStyle={isDark ? DARK_MAP_STYLE : undefined}
          provider={Platform.OS === 'android' ? 'google' : undefined}
          showsUserLocation
          showsCompass={false}
          showsMyLocationButton={false}
        >
          {validDestinations
            .filter((dest) => !shareCountry || shareCountry === 'Tất cả' || dest.country === shareCountry)
            .map((dest) => (
              <MemoizedMarker
                key={dest.id}
                dest={dest}
                onPress={() => showSheet(dest)}
              />
            ))}

          {/* Active Highlighted Marker on top */}
          {selectedDest && (
            <Marker
              key={`selected-${selectedDest.id}`}
              coordinate={{ latitude: selectedDest.latitude!, longitude: selectedDest.longitude! }}
              zIndex={999}
              tracksViewChanges={true}
            >
              <PhotoMarker
                imageUrl={selectedDest.image_url || ''}
                selected={true}
              />
            </Marker>
          )}

          {shareCountry && geoJsonPolygons.map((path, idx) => (
            <Polygon
              key={`border-${idx}`}
              coordinates={path}
              fillColor={isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)'}
              strokeColor={isDark ? 'rgba(255, 255, 255, 0.65)' : 'rgba(0, 0, 0, 0.45)'}
              strokeWidth={2}
              lineDashPattern={[6, 6]}
            />
          ))}
          </MapView>

          {/* Postcard Glass Overlay Card - visible only during screenshot capture */}
          {sharing && (
            <View style={styles.shareOverlayCard}>
              <BlurView intensity={Platform.OS === 'android' ? 60 : 80} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFillObject} />
              <View style={[styles.shareOverlayInnerBorder, { borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }]} />
              
              <Text style={[styles.shareOverlayTitle, { color: colors.textActive }]}>MOMENTO</Text>
              
              <View style={styles.shareOverlayRow}>
                <Text style={[styles.shareOverlayLabel, { color: colors.textMuted }]}>{locale === 'vi' ? 'Quốc gia:' : 'Country:'}</Text>
                <Text style={[styles.shareOverlayValue, { color: colors.textActive }]} numberOfLines={1}>
                  {translateCountry(shareCountry || 'Tất cả')}
                </Text>
              </View>

              <View style={styles.shareOverlayRow}>
                <Text style={[styles.shareOverlayLabel, { color: colors.textMuted }]}>{locale === 'vi' ? 'Năm:' : 'Year:'}</Text>
                <Text style={[styles.shareOverlayValue, { color: colors.textActive }]}>{new Date().getFullYear()}</Text>
              </View>

              <View style={styles.shareOverlayRow}>
                <Text style={[styles.shareOverlayLabel, { color: colors.textMuted }]}>{locale === 'vi' ? 'Điểm đến:' : 'Places:'}</Text>
                <Text style={[styles.shareOverlayValue, { color: colors.textActive }]}>
                  {validDestinations.filter(d => !shareCountry || shareCountry === 'Tất cả' || d.country === shareCountry).length}
                </Text>
              </View>
            </View>
          )}
        </View>
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
              {/* Header row: Left: Name, Country, Description. Right: Main Image */}
              <View style={styles.sheetTopRow}>
                <View style={styles.sheetHeaderInfo}>
                  <Text style={[styles.sheetName, { color: colors.textActive }]} numberOfLines={2}>
                    {selectedDest.name}
                  </Text>
                  <View style={styles.sheetCountryRow}>
                    <MapPin size={12} color="#ef4444" style={{ marginRight: 2 }} />
                    <Text style={[styles.sheetCountry, { color: colors.textSubtle }]}>
                      {selectedDest.country || 'Việt Nam'}
                    </Text>
                  </View>
                  {selectedDest.description ? (
                    <Text style={[styles.sheetDesc, { color: colors.textMuted }]} numberOfLines={2}>
                      {selectedDest.description}
                    </Text>
                  ) : null}
                </View>
                
                {/* Small cover image on the top right */}
                <View style={[styles.sheetThumbImageWrapper, { borderColor: colors.borderGlass }]}>
                  {selectedDest.image_url ? (
                    <Image source={{ uri: selectedDest.image_url }} style={styles.sheetThumbImage} />
                  ) : (
                    <View style={[styles.sheetImagePlaceholder, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
                      <ImageIcon size={18} color={colors.textMuted} />
                    </View>
                  )}
                </View>
              </View>

              {/* Middle row: Photo strip of latest moments at this destination */}
              <View style={styles.momentsStripSection}>
                <Text style={[styles.momentsStripTitle, { color: colors.textMuted }]}>
                  {locale === 'vi' ? 'Khoảnh khắc ghi lại gần đây' : 'Captured moments recently'}
                </Text>
                
                {loadingMoments ? (
                  <View style={styles.momentsStripLoading}>
                    <ActivityIndicator size="small" color={colors.accentPrimary} />
                  </View>
                ) : selectedDestMoments.length === 0 ? (
                  <Text style={[styles.emptyMomentsText, { color: colors.textMuted }]}>
                    {locale === 'vi' ? 'Chưa có hình ảnh khoảnh khắc nào.' : 'No moment images captured yet.'}
                  </Text>
                ) : (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.momentsStripScroll}
                  >
                    {selectedDestMoments.map((mom) => {
                      const urls = parseImageUrls(mom.image_url)
                      const firstUrl = urls[0] || ''
                      return (
                        <TouchableOpacity
                          key={mom.id}
                          style={[styles.momentStripItem, { borderColor: colors.borderGlass }]}
                          onPress={() => {
                            hideSheet()
                            setTimeout(() => router.push(`/moment/${mom.id}`), 260)
                          }}
                        >
                          {firstUrl ? (
                            <Image source={{ uri: firstUrl }} style={styles.momentStripImage} />
                          ) : (
                            <View style={styles.momentStripImagePlaceholder}>
                              <ImageIcon size={14} color={colors.textMuted} />
                            </View>
                          )}
                        </TouchableOpacity>
                      )
                    })}
                  </ScrollView>
                )}
              </View>

              {/* Bottom row: Footer info & Details button */}
              <View style={styles.sheetFooterRow}>
                <View style={[styles.momentsBadge, { backgroundColor: isDark ? 'rgba(239,68,68,0.12)' : 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.25)' }]}>
                  <Text style={[styles.momentsBadgeText, { color: '#d79d9dff' }]}>
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
                      marginLeft: 'auto',
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
          )}
        </Animated.View>
      </Modal>

      {/* ── Sharing Loading Overlay ── */}
      <Modal visible={sharing} transparent animationType="fade">
        <View style={styles.loadingOverlay}>
          <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFillObject} />
          <View style={[styles.loadingBox, { backgroundColor: isDark ? 'rgba(30, 30, 40, 0.85)' : 'rgba(255, 255, 255, 0.95)', borderColor: colors.borderGlass }]}>
            <ActivityIndicator size="large" color={colors.accentPrimary} />
            <Text style={[styles.loadingText, { color: colors.textActive, marginTop: 12 }]}>
              {locale === 'vi' ? 'Đang chuẩn bị bản đồ...' : 'Generating map image...'}
            </Text>
          </View>
        </View>
      </Modal>

      {/* ── Share Country Select Modal ── */}
      <Modal visible={shareModalVisible} transparent animationType="fade" onRequestClose={() => setShareModalVisible(false)}>
        <View style={styles.modalOverlayContainer}>
          <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={() => setShareModalVisible(false)}>
            <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFillObject} />
          </TouchableOpacity>
          
          <View style={[styles.shareCountryBox, { backgroundColor: isDark ? 'rgba(30, 30, 40, 0.95)' : 'rgba(255, 255, 255, 0.95)', borderColor: colors.borderGlass }]}>
            <View style={styles.shareCountryHeader}>
              <Text style={[styles.shareCountryTitle, { color: colors.textActive }]}>
                {locale === 'vi' ? 'Chia sẻ bản đồ theo quốc gia' : 'Share map by country'}
              </Text>
              <TouchableOpacity onPress={() => setShareModalVisible(false)} style={[styles.shareCountryClose, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }]}>
                <X size={14} color={colors.textInactive} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.shareCountryList} showsVerticalScrollIndicator={false}>
              {countries.map((country) => (
                <TouchableOpacity
                  key={country}
                  style={[
                    styles.shareCountryItem,
                    {
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
                      borderColor: colors.borderGlass,
                    }
                  ]}
                  onPress={() => executeShareMap(country)}
                >
                  <Text style={[styles.shareCountryItemText, { color: colors.textActive }]}>
                    {translateCountry(country)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
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
    flexDirection: 'column',
    gap: 12,
  },
  sheetTopRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  sheetHeaderInfo: {
    flex: 1,
    gap: 4,
  },
  sheetName: {
    fontFamily: 'System',
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 22,
    paddingRight: 24, // Leave space for close button
  },
  sheetCountryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  sheetCountry: {
    fontFamily: 'System',
    fontSize: 12,
    fontWeight: '600',
  },
  sheetDesc: {
    fontFamily: 'System',
    fontSize: 12,
    lineHeight: 16,
    marginTop: 4,
  },
  sheetThumbImageWrapper: {
    width: 64,
    height: 64,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    flexShrink: 0,
    marginTop: 2,
  },
  sheetThumbImage: {
    width: '100%',
    height: '100%',
  },
  sheetImagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  momentsStripSection: {
    marginTop: 4,
    gap: 6,
  },
  momentsStripTitle: {
    fontFamily: 'System',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  momentsStripLoading: {
    height: 56,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  emptyMomentsText: {
    fontFamily: 'System',
    fontSize: 12,
    fontStyle: 'italic',
    paddingVertical: 8,
  },
  momentsStripScroll: {
    gap: 8,
    paddingVertical: 2,
  },
  momentStripItem: {
    width: 56,
    height: 56,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1.2,
  },
  momentStripImage: {
    width: '100%',
    height: '100%',
  },
  momentStripImagePlaceholder: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  momentsBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  momentsBadgeText: {
    fontFamily: 'System',
    fontSize: 11,
    fontWeight: '700',
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
    fontFamily: 'System',
    fontSize: 12,
    fontWeight: '700',
  },
  loadingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingBox: {
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 6,
  },
  loadingText: {
    fontFamily: 'System',
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlayContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  shareCountryBox: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 18,
    elevation: 8,
  },
  shareCountryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  shareCountryTitle: {
    fontFamily: 'System',
    fontSize: 16,
    fontWeight: '700',
  },
  shareCountryClose: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareCountryList: {
    gap: 10,
    paddingVertical: 4,
  },
  shareCountryItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  shareCountryItemText: {
    fontFamily: 'System',
    fontSize: 14,
    fontWeight: '600',
  },
  shareOverlayCard: {
    position: 'absolute',
    top: 76,
    left: 20,
    width: 200,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  shareOverlayInnerBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 16,
    borderWidth: 1.2,
    pointerEvents: 'none',
  },
  shareOverlayTitle: {
    fontFamily: 'System',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 10,
    textAlign: 'center',
  },
  shareOverlayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  shareOverlayLabel: {
    fontFamily: 'System',
    fontSize: 9,
    fontWeight: '600',
  },
  shareOverlayValue: {
    fontFamily: 'System',
    fontSize: 10,
    fontWeight: '700',
  },
})
