import React, { useState } from 'react'
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { BlurView } from 'expo-blur'
import { ArrowLeft, MapPin, Calendar, Compass, Edit3, Trash2, Camera } from 'lucide-react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { globalStyles } from '../../styles/globalStyles'
import { useTheme } from '../../hooks/useTheme'
import { useMomentDetail } from '../../hooks/useMomentDetail'
import { parseImageUrls } from '../../utils/imageParser'
import { GLASS_STYLES } from '../../constants/theme'
import { supabase } from '../../lib/supabase'
import { useTranslation } from '../../context/LanguageContext'

export default function MomentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { colors, theme, isDark } = useTheme()
  const { moment, loading, refetch } = useMomentDetail(id)
  const { t, locale } = useTranslation()

  const [activeIndex, setActiveIndex] = useState(0)
  const [carouselWidth, setCarouselWidth] = useState(300)

  const handleScroll = (event: any) => {
    const scrollPosition = event.nativeEvent.contentOffset.x
    const index = Math.round(scrollPosition / carouselWidth)
    setActiveIndex(index)
  }

  const handleDelete = () => {
    if (!id) return
    Alert.alert(
      t('deleteMomentBtn'),
      t('confirmDelete'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('moments')
                .delete()
                .eq('id', id)
              if (error) throw error
              router.back()
            } catch (err: any) {
              Alert.alert(t('error'), err.message || 'Error deleting moment.')
            }
          },
        },
      ]
    )
  }

  if (loading) {
    return (
      <View style={[globalStyles.container, styles.centerState, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.3)'} />
        <Text style={[styles.stateText, { color: colors.textInactive }]}>{t('loadingMomentDetail')}</Text>
      </View>
    )
  }

  if (!moment) {
    return (
      <View style={[globalStyles.container, styles.centerState, { backgroundColor: colors.background }]}>
        <Text style={[styles.stateText, { color: colors.textInactive }]}>{t('momentNotFound')}</Text>
        <TouchableOpacity style={[styles.backBtn, { borderColor: colors.borderGlass }]} onPress={() => router.back()}>
          <Text style={{ color: colors.textActive }}>{t('back')}</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const images = parseImageUrls(moment.image_url)

  return (
    <View style={[globalStyles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} translucent />

      {/* Header */}
      <BlurView
        intensity={Platform.OS === 'android' ? 40 : GLASS_STYLES.headerIntensity}
        tint={colors.blurTint}
        style={[globalStyles.headerBase, { paddingTop: insets.top + 12, borderBottomColor: colors.borderGlass, borderBottomWidth: 1 }]}
      >
        <TouchableOpacity style={[styles.glassRoundBtn, { backgroundColor: theme === 'light' ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.05)', borderColor: colors.borderGlass }]} onPress={() => router.back()}>
          <ArrowLeft size={20} color={colors.textActive} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textActive }]}>{t('momentDetailTitle')}</Text>
        <View style={styles.headerRightActions}>
          <TouchableOpacity 
            style={[styles.glassRoundBtn, { backgroundColor: theme === 'light' ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.05)', borderColor: colors.borderGlass }]} 
            onPress={() => router.push(`/edit-moment/${moment.id}`)}
          >
            <Edit3 size={18} color={colors.textActive} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.glassRoundBtn, styles.deleteBtn, { backgroundColor: theme === 'light' ? 'rgba(239, 68, 68, 0.08)' : 'rgba(239, 68, 68, 0.15)' }]} 
            onPress={handleDelete}
          >
            <Trash2 size={18} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </BlurView>

      <ScrollView
        style={globalStyles.scrollBase}
        contentContainerStyle={{ paddingTop: insets.top + 76, paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Carousel Image Slider */}
        {images.length > 0 ? (
          <View 
            style={styles.carouselContainer}
            onLayout={(e) => {
              const { width } = e.nativeEvent.layout
              if (width > 0) setCarouselWidth(width)
            }}
          >
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={handleScroll}
              scrollEventThrottle={16}
              style={styles.imageScroll}
            >
              {images.map((img: string, idx: number) => (
                <Image key={idx} source={{ uri: img }} style={{ width: carouselWidth, height: 320, resizeMode: 'cover' }} />
              ))}
            </ScrollView>

            {/* Dots Indicator */}
            {images.length > 1 && (
              <View style={styles.indicatorContainer}>
                {images.map((_, idx) => (
                  <View
                    key={idx}
                    style={[
                      styles.indicatorDot,
                      activeIndex === idx
                        ? { backgroundColor: '#ffffff', width: 14 }
                        : { backgroundColor: 'rgba(255, 255, 255, 0.4)' },
                    ]}
                  />
                ))}
              </View>
            )}
          </View>
        ) : (
          <View style={[styles.imagePlaceholder, { backgroundColor: theme === 'light' ? 'rgba(0,0,0,0.02)' : 'rgba(255, 255, 255, 0.03)', borderColor: colors.borderGlass }]}>
            <Camera size={48} color={colors.textInactive} />
            <Text style={{ color: colors.textInactive, marginTop: 12 }}>
              {locale === 'vi' ? 'Không có hình ảnh' : 'No images available'}
            </Text>
          </View>
        )}

        {/* Content detail */}
        <View style={styles.content}>
          <Text style={[styles.titleText, { color: colors.textActive }]}>{moment.title}</Text>

          {/* Badges metadata info */}
          <View style={styles.metaContainer}>
            <View style={[styles.metaBadge, { backgroundColor: theme === 'light' ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.04)', borderColor: colors.borderGlass }]}>
              <MapPin size={14} color={colors.accentPrimary} />
              <Text style={[styles.metaBadgeText, { color: colors.textActive }]}>{moment.location}</Text>
            </View>

            <View style={[styles.metaBadge, { backgroundColor: theme === 'light' ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.04)', borderColor: colors.borderGlass }]}>
              <Calendar size={14} color={colors.textInactive} />
              <Text style={[styles.metaBadgeText, { color: colors.textActive }]}>{moment.date}</Text>
            </View>

            {moment.destination?.name ? (
              <View style={[styles.metaBadge, { backgroundColor: theme === 'light' ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.04)', borderColor: colors.borderGlass }]}>
                <Compass size={14} color={colors.textInactive} />
                <Text style={[styles.metaBadgeText, { color: colors.textActive }]}>
                  {moment.destination.name}
                </Text>
              </View>
            ) : null}
          </View>

          {/* Description / Story */}
          {moment.description ? (
            <View style={[styles.descriptionBox, { backgroundColor: theme === 'light' ? 'rgba(0,0,0,0.01)' : 'rgba(255,255,255,0.02)', borderColor: colors.borderGlass }]}>
              <Text style={[styles.descriptionTitle, { color: colors.textActive }]}>{t('momentStoryTitle')}</Text>
              <Text style={[styles.descriptionText, { color: colors.textSubtle }]}>
                {moment.description}
              </Text>
            </View>
          ) : null}
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
  },
  backBtn: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 12,
  },
  glassRoundBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtn: {
    borderColor: 'rgba(239, 68, 68, 0.25)',
  },
  headerTitle: {
    fontFamily: 'System',
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  carouselContainer: {
    height: 320,
    overflow: 'hidden',
    position: 'relative',
  },
  imageScroll: {
    flex: 1,
  },
  indicatorContainer: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  indicatorDot: {
    height: 6,
    borderRadius: 3,
    width: 6,
  },
  imagePlaceholder: {
    height: 320,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    marginHorizontal: 16,
    borderRadius: 16,
  },
  content: {
    padding: 20,
    gap: 20,
  },
  titleText: {
    fontFamily: 'System',
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 28,
  },
  metaContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  metaBadgeText: {
    fontFamily: 'System',
    fontSize: 12,
    fontWeight: '500',
  },
  descriptionBox: {
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  descriptionTitle: {
    fontFamily: 'System',
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  descriptionText: {
    fontFamily: 'System',
    fontSize: 14,
    lineHeight: 22,
  },
})
