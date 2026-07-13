import React from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Animated,
} from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { BlurView } from 'expo-blur'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ChevronDown, Calendar, Plus } from 'lucide-react-native'
import { useRouter } from 'expo-router'

import { DestinationCard } from '../../components/travel/DestinationCard'
import { DESTINATIONS } from '../../constants/mockData'
import { COLORS, GLASS_STYLES } from '../../constants/theme'
import { useStaggeredEntrance } from '../../hooks/useStaggeredEntrance'
import { globalStyles } from '../../styles/globalStyles'

const DESTINATION_LIST = Object.values(DESTINATIONS)
const STAGGER_DELAYS = [150, 270, 390, 510]

export default function TripsTab() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const animValues = useStaggeredEntrance(DESTINATION_LIST.length, STAGGER_DELAYS)

  const headerHeight = insets.top + 56

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
        {DESTINATION_LIST.map((dest, i) => (
          <DestinationCard
            key={dest.name}
            name={dest.name}
            moments={dest.moments}
            image={dest.image}
            animValue={animValues[i] || new Animated.Value(1)}
            onPress={() => router.push(`/destination/${dest.name.toLowerCase()}`)}
          />
        ))}
      </ScrollView>

      {/* ── Header ── */}
      <BlurView
        intensity={Platform.OS === 'android' ? 40 : GLASS_STYLES.headerIntensity}
        tint={COLORS.tintDark}
        style={[globalStyles.headerBase, { paddingTop: insets.top + 12 }]}
      >
        {/* Region selector */}
        <TouchableOpacity style={styles.headerLeft} activeOpacity={0.7}>
          <Text style={styles.regionText}>Asia</Text>
          <ChevronDown size={18} color={COLORS.textInactive} />
        </TouchableOpacity>

        {/* Header Right Actions */}
        <View style={styles.headerRight}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.push('/create')}
            style={styles.headerBtnSpacer}
          >
            <Plus size={22} color={COLORS.textInactive} />
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={0.7}>
            <Calendar size={22} color={COLORS.textInactive} />
          </TouchableOpacity>
        </View>
      </BlurView>
    </View>
  )
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 24,
    gap: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  regionText: {
    fontFamily: 'System',
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.white,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerBtnSpacer: {
    marginRight: 16,
  },
})
