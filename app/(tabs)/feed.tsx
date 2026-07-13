import React from 'react'
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native'
import { BlurView } from 'expo-blur'
import { Heart, MessageCircle, Share2, Compass } from 'lucide-react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { FEED_POSTS } from '../../constants/mockData'
import { COLORS, GLASS_STYLES } from '../../constants/theme'
import { globalStyles } from '../../styles/globalStyles'

export default function FeedTab() {
  const insets = useSafeAreaInsets()
  const headerHeight = insets.top + 56

  return (
    <View style={globalStyles.container}>
      {/* ── Header ── */}
      <BlurView
        intensity={Platform.OS === 'android' ? 40 : GLASS_STYLES.headerIntensity}
        tint={COLORS.tintDark}
        style={[globalStyles.headerBase, { paddingTop: insets.top + 12 }]}
      >
        <Text style={globalStyles.headerTitle}>Moments Feed</Text>
        <TouchableOpacity style={styles.headerButton}>
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
      >
        {FEED_POSTS.map((post) => (
          <View key={post.id} style={styles.postCard}>
            {/* Post Header */}
            <View style={styles.postHeader}>
              <Image source={{ uri: post.avatar }} style={styles.avatar} />
              <View>
                <Text style={styles.userName}>{post.user}</Text>
                <Text style={styles.locationText}>{post.location}</Text>
              </View>
              <Text style={styles.timeText}>{post.time}</Text>
            </View>

            {/* Post Image */}
            <Image source={{ uri: post.image }} style={styles.postImage} />

            {/* Actions */}
            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.actionButton}>
                <Heart size={20} color={COLORS.textInactive} />
                <Text style={styles.actionCount}>{post.likes}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <MessageCircle size={20} color={COLORS.textInactive} />
                <Text style={styles.actionCount}>{post.comments}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionButton, { marginLeft: 'auto' }]}>
                <Share2 size={20} color={COLORS.textInactive} />
              </TouchableOpacity>
            </View>

            {/* Caption */}
            <Text style={styles.captionText}>
              <Text style={styles.captionUser}>{post.user} </Text>
              {post.caption}
            </Text>
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
    borderRadius: 99,
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
    marginLeft: 'auto',
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
  captionText: {
    fontFamily: 'System',
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    paddingHorizontal: 12,
    paddingBottom: 16,
    lineHeight: 18,
  },
  captionUser: {
    fontWeight: '600',
    color: COLORS.white,
  },
})
