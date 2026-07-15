import React, { useMemo } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Platform,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native'
import MapView, { Marker, Callout } from 'react-native-maps'
import { BlurView } from 'expo-blur'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Compass, Pin } from 'lucide-react-native'
import Svg, { Path } from 'react-native-svg'

import { useDestinations } from '../../hooks/useDestinations'
import { useTheme } from '../../hooks/useTheme'
import { globalStyles } from '../../styles/globalStyles'
import { useTranslation } from '../../context/LanguageContext'

// Giao diện bản đồ tối (Dark Mode Map Style JSON)
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
  { "featureType": "water", "elementType": "labels.text.fill", "stylers": [{ "color": "#383742" }] }
]

export default function MapTab() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { destinations, loading, error, refetch } = useDestinations()
  const { colors, theme, isDark } = useTheme()
  const { t, locale } = useTranslation()

  // 1. Chỉ lấy những địa điểm có tọa độ hợp lệ
  const validDestinations = useMemo(() => {
    return destinations.filter(d => typeof d.latitude === 'number' && typeof d.longitude === 'number')
  }, [destinations])

  // Tọa độ vùng trung tâm hiển thị ban đầu (Hà Nội làm tâm)
  const initialRegion = {
    latitude: 21.028511,
    longitude: 105.804817,
    latitudeDelta: 7.5,
    longitudeDelta: 7.5,
  }

  return (
    <View style={[globalStyles.container, { backgroundColor: colors.background }]}>
      {/* ── Header ── */}
      <BlurView
        intensity={Platform.OS === 'android' ? 40 : 60}
        tint={colors.blurTint}
        style={[globalStyles.headerBase, { paddingTop: insets.top + 12, zIndex: 10, borderBottomColor: colors.borderGlass }]}
      >
        <Text style={[globalStyles.headerTitle, { color: colors.textActive }]}>{t('mapTitle')}</Text>
        <TouchableOpacity style={styles.headerButton} onPress={refetch}>
          <Compass size={22} color={colors.textInactive} />
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
          // Áp dụng Map Style tối chỉ khi ở Dark Mode
          customMapStyle={isDark ? DARK_MAP_STYLE : undefined}
          provider={Platform.OS === 'android' ? 'google' : undefined}
          showsUserLocation={false}
          showsCompass={false}
          showsMyLocationButton={false}
        >
          {validDestinations.map((dest) => (
            <Marker
              key={dest.id}
              coordinate={{ latitude: dest.latitude!, longitude: dest.longitude! }}
              tracksViewChanges={false}
            >
              {/* Ghim đỏ custom SVG theo phong cách turkkub */}
              <View style={styles.markerContainer}>
                <Svg width={32} height={32} viewBox="0 0 24 24" fill="none">
                  {/* Bóng đổ tròn mờ bên dưới ghim */}
                  <Path
                    d="M12 21a2 2 0 100-4 2 2 0 000 4z"
                    fill="rgba(0, 0, 0, 0.25)"
                  />
                  {/* Thân ghim màu đỏ với thiết kế đục lỗ tròn ở giữa */}
                  <Path
                    d="M12 2C8.14 2 5 5.14 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.86-3.14-7-7-7zm0 10c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z"
                    fill="#ef4444"
                  />
                </Svg>
              </View>

              {/* Callout kính mờ hiển thị thông tin địa điểm */}
              <Callout
                tooltip
                onPress={() => router.push(`/destination/${dest.id}`)}
              >
                <BlurView 
                  intensity={25} 
                  tint={colors.blurTint} 
                  style={[
                    styles.calloutWrapper, 
                    { 
                      backgroundColor: isDark ? 'rgba(20, 20, 25, 0.85)' : 'rgba(255, 255, 255, 0.9)',
                      borderColor: colors.borderGlass 
                    }
                  ]}
                >
                  <View style={[styles.calloutInnerBorder, { borderColor: colors.borderGlass }]} />
                  <Image source={{ uri: dest.image_url }} style={styles.calloutImage} />
                  
                  <View style={styles.calloutContent}>
                    <Text style={[styles.calloutTitle, { color: colors.textActive }]}>{dest.name}</Text>
                    <Text style={[styles.calloutCountry, { color: colors.textMuted }]}>{dest.country || 'Việt Nam'}</Text>
                    
                    <View style={styles.calloutStats}>
                      <Pin size={11} color="#ef4444" />
                      <Text style={[styles.calloutMomentsText, { color: colors.textSubtle }]}>
                        {dest.moments_count ?? 0} {locale === 'vi' ? 'khoảnh khắc' : 'moments'}
                      </Text>
                    </View>
                  </View>
                </BlurView>
              </Callout>
            </Marker>
          ))}
        </MapView>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  headerButton: {
    padding: 4,
  },
  centerState: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  stateText: {
    fontFamily: 'System',
    fontSize: 14,
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
  markerContainer: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calloutWrapper: {
    width: 190,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
  },
  calloutInnerBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 16,
    borderWidth: 1,
    pointerEvents: 'none',
  },
  calloutImage: {
    width: '100%',
    height: 90,
    backgroundColor: '#1d1c24',
  },
  calloutContent: {
    padding: 10,
    gap: 3,
  },
  calloutTitle: {
    fontFamily: 'System',
    fontSize: 13,
    fontWeight: '700',
  },
  calloutCountry: {
    fontFamily: 'System',
    fontSize: 10,
  },
  calloutStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 4,
  },
  calloutMomentsText: {
    fontFamily: 'System',
    fontSize: 10,
    fontWeight: '500',
  },
})
