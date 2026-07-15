import React from 'react'
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Dimensions,
  ActivityIndicator,
  Switch,
  Alert,
} from 'react-native'
import { BlurView } from 'expo-blur'
import { LogOut, Image as ImageIcon, Moon, Sun } from 'lucide-react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { supabase } from '../../lib/supabase'
import { globalStyles } from '../../styles/globalStyles'
import { useProfile } from '../../hooks/useProfile'
import { useTheme } from '../../hooks/useTheme'
import { useTranslation } from '../../context/LanguageContext'

export default function AccountTab() {
  const insets = useSafeAreaInsets()
  const headerHeight = insets.top + 56
  const { profile, loading, error, refetch } = useProfile()
  const { theme, colors, toggleTheme, isDark } = useTheme()
  const { t, locale, setLocale } = useTranslation()

  const handleLogout = () => {
    Alert.alert(
      t('logoutBtn'),
      t('logoutConfirm'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('logoutBtn'),
          style: 'destructive',
          onPress: async () => {
            await supabase.auth.signOut()
          },
        },
      ]
    )
  }

  return (
    <View style={[globalStyles.container, { backgroundColor: colors.background }]}>
      {/* ── Header ── */}
      <BlurView
        intensity={Platform.OS === 'android' ? 40 : 60}
        tint={colors.blurTint}
        style={[globalStyles.headerBase, { paddingTop: insets.top + 12, borderBottomColor: colors.borderGlass }]}
      >
        <Text style={[globalStyles.headerTitle, { color: colors.textActive }]}>{t('profileTitle')}</Text>
        
        <View style={styles.headerRightGroup}>
          {/* Custom Theme Toggle Pill */}
          <TouchableOpacity 
            style={[styles.themeTogglePill, { backgroundColor: isDark ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.05)', borderColor: colors.borderGlass }]} 
            activeOpacity={0.8}
            onPress={toggleTheme}
          >
            <View style={[
              styles.themeToggleIndicator, 
              { 
                left: isDark ? 32 : 4,
                backgroundColor: isDark ? 'rgba(239, 68, 68, 0.25)' : 'rgba(245, 158, 11, 0.15)'
              }
            ]} />
            <Sun size={12} color={!isDark ? '#f59e0b' : colors.textInactive} style={styles.toggleIcon} />
            <Moon size={12} color={isDark ? '#ef4444' : colors.textInactive} style={styles.toggleIcon} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.headerButton} onPress={handleLogout}>
            <LogOut size={20} color={colors.textInactive} />
          </TouchableOpacity>
        </View>
      </BlurView>

      <ScrollView
        style={globalStyles.scrollBase}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: headerHeight + 16, paddingBottom: insets.bottom + 96 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Loading */}
        {loading && !profile && (
          <View style={styles.centerState}>
            <ActivityIndicator size="large" color={isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.3)'} />
            <Text style={[styles.stateText, { color: colors.textInactive }]}>{t('loading')}</Text>
          </View>
        )}

        {/* Error */}
        {!loading && error && (
          <View style={styles.centerState}>
            <Text style={[styles.stateText, { color: colors.textInactive }]}>{error}</Text>
            <TouchableOpacity style={[styles.retryBtn, { backgroundColor: colors.cardBackground, borderColor: colors.borderGlass }]} onPress={refetch}>
              <Text style={[styles.retryText, { color: colors.textActive }]}>{locale === 'vi' ? 'Thử lại' : 'Retry'}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Main Content */}
        {!loading && profile && (
          <>
            {/* Profile Card */}
            <View style={[styles.profileCard, { backgroundColor: colors.cardBackground, borderColor: colors.borderGlass }]}>
              <Image
                source={{ uri: profile.avatarUrl }}
                style={[styles.avatar, { borderColor: colors.borderGlassHeavy }]}
              />
              <Text style={[styles.nameText, { color: colors.textActive }]}>{profile.displayName}</Text>
              <Text style={[styles.emailText, { color: colors.textMuted }]}>{profile.email}</Text>
              <Text style={[styles.bioText, { color: colors.textSubtle }]}>
                {locale === 'vi' 
                  ? 'Ghi lại hành trình khám phá thế giới ✈️ | Yêu những khung cảnh hoang sơ và ẩm thực châu Á.'
                  : 'Capturing the world ✈️ | Lover of wild landscapes and Asian cuisine.'}
              </Text>

              {/* Stats Bar */}
              <View style={[styles.statsBar, { borderTopColor: colors.borderGlass }]}>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: colors.textActive }]}>{profile.destinationsCount}</Text>
                  <Text style={[styles.statLabel, { color: colors.textInactive }]}>{t('destinationsCount')}</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: colors.textActive }]}>{profile.momentsCount}</Text>
                  <Text style={[styles.statLabel, { color: colors.textInactive }]}>{t('momentsCount')}</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: colors.textActive }]}>1</Text>
                  <Text style={[styles.statLabel, { color: colors.textInactive }]}>{locale === 'vi' ? 'Người theo dõi' : 'Followers'}</Text>
                </View>
              </View>
            </View>

            {/* Settings Card */}
            <View style={[styles.profileCard, { backgroundColor: colors.cardBackground, borderColor: colors.borderGlass, gap: 16, alignItems: 'stretch' }]}>
              <Text style={[styles.settingsTitle, { color: colors.textActive }]}>
                {t('settingsSection')}
              </Text>
              
              {/* Language Selector Row */}
              <View style={styles.settingsRow}>
                <Text style={[styles.settingsLabel, { color: colors.textActive }]}>{t('languageLabel')}</Text>
                <View style={[styles.langSelector, { backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.05)', borderColor: colors.borderGlass }]}>
                  <TouchableOpacity
                    style={[
                      styles.langBtn,
                      locale === 'vi' && [styles.langBtnActive, { backgroundColor: colors.accentPrimary }]
                    ]}
                    onPress={() => setLocale('vi')}
                  >
                    <Text style={[styles.langText, locale === 'vi' ? { color: '#ffffff', fontWeight: '700' } : { color: colors.textInactive }]}>Tiếng Việt</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.langBtn,
                      locale === 'en' && [styles.langBtnActive, { backgroundColor: colors.accentPrimary }]
                    ]}
                    onPress={() => setLocale('en')}
                  >
                    <Text style={[styles.langText, locale === 'en' ? { color: '#ffffff', fontWeight: '700' } : { color: colors.textInactive }]}>English</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* My Moments Gallery Grid */}
            <View style={styles.galleryContainer}>
              <Text style={[styles.sectionTitle, { color: colors.textActive }]}>{t('momentsCount')} ({profile.momentsImages.length})</Text>
              
              {profile.momentsImages.length === 0 ? (
                <View style={[styles.emptyGallery, { backgroundColor: colors.cardBackground, borderColor: colors.borderGlass }]}>
                  <View style={[styles.emptyIconBg, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', borderColor: colors.borderGlass }]}>
                    <ImageIcon size={24} color={colors.textInactive} />
                  </View>
                  <Text style={[styles.emptyText, { color: colors.textInactive }]}>
                    {locale === 'vi' ? 'Chưa có khoảnh khắc nào được lưu lại.' : 'No moments captured yet.'}
                  </Text>
                </View>
              ) : (
                <View style={styles.grid}>
                  {profile.momentsImages.map((img, i) => (
                    <TouchableOpacity key={i} style={[styles.gridItem, { backgroundColor: colors.cardBackground, borderColor: colors.borderGlass }]} activeOpacity={0.8}>
                      <Image source={{ uri: img }} style={styles.gridImage} />
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  )
}

const { width } = Dimensions.get('window')
const gridItemWidth = (width - 48) / 2

const styles = StyleSheet.create({
  headerButton: {
    padding: 4,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 16,
  },
  profileCard: {
    alignItems: 'center',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
  },
  settingsTitle: {
    fontFamily: 'System',
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  settingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  settingsLabel: {
    fontFamily: 'System',
    fontSize: 14,
    fontWeight: '600',
  },
  langSelector: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1,
    padding: 3,
    gap: 4,
  },
  langBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  langBtnActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  langText: {
    fontFamily: 'System',
    fontSize: 12,
    fontWeight: '600',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    marginBottom: 12,
  },
  nameText: {
    fontFamily: 'System',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
  },
  emailText: {
    fontFamily: 'System',
    fontSize: 12,
    marginBottom: 12,
  },
  bioText: {
    fontFamily: 'System',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 12,
    marginBottom: 20,
  },
  statsBar: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    paddingTop: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontFamily: 'System',
    fontSize: 16,
    fontWeight: '700',
  },
  statLabel: {
    fontFamily: 'System',
    fontSize: 10,
    marginTop: 2,
  },
  headerRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  themeTogglePill: {
    width: 60,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  themeToggleIndicator: {
    position: 'absolute',
    top: 1,
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  toggleIcon: {
    zIndex: 2,
  },
  galleryContainer: {
    gap: 12,
  },
  sectionTitle: {
    fontFamily: 'System',
    fontSize: 16,
    fontWeight: '600',
    paddingLeft: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  gridItem: {
    width: gridItemWidth,
    height: gridItemWidth,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  centerState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
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
  emptyGallery: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 12,
    borderWidth: 1,
  },
  emptyIconBg: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontFamily: 'System',
    fontSize: 13,
    textAlign: 'center',
  },
})
