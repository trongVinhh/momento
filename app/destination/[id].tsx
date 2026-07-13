import React from 'react'
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { ArrowLeft, MapPin, Calendar, Heart, MoreVertical } from 'lucide-react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { DESTINATIONS } from '../../constants/mockData'
import { COLORS } from '../../constants/theme'
import { globalStyles } from '../../styles/globalStyles'

export default function DestinationDetail() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const insets = useSafeAreaInsets()

  const data = id ? DESTINATIONS[id.toLowerCase()] : null

  if (!data) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Không tìm thấy địa điểm.</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={globalStyles.container}>
      {/* Parallax Header Image */}
      <View style={styles.imageContainer}>
        <Image source={{ uri: data.image }} style={styles.headerImage} />
        {/* Shadow Overlay */}
        <View style={styles.shadowOverlay} />
      </View>

      {/* Floating Header Actions */}
      <View style={[styles.headerActions, { top: insets.top + 12 }]}>
        <TouchableOpacity style={styles.roundButton} onPress={() => router.back()}>
          <ArrowLeft size={20} color={COLORS.white} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.roundButton}>
          <MoreVertical size={20} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      {/* Detail Content */}
      <ScrollView
        style={globalStyles.scrollBase}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Title Info Block */}
        <View style={styles.infoBlock}>
          <Text style={styles.nameText}>{data.name}</Text>
          <Text style={styles.descText}>{data.description}</Text>
        </View>

        {/* Timeline Moments List */}
        <View style={styles.timelineSection}>
          <Text style={styles.sectionTitle}>Moments timeline ({data.momentsList.length})</Text>

          {data.momentsList.map((moment, idx) => (
            <View key={moment.id} style={styles.timelineItem}>
              {/* Left timeline bar marker */}
              <View style={styles.timelineLeft}>
                <View style={styles.circleMarker} />
                {idx < data.momentsList.length - 1 && <View style={styles.lineMarker} />}
              </View>

              {/* Right content card */}
              <View style={styles.momentCard}>
                <Image source={{ uri: moment.image }} style={styles.momentImage} />
                <View style={styles.momentBody}>
                  <Text style={styles.momentTitle}>{moment.title}</Text>

                  {/* Metadata Row */}
                  <View style={styles.metaRow}>
                    <View style={styles.metaItem}>
                      <MapPin size={12} color={COLORS.textMuted} />
                      <Text style={styles.metaText}>{moment.location}</Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Calendar size={12} color={COLORS.textMuted} />
                      <Text style={styles.metaText}>{moment.date}</Text>
                    </View>
                    <View style={[styles.metaItem, { marginLeft: 'auto' }]}>
                      <Heart size={12} color={COLORS.accentRed} />
                      <Text style={[styles.metaText, { color: COLORS.accentRed }]}>{moment.likes}</Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  errorText: {
    color: COLORS.white,
    fontSize: 16,
  },
  backBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: COLORS.cardBackground,
    borderRadius: 8,
  },
  backBtnText: {
    color: COLORS.white,
  },
  imageContainer: {
    width: '100%',
    height: 280,
    position: 'absolute',
    top: 0,
    left: 0,
  },
  headerImage: {
    width: '100%',
    height: '100%',
  },
  shadowOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10,10,12,0.4)',
  },
  headerActions: {
    position: 'absolute',
    left: 24,
    right: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 50,
  },
  roundButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(10,10,12,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  scrollContent: {
    paddingTop: 260,
    paddingHorizontal: 20,
    gap: 24,
  },
  infoBlock: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  nameText: {
    fontFamily: 'System',
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.white,
    marginBottom: 8,
  },
  descText: {
    fontFamily: 'System',
    fontSize: 14,
    color: COLORS.textSubtle,
    lineHeight: 20,
  },
  timelineSection: {
    gap: 16,
  },
  sectionTitle: {
    fontFamily: 'System',
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
    paddingLeft: 4,
    marginBottom: 8,
  },
  timelineItem: {
    flexDirection: 'row',
  },
  timelineLeft: {
    width: 32,
    alignItems: 'center',
  },
  circleMarker: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.white,
    marginTop: 6,
    borderWidth: 2,
    borderColor: COLORS.background,
    zIndex: 10,
  },
  lineMarker: {
    position: 'absolute',
    top: 18,
    bottom: -18,
    width: 2,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  momentCard: {
    flex: 1,
    backgroundColor: COLORS.cardBackground,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    marginBottom: 20,
  },
  momentImage: {
    width: '100%',
    height: 160,
    backgroundColor: '#26262b',
  },
  momentBody: {
    padding: 16,
    gap: 12,
  },
  momentTitle: {
    fontFamily: 'System',
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.white,
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontFamily: 'System',
    fontSize: 11,
    color: COLORS.textMuted,
  },
})
