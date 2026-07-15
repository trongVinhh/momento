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

import { COLORS, GLASS_STYLES } from '../../constants/theme'
import { globalStyles } from '../../styles/globalStyles'
import { useFeed } from '../../hooks/useFeed'

export default function FeedTab() {
  const insets = useSafeAreaInsets()
  const headerHeight = insets.top + 56
  const { feed, loading, error, refetch } = useFeed()
  const [refreshing, setRefreshing] = useState(false)

  const onRefresh = async () => {
    setRefreshing(true)
    await refetch()
    setRefreshing(false)
  }

  return (
    <View style={globalStyles.container}>
      {/* ── Header ── */}
      <BlurView
        intensity={Platform.OS === 'android' ? 40 : GLASS_STYLES.headerIntensity}
        tint={COLORS.tintDark}
        style={[globalStyles.headerBase, { paddingTop: insets.top + 12 }]}
      >
        <Text style={globalStyles.headerTitle}>Moments Feed</Text>
        <TouchableOpacity style={styles.headerButton} onPress={() => refetch()}>
          <Compass size={22} color={COLORS.textInactive} />
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
            tintColor={COLORS.white}
          />
        }
      >
        {/* Loading State */}
        {loading && !refreshing && feed.length === 0 && (
          <View style={styles.centerState}>
            <ActivityIndicator size="large" color="rgba(255,255,255,0.4)" />
            <Text style={styles.stateText}>Đang tải bản tin...</Text>
          </View>
        )}

        {/* Error State */}
        {!loading && error && (
          <View style={styles.centerState}>
            <Text style={styles.stateText}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={refetch}>
              <Text style={styles.retryText}>Thử lại</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Empty State */}
        {!loading && !error && feed.length === 0 && (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconBg}>
              <FileText size={32} color={COLORS.textInactive} />
            </View>
            <Text style={styles.emptyTitle}>Bản tin trống</Text>
            <Text style={styles.emptySubtitle}>
              Chưa có khoảnh khắc nào được đăng tải. Hãy ghi lại hành trình đầu tiên của bạn!
            </Text>
          </View>
        )}

        {/* Dynamic Feed Posts */}
        {!loading && feed.map((post) => (
          <View key={post.id} style={styles.postCard}>
            {/* Post Header */}
            <View style={styles.postHeader}>
              <Image source={{ uri: post.user.avatarUrl }} style={styles.avatar} />
              <View style={{ flex: 1 }}>
                <Text style={styles.userName}>{post.user.displayName}</Text>
                <Text style={styles.locationText} numberOfLines={1}>
                  {post.location}{post.destinationName ? `, ${post.destinationName}` : ''}
                </Text>
              </View>
              <Text style={styles.timeText}>{post.date}</Text>
            </View>

            {/* Post Image */}
            <Image source={{ uri: post.imageUrl }} style={styles.postImage} />

            {/* Actions */}
            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.actionButton}>
                <Heart size={20} color={COLORS.textInactive} />
                <Text style={styles.actionCount}>{post.likes}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <MessageCircle size={20} color={COLORS.textInactive} />
                <Text style={styles.actionCount}>0</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionButton, { marginLeft: 'auto' }]}>
                <Share2 size={20} color={COLORS.textInactive} />
              </TouchableOpacity>
            </View>

            {/* Title & Caption */}
            <View style={styles.captionContainer}>
              <Text style={styles.momentTitle}>{post.title}</Text>
              {post.description ? (
                <Text style={styles.captionText}>
                  <Text style={styles.captionUser}>{post.user.displayName} </Text>
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

const styles = StyleSheet.create({
  headerButton: {
    padding: 4,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 16,
  },
  postCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
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
    backgroundColor: '#26262b',
  },
  userName: {
    fontFamily: 'System',
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
  },
  locationText: {
    fontFamily: 'System',
    fontSize: 11,
    color: COLORS.textInactive,
  },
  timeText: {
    fontFamily: 'System',
    fontSize: 11,
    color: 'rgba(255,255,255,0.3)',
  },
  postImage: {
    width: '100%',
    height: 300,
    backgroundColor: '#26262b',
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
    color: COLORS.textInactive,
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
    color: COLORS.white,
  },
  captionText: {
    fontFamily: 'System',
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 18,
  },
  captionUser: {
    fontWeight: '600',
    color: COLORS.white,
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
    color: COLORS.textInactive,
  },
  retryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginTop: 8,
  },
  retryText: {
    fontFamily: 'System',
    fontSize: 13,
    color: COLORS.white,
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
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontFamily: 'System',
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
  },
  emptySubtitle: {
    fontFamily: 'System',
    fontSize: 13,
    color: COLORS.textInactive,
    textAlign: 'center',
    lineHeight: 20,
  },
})
