import React from 'react'
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ActivityIndicator,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { ArrowLeft, MapPin, Calendar, Heart, Plus, Settings, Edit3 } from 'lucide-react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { COLORS } from '../../constants/theme'
import { globalStyles } from '../../styles/globalStyles'
import { useDestinationDetail } from '../../hooks/useDestinationDetail'

export default function DestinationDetail() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { destination, moments, loading, error } = useDestinationDetail(id)

  // Loading State
  if (loading) {
    return (
      <View style={[globalStyles.container, styles.centerState]}>
        <ActivityIndicator size="large" color="rgba(255,255,255,0.5)" />
        <Text style={styles.stateText}>Đang tải...</Text>
      </View>
    )
  }

  // Error / Not Found
  if (error || !destination) {
    return (
      <View style={[globalStyles.container, styles.centerState]}>
        <Text style={styles.stateText}>{error || 'Không tìm thấy địa điểm.'}</Text>
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
        <Image source={{ uri: destination.image_url }} style={styles.headerImage} />
        <View style={styles.shadowOverlay} />
      </View>

      {/* Floating Header Actions */}
      <View style={[styles.headerActions, { top: insets.top + 12 }]}>
        <TouchableOpacity style={styles.glassRoundBtn} onPress={() => router.back()}>
          <ArrowLeft size={20} color={COLORS.white} />
        </TouchableOpacity>
        
        <View style={styles.rightActions}>
          {/* Nút thêm moment cho destination này */}
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => router.push('/create')}
          >
            <Plus size={14} color={COLORS.white} />
            <Text style={styles.addBtnText}>Moment</Text>
          </TouchableOpacity>
          
          {/* Nút sửa địa điểm */}
          <TouchableOpacity
            style={styles.glassRoundBtn}
            onPress={() => router.push(`/edit-destination/${destination.id}`)}
          >
            <Settings size={18} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Detail Content */}
      <ScrollView
        style={globalStyles.scrollBase}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Info Block */}
        <View style={styles.infoBlock}>
          <Text style={styles.nameText}>{destination.name}</Text>
          {destination.description ? (
            <Text style={styles.descText}>{destination.description}</Text>
          ) : null}
          <Text style={styles.momentCountText}>
            {moments.length} khoảnh khắc được ghi lại
          </Text>
        </View>

        {/* Timeline Moments List */}
        <View style={styles.timelineSection}>
          {moments.length === 0 ? (
            <View style={styles.emptyMoments}>
              <Text style={styles.emptyTitle}>Chưa có khoảnh khắc nào</Text>
              <Text style={styles.emptySubtitle}>
                Hãy tạo moment đầu tiên cho {destination.name}!
              </Text>
              <TouchableOpacity
                style={styles.createMomentBtn}
                onPress={() => router.push('/create')}
              >
                <Plus size={14} color={COLORS.white} />
                <Text style={styles.createMomentBtnText}>Tạo Moment</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Text style={styles.sectionTitle}>
                Moments timeline ({moments.length})
              </Text>
              {moments.map((moment, idx) => (
                <View key={moment.id} style={styles.timelineItem}>
                  {/* Left timeline bar */}
                  <View style={styles.timelineLeft}>
                    <View style={styles.circleMarker} />
                    {idx < moments.length - 1 && <View style={styles.lineMarker} />}
                  </View>

                  {/* Right content card */}
                  <View style={styles.momentCard}>
                    <Image source={{ uri: moment.image_url }} style={styles.momentImage} />
                    <View style={styles.momentBody}>
                      <View style={styles.momentHeaderRow}>
                        <Text style={styles.momentTitle}>{moment.title}</Text>
                        <TouchableOpacity
                          style={styles.momentEditBtn}
                          onPress={() => router.push(`/edit-moment/${moment.id}`)}
                        >
                          <Edit3 size={14} color={COLORS.textInactive} />
                        </TouchableOpacity>
                      </View>
                      {moment.description ? (
                        <Text style={styles.momentDesc} numberOfLines={2}>
                          {moment.description}
                        </Text>
                      ) : null}

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
                          <Text style={[styles.metaText, { color: COLORS.accentRed }]}>
                            {moment.likes}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                </View>
              ))}
            </>
          )}
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  centerState: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  stateText: {
    fontFamily: 'System',
    color: COLORS.textInactive,
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  backBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  backBtnText: {
    color: COLORS.white,
    fontSize: 14,
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
    alignItems: 'center',
    zIndex: 50,
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
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(59, 130, 246, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  addBtnText: {
    fontFamily: 'System',
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.white,
  },
  scrollContent: {
    paddingTop: 260,
    paddingHorizontal: 20,
    gap: 24,
  },
  infoBlock: {
    backgroundColor: 'rgba(22,22,26,0.95)',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    gap: 8,
  },
  nameText: {
    fontFamily: 'System',
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.white,
  },
  descText: {
    fontFamily: 'System',
    fontSize: 14,
    color: COLORS.textSubtle,
    lineHeight: 20,
  },
  momentCountText: {
    fontFamily: 'System',
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 4,
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
  emptyMoments: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 8,
  },
  emptyTitle: {
    fontFamily: 'System',
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  emptySubtitle: {
    fontFamily: 'System',
    fontSize: 13,
    color: COLORS.textInactive,
    textAlign: 'center',
  },
  createMomentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(59, 130, 246, 0.75)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  createMomentBtnText: {
    fontFamily: 'System',
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.white,
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
    backgroundColor: 'rgba(22,22,26,0.95)',
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
    gap: 8,
  },
  momentHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  momentTitle: {
    fontFamily: 'System',
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.white,
    lineHeight: 20,
    flex: 1,
  },
  momentEditBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  momentDesc: {
    fontFamily: 'System',
    fontSize: 13,
    color: COLORS.textSubtle,
    lineHeight: 18,
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
