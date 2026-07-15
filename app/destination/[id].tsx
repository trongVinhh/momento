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

import { globalStyles } from '../../styles/globalStyles'
import { useDestinationDetail } from '../../hooks/useDestinationDetail'
import { useTheme } from '../../hooks/useTheme'

export default function DestinationDetail() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { destination, moments, loading, error } = useDestinationDetail(id)
  const { colors, theme, isDark } = useTheme()

  // Loading State
  if (loading) {
    return (
      <View style={[globalStyles.container, styles.centerState, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.3)'} />
        <Text style={[styles.stateText, { color: colors.textInactive }]}>Đang tải...</Text>
      </View>
    )
  }

  // Error / Not Found
  if (error || !destination) {
    return (
      <View style={[globalStyles.container, styles.centerState, { backgroundColor: colors.background }]}>
        <Text style={[styles.stateText, { color: colors.textInactive }]}>{error || 'Không tìm thấy địa điểm.'}</Text>
        <TouchableOpacity 
          style={[styles.backBtn, { backgroundColor: colors.cardBackground, borderColor: colors.borderGlass }]} 
          onPress={() => router.back()}
        >
          <Text style={[styles.backBtnText, { color: colors.textActive }]}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={[globalStyles.container, { backgroundColor: colors.background }]}>
      {/* Parallax Header Image */}
      <View style={styles.imageContainer}>
        <Image source={{ uri: destination.image_url }} style={styles.headerImage} />
        <View style={styles.shadowOverlay} />
      </View>

      {/* Floating Header Actions (Always on top of cover image, kept white for contrast) */}
      <View style={[styles.headerActions, { top: insets.top + 12 }]}>
        <TouchableOpacity style={styles.glassRoundBtn} onPress={() => router.back()}>
          <ArrowLeft size={20} color="#ffffff" />
        </TouchableOpacity>
        
        <View style={styles.rightActions}>
          {/* Nút thêm moment cho destination này */}
          <TouchableOpacity
            style={[
              styles.addBtn,
              { 
                backgroundColor: colors.accentPrimaryGlass,
                shadowColor: colors.accentPrimary
              }
            ]}
            onPress={() => router.push('/create')}
          >
            <Plus size={14} color="#ffffff" />
            <Text style={styles.addBtnText}>Moment</Text>
          </TouchableOpacity>
          
          {/* Nút sửa địa điểm */}
          <TouchableOpacity
            style={styles.glassRoundBtn}
            onPress={() => router.push(`/edit-destination/${destination.id}`)}
          >
            <Settings size={18} color="#ffffff" />
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
        <View style={[styles.infoBlock, { backgroundColor: colors.cardBackground, borderColor: colors.borderGlass }]}>
          <Text style={[styles.nameText, { color: colors.textActive }]}>{destination.name}</Text>
          {destination.description ? (
            <Text style={[styles.descText, { color: colors.textSubtle }]}>{destination.description}</Text>
          ) : null}
          <Text style={[styles.momentCountText, { color: colors.textMuted }]}>
            {moments.length} khoảnh khắc được ghi lại
          </Text>
        </View>

        {/* Timeline Moments List */}
        <View style={styles.timelineSection}>
          {moments.length === 0 ? (
            <View style={styles.emptyMoments}>
              <Text style={[styles.emptyTitle, { color: colors.textActive }]}>Chưa có khoảnh khắc nào</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textInactive }]}>
                Hãy tạo moment đầu tiên cho {destination.name}!
              </Text>
              <TouchableOpacity
                style={[
                  styles.createMomentBtn,
                  { 
                    backgroundColor: colors.accentPrimaryGlass 
                  }
                ]}
                onPress={() => router.push('/create')}
              >
                <Plus size={14} color="#ffffff" />
                <Text style={styles.createMomentBtnText}>Tạo Moment</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Text style={[styles.sectionTitle, { color: colors.textActive }]}>
                Moments timeline ({moments.length})
              </Text>
              {moments.map((moment, idx) => (
                <View key={moment.id} style={styles.timelineItem}>
                  {/* Left timeline bar */}
                  <View style={styles.timelineLeft}>
                    <View style={[styles.circleMarker, { backgroundColor: colors.textActive, borderColor: colors.background }]} />
                    {idx < moments.length - 1 && <View style={[styles.lineMarker, { backgroundColor: colors.borderGlassHeavy }]} />}
                  </View>

                  {/* Right content card */}
                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={[styles.momentCard, { backgroundColor: colors.cardBackground, borderColor: colors.borderGlass }]}
                    onPress={() => router.push(`/edit-moment/${moment.id}`)}
                  >
                    <Image source={{ uri: moment.image_url }} style={styles.momentImage} />
                    <View style={styles.momentBody}>
                      <View style={styles.momentHeaderRow}>
                        <Text style={[styles.momentTitle, { color: colors.textActive }]}>{moment.title}</Text>
                        <View
                          style={[styles.momentEditBtn, { backgroundColor: theme === 'light' ? 'rgba(0,0,0,0.03)' : 'rgba(255, 255, 255, 0.05)', borderColor: colors.borderGlass }]}
                        >
                          <Edit3 size={14} color={colors.textInactive} />
                        </View>
                      </View>
                      {moment.description ? (
                        <Text style={[styles.momentDesc, { color: colors.textSubtle }]} numberOfLines={2}>
                          {moment.description}
                        </Text>
                      ) : null}

                      {/* Metadata Row */}
                      <View style={styles.metaRow}>
                        <View style={styles.metaItem}>
                          <MapPin size={12} color={colors.textMuted} />
                          <Text style={[styles.metaText, { color: colors.textMuted }]}>{moment.location}</Text>
                        </View>
                        <View style={styles.metaItem}>
                          <Calendar size={12} color={colors.textMuted} />
                          <Text style={[styles.metaText, { color: colors.textMuted }]}>{moment.date}</Text>
                        </View>
                        <View style={[styles.metaItem, { marginLeft: 'auto' }]}>
                          <Heart size={12} color={colors.accentRed} />
                          <Text style={[styles.metaText, { color: colors.accentRed }]}>
                            {moment.likes}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
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
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  backBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  backBtnText: {
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
    backgroundColor: 'rgba(0,0,0,0.3)',
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
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
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
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  addBtnText: {
    fontFamily: 'System',
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
  },
  scrollContent: {
    paddingTop: 260,
    paddingHorizontal: 20,
    gap: 24,
  },
  infoBlock: {
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    gap: 8,
  },
  nameText: {
    fontFamily: 'System',
    fontSize: 28,
    fontWeight: '800',
  },
  descText: {
    fontFamily: 'System',
    fontSize: 14,
    lineHeight: 20,
  },
  momentCountText: {
    fontFamily: 'System',
    fontSize: 12,
    marginTop: 4,
  },
  timelineSection: {
    gap: 16,
  },
  sectionTitle: {
    fontFamily: 'System',
    fontSize: 16,
    fontWeight: '600',
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
  },
  emptySubtitle: {
    fontFamily: 'System',
    fontSize: 13,
    textAlign: 'center',
  },
  createMomentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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
    color: '#ffffff',
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
    marginTop: 6,
    borderWidth: 2,
    zIndex: 10,
  },
  lineMarker: {
    position: 'absolute',
    top: 18,
    bottom: -18,
    width: 2,
  },
  momentCard: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    marginBottom: 20,
  },
  momentImage: {
    width: '100%',
    height: 160,
    backgroundColor: 'rgba(0,0,0,0.05)',
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
    lineHeight: 20,
    flex: 1,
  },
  momentEditBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  momentDesc: {
    fontFamily: 'System',
    fontSize: 13,
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
  },
})
