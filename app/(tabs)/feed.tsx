import React, { useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ActivityIndicator,
  RefreshControl,
} from 'react-native'
import { BlurView } from 'expo-blur'
import { Heart, MessageCircle, Share2, Compass, FileText } from 'lucide-react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { globalStyles } from '../../styles/globalStyles'
import { useFeed } from '../../hooks/useMoments'
import { useTheme } from '../../hooks/useTheme'
import { parseImageUrls } from '../../utils/imageParser'
import { useTranslation } from '../../context/LanguageContext'

export default function FeedTab() {
  const insets = useSafeAreaInsets()
  const headerHeight = insets.top + 56
  const { feed, loading, error, refetch } = useFeed()
  const { colors, theme } = useTheme()
  const { t, locale } = useTranslation()
  const [refreshing, setRefreshing] = useState(false)

  const onRefresh = async () => {
    setRefreshing(true)
    await refetch()
    setRefreshing(false)
  }

  return (
    <View style={[globalStyles.container, { backgroundColor: colors.background }]}>
      {/* ── Header ── */}
      <BlurView
        intensity={Platform.OS === 'android' ? 40 : 60}
        tint={colors.blurTint}
        style={[globalStyles.headerBase, { paddingTop: insets.top + 12, borderBottomColor: colors.borderGlass }]}
      >
        <Text style={[globalStyles.headerTitle, { color: colors.textActive }]}>{t('feedTitle')}</Text>
        <TouchableOpacity style={styles.headerButton} onPress={() => refetch()}>
          <Compass size={22} color={colors.textInactive} />
        </TouchableOpacity>
      </BlurView>

      {/* ── Scrollable Feed ── */}
      <ScrollView
        style={globalStyles.scrollBase}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: headerHeight + 16, paddingBottom: insets.bottom + 96 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.textActive}
          />
        }
      >
        {/* Loading State */}
        {loading && !refreshing && feed.length === 0 && (
          <View style={styles.centerState}>
            <ActivityIndicator size="large" color={theme === 'light' ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.4)'} />
            <Text style={[styles.stateText, { color: colors.textInactive }]}>{t('loadingFeed')}</Text>
          </View>
        )}

        {/* Error State */}
        {!loading && error && (
          <View style={styles.centerState}>
            <Text style={[styles.stateText, { color: colors.textInactive }]}>{error}</Text>
            <TouchableOpacity style={[styles.retryBtn, { backgroundColor: colors.cardBackground, borderColor: colors.borderGlass }]} onPress={refetch}>
              <Text style={[styles.retryText, { color: colors.textActive }]}>{locale === 'vi' ? 'Thử lại' : 'Retry'}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Empty State */}
        {!loading && !error && feed.length === 0 && (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIconBg, { backgroundColor: theme === 'light' ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.05)', borderColor: colors.borderGlass }]}>
              <FileText size={32} color={colors.textInactive} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.textActive }]}>{t('emptyFeed')}</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textInactive }]}>
              {t('emptyFeedSub')}
            </Text>
          </View>
        )}

        {/* Dynamic Feed Posts */}
        {!loading && feed.map((post) => (
          <View key={post.id} style={[styles.postCard, { backgroundColor: colors.cardBackground, borderColor: colors.borderGlass }]}>
            {/* Post Header */}
            <View style={styles.postHeader}>
              <Image source={{ uri: post.user.avatarUrl }} style={styles.avatar} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.userName, { color: colors.textActive }]}>{post.user.displayName}</Text>
                <Text style={[styles.locationText, { color: colors.textInactive }]} numberOfLines={1}>
                  {post.location}{post.destinationName ? `, ${post.destinationName}` : ''}
                </Text>
              </View>
              <Text style={[styles.timeText, { color: colors.textMuted }]}>{post.date}</Text>
            </View>

            {/* Post Image (Carousel Slide) */}
            <FeedPostImageCarousel imageUrls={parseImageUrls(post.imageUrl)} />

            {/* Actions */}
            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.actionButton}>
                <Heart size={20} color={colors.textInactive} />
                <Text style={[styles.actionCount, { color: colors.textInactive }]}>{post.likes}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <MessageCircle size={20} color={colors.textInactive} />
                <Text style={[styles.actionCount, { color: colors.textInactive }]}>0</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionButton, { marginLeft: 'auto' }]}>
                <Share2 size={20} color={colors.textInactive} />
              </TouchableOpacity>
            </View>

            {/* Title & Caption */}
            <View style={styles.captionContainer}>
              <Text style={[styles.momentTitle, { color: colors.textActive }]}>{post.title}</Text>
              {post.description ? (
                <Text style={[styles.captionText, { color: colors.textSubtle }]}>
                  <Text style={[styles.captionUser, { color: colors.textActive }]}>{post.user.displayName} </Text>
                  {post.description}
                </Text>
              ) : null}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  )
}

function FeedPostImageCarousel({ imageUrls }: { imageUrls: string[] }) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [carouselWidth, setCarouselWidth] = useState(300)

  const handleScroll = (event: any) => {
    const scrollPosition = event.nativeEvent.contentOffset.x
    const index = Math.round(scrollPosition / carouselWidth)
    setActiveIndex(index)
  }

  if (imageUrls.length === 0) return null

  return (
    <View 
      style={[styles.postCarouselContainer, { width: '100%' }]}
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
        style={styles.postImageScroll}
      >
        {imageUrls.map((img: string, idx: number) => (
          <Image key={idx} source={{ uri: img }} style={{ width: carouselWidth, height: 300, resizeMode: 'cover' }} />
        ))}
      </ScrollView>

      {/* Dots Indicator */}
      {imageUrls.length > 1 && (
        <View style={styles.indicatorContainer}>
          {imageUrls.map((_, idx) => (
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
  )
}

const styles = StyleSheet.create({
  headerButton: {
    padding: 4,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 16,
  },
  postCard: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 10,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  userName: {
    fontFamily: 'System',
    fontSize: 14,
    fontWeight: '600',
  },
  locationText: {
    fontFamily: 'System',
    fontSize: 11,
  },
  timeText: {
    fontFamily: 'System',
    fontSize: 11,
  },
  postCarouselContainer: {
    height: 300,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  postImageScroll: {
    flex: 1,
  },
  indicatorContainer: {
    position: 'absolute',
    bottom: 12,
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
  actionRow: {
    flexDirection: 'row',
    padding: 12,
    gap: 16,
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionCount: {
    fontFamily: 'System',
    fontSize: 12,
  },
  captionContainer: {
    paddingHorizontal: 12,
    paddingBottom: 16,
    gap: 4,
  },
  momentTitle: {
    fontFamily: 'System',
    fontSize: 15,
    fontWeight: '700',
  },
  captionText: {
    fontFamily: 'System',
    fontSize: 13,
    lineHeight: 18,
  },
  captionUser: {
    fontWeight: '600',
  },
  centerState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
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
    marginTop: 8,
  },
  retryText: {
    fontFamily: 'System',
    fontSize: 13,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 32,
    gap: 12,
  },
  emptyIconBg: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontFamily: 'System',
    fontSize: 16,
    fontWeight: '700',
  },
  emptySubtitle: {
    fontFamily: 'System',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },
})
