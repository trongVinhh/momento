import React, { useState } from 'react'
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
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
} from 'react-native'
import { BlurView } from 'expo-blur'
import {
  LogOut,
  Image as ImageIcon,
  Moon,
  Sun,
  Edit3,
  Camera,
  Compass,
  Map,
  Globe,
  Award,
  Lock,
  X,
  Check,
  User,
} from 'lucide-react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { supabase } from '../../lib/supabase'
import { globalStyles } from '../../styles/globalStyles'
import { useProfile } from '../../hooks/useProfile'
import { useTheme } from '../../hooks/useTheme'
import { useTranslation } from '../../context/LanguageContext'

// ── Badge definitions ──────────────────────────────────────────────────────────
interface BadgeDef {
  key: string
  nameKey: string
  descKey: string
  icon: React.ReactNode
  threshold: number
  type: 'destination' | 'country'
  color: string
  gradient: [string, string]
}

const DEST_BADGES: BadgeDef[] = [
  {
    key: 'explorer1', nameKey: 'badge_explorer1_name', descKey: 'badge_explorer1_desc',
    icon: null, threshold: 5, type: 'destination', color: '#34d399', gradient: ['#064e3b', '#059669'],
  },
  {
    key: 'explorer2', nameKey: 'badge_explorer2_name', descKey: 'badge_explorer2_desc',
    icon: null, threshold: 10, type: 'destination', color: '#60a5fa', gradient: ['#1e3a5f', '#2563eb'],
  },
  {
    key: 'voyager', nameKey: 'badge_voyager_name', descKey: 'badge_voyager_desc',
    icon: null, threshold: 15, type: 'destination', color: '#fbbf24', gradient: ['#451a03', '#d97706'],
  },
]

const COUNTRY_BADGES: BadgeDef[] = [
  {
    key: 'novice', nameKey: 'badge_novice_name', descKey: 'badge_novice_desc',
    icon: null, threshold: 1, type: 'country', color: '#a78bfa', gradient: ['#2e1065', '#7c3aed'],
  },
  {
    key: 'inter', nameKey: 'badge_inter_name', descKey: 'badge_inter_desc',
    icon: null, threshold: 2, type: 'country', color: '#f472b6', gradient: ['#500724', '#db2777'],
  },
  {
    key: 'border', nameKey: 'badge_border_name', descKey: 'badge_border_desc',
    icon: null, threshold: 3, type: 'country', color: '#fb923c', gradient: ['#431407', '#ea580c'],
  },
  {
    key: 'global', nameKey: 'badge_global_name', descKey: 'badge_global_desc',
    icon: null, threshold: 5, type: 'country', color: '#e879f9', gradient: ['#2d0036', '#a21caf'],
  },
]

const BADGE_ICON_SIZE = 24

function getBadgeIcon(key: string, unlocked: boolean, color: string) {
  const iconColor = unlocked ? color : 'rgba(255,255,255,0.2)'
  const props = { size: BADGE_ICON_SIZE, color: iconColor }
  if (key === 'explorer1') return <Compass {...props} />
  if (key === 'explorer2') return <Map {...props} />
  if (key === 'voyager') return <Award {...props} />
  if (key === 'novice') return <Globe {...props} />
  if (key === 'inter') return <Globe {...props} />
  if (key === 'border') return <Globe {...props} />
  if (key === 'global') return <Globe {...props} />
  return <Award {...props} />
}

// ─────────────────────────────────────────────────────────────────────────────

export default function AccountTab() {
  const insets = useSafeAreaInsets()
  const headerHeight = insets.top + 56
  const { profile, loading, saving, error, refetch, pickAvatar, updateProfile } = useProfile()
  const { theme, colors, toggleTheme, isDark } = useTheme()
  const { t, locale, setLocale } = useTranslation()

  // Edit modal state
  const [editVisible, setEditVisible] = useState(false)
  const [editName, setEditName] = useState('')
  const [editBio, setEditBio] = useState('')
  const [editAvatarUri, setEditAvatarUri] = useState<string | null>(null)

  const handleLogout = () => {
    Alert.alert(
      t('logoutBtn'),
      t('logoutConfirm'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('logoutBtn'),
          style: 'destructive',
          onPress: async () => { await supabase.auth.signOut() },
        },
      ]
    )
  }

  const openEditModal = () => {
    setEditName(profile?.displayName || '')
    setEditBio(profile?.bio || '')
    setEditAvatarUri(null)
    setEditVisible(true)
  }

  const handlePickAvatar = async () => {
    const uri = await pickAvatar()
    if (uri) setEditAvatarUri(uri)
  }

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      Alert.alert(t('error'), t('displayNamePlaceholder'))
      return
    }
    try {
      await updateProfile(editName, editBio, editAvatarUri)
      setEditVisible(false)
    } catch (err: any) {
      Alert.alert(t('error'), err.message)
    }
  }

  // Badge helpers
  const destCount = profile?.destinationsCount || 0
  const countryCount = profile?.countriesCount || 0

  const allBadges = [...DEST_BADGES, ...COUNTRY_BADGES]
  const unlockedCount = allBadges.filter(b =>
    (b.type === 'destination' ? destCount : countryCount) >= b.threshold
  ).length

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
          {/* Theme Toggle Pill */}
          <TouchableOpacity
            style={[styles.themeTogglePill, { backgroundColor: isDark ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.05)', borderColor: colors.borderGlass }]}
            activeOpacity={0.8}
            onPress={toggleTheme}
          >
            <View style={[
              styles.themeToggleIndicator,
              { left: isDark ? 32 : 4, backgroundColor: isDark ? 'rgba(239, 68, 68, 0.25)' : 'rgba(245, 158, 11, 0.15)' }
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
        contentContainerStyle={[styles.scrollContent, { paddingTop: headerHeight + 16, paddingBottom: insets.bottom + 96 }]}
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
            <TouchableOpacity
              style={[styles.glassBtn, { borderColor: colors.borderGlass, overflow: 'hidden' }]}
              onPress={refetch}
            >
              <BlurView intensity={isDark ? 30 : 20} tint={colors.blurTint} style={StyleSheet.absoluteFillObject} />
              <Text style={[styles.glassBtnText, { color: colors.textActive }]}>{locale === 'vi' ? 'Thử lại' : 'Retry'}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Main Content */}
        {!loading && profile && (
          <>
            {/* ── Profile Card ── */}
            <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.borderGlass }]}>
              {/* Edit button */}
              <TouchableOpacity style={[styles.editBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)', borderColor: colors.borderGlass }]} onPress={openEditModal}>
                <Edit3 size={14} color={colors.textMuted} />
              </TouchableOpacity>

              {/* Avatar */}
              <View style={styles.avatarWrapper}>
                <Image
                  source={{ uri: profile.avatarUrl }}
                  style={[styles.avatar, { borderColor: colors.borderGlassHeavy }]}
                />
              </View>

              <Text style={[styles.nameText, { color: colors.textActive }]}>{profile.displayName}</Text>
              <Text style={[styles.emailText, { color: colors.textMuted }]}>{profile.email}</Text>
              {profile.bio ? (
                <Text style={[styles.bioText, { color: colors.textSubtle }]}>{profile.bio}</Text>
              ) : (
                <Text style={[styles.bioText, { color: colors.textMuted, fontStyle: 'italic', opacity: 0.5 }]}>
                  {locale === 'vi' ? 'Chưa có giới thiệu...' : 'No bio yet...'}
                </Text>
              )}

              {/* Stats Bar */}
              <View style={[styles.statsBar, { borderTopColor: colors.borderGlass }]}>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: colors.textActive }]}>{profile.destinationsCount}</Text>
                  <Text style={[styles.statLabel, { color: colors.textInactive }]}>{t('destinationsCount')}</Text>
                </View>
                <View style={[styles.statDivider, { backgroundColor: colors.borderGlass }]} />
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: colors.textActive }]}>{profile.momentsCount}</Text>
                  <Text style={[styles.statLabel, { color: colors.textInactive }]}>{t('momentsCount')}</Text>
                </View>
                <View style={[styles.statDivider, { backgroundColor: colors.borderGlass }]} />
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: colors.textActive }]}>{profile.countriesCount}</Text>
                  <Text style={[styles.statLabel, { color: colors.textInactive }]}>{t('countriesCount')}</Text>
                </View>
              </View>
            </View>

            {/* ── Achievements / Badges ── */}
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.textActive }]}>{t('badgesTitle')}</Text>
              <View style={[styles.badgeCountPill, { backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)', borderColor: colors.borderGlass }]}>
                <Award size={12} color={colors.textMuted} />
                <Text style={[styles.badgeCountText, { color: colors.textMuted }]}>{unlockedCount}/{allBadges.length}</Text>
              </View>
            </View>

            {/* Destination badges row */}
            <View style={[styles.badgeGroup, { backgroundColor: colors.cardBackground, borderColor: colors.borderGlass }]}>
              <Text style={[styles.badgeGroupTitle, { color: colors.textSubtle }]}>
                {locale === 'vi' ? '📍 Điểm đến' : '📍 Destinations'}
              </Text>
              <View style={styles.badgeRow}>
                {DEST_BADGES.map(badge => {
                  const unlocked = destCount >= badge.threshold
                  return (
                    <BadgeCard key={badge.key} badge={badge} unlocked={unlocked} colors={colors} isDark={isDark} t={t} />
                  )
                })}
              </View>
            </View>

            {/* Country badges row */}
            <View style={[styles.badgeGroup, { backgroundColor: colors.cardBackground, borderColor: colors.borderGlass }]}>
              <Text style={[styles.badgeGroupTitle, { color: colors.textSubtle }]}>
                {locale === 'vi' ? '🌍 Quốc gia' : '🌍 Countries'}
              </Text>
              <View style={styles.badgeRow}>
                {COUNTRY_BADGES.map(badge => {
                  const unlocked = countryCount >= badge.threshold
                  return (
                    <BadgeCard key={badge.key} badge={badge} unlocked={unlocked} colors={colors} isDark={isDark} t={t} />
                  )
                })}
              </View>
            </View>

            {/* ── Settings Card ── */}
            <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.borderGlass, gap: 16, alignItems: 'stretch' }]}>
              <Text style={[styles.settingsTitle, { color: colors.textActive }]}>{t('settingsSection')}</Text>

              {/* Language Selector */}
              <View style={styles.settingsRow}>
                <Text style={[styles.settingsLabel, { color: colors.textActive }]}>{t('languageLabel')}</Text>
                <View style={[styles.langSelector, { backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.05)', borderColor: colors.borderGlass }]}>
                  <TouchableOpacity
                    style={[styles.langBtn, locale === 'vi' && [styles.langBtnActive, { backgroundColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)' }]]}
                    onPress={() => setLocale('vi')}
                  >
                    <Text style={[styles.langText, locale === 'vi' ? { color: colors.textActive, fontWeight: '700' } : { color: colors.textInactive }]}>🇻🇳 Việt</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.langBtn, locale === 'en' && [styles.langBtnActive, { backgroundColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)' }]]}
                    onPress={() => setLocale('en')}
                  >
                    <Text style={[styles.langText, locale === 'en' ? { color: colors.textActive, fontWeight: '700' } : { color: colors.textInactive }]}>🇺🇸 EN</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* ── Moments Gallery ── */}
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

      {/* ── Edit Profile Modal ── */}
      <Modal
        visible={editVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setEditVisible(false)}
      >
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setEditVisible(false)} />

          <View style={[styles.modalSheet, { backgroundColor: isDark ? '#111118' : '#f1f5f9', borderColor: colors.borderGlass }]}>
            {/* Modal handle */}
            <View style={[styles.sheetHandle, { backgroundColor: colors.borderGlassHeavy }]} />

            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textActive }]}>{t('editProfile')}</Text>
              <TouchableOpacity
                style={[styles.modalCloseBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)', borderColor: colors.borderGlass }]}
                onPress={() => setEditVisible(false)}
              >
                <X size={16} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Avatar picker */}
            <TouchableOpacity style={styles.avatarPickerWrapper} onPress={handlePickAvatar} activeOpacity={0.8}>
              <Image
                source={{ uri: editAvatarUri || profile?.avatarUrl || '' }}
                style={[styles.editAvatar, { borderColor: colors.borderGlassHeavy }]}
              />
              <View style={[styles.avatarPickerOverlay, { backgroundColor: 'rgba(0,0,0,0.45)' }]}>
                <Camera size={20} color="#ffffff" />
                <Text style={styles.avatarPickerText}>{t('changeAvatar')}</Text>
              </View>
            </TouchableOpacity>

            {/* Display Name Input */}
            <View style={styles.fieldGroup}>
              <View style={styles.fieldLabelRow}>
                <User size={14} color={colors.textMuted} />
                <Text style={[styles.fieldLabel, { color: colors.textSubtle }]}>{t('displayNameLabel')}</Text>
              </View>
              <View style={[styles.inputWrapper, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)', borderColor: colors.borderGlass, overflow: 'hidden' }]}>
                <BlurView intensity={isDark ? 15 : 10} tint={colors.blurTint} style={StyleSheet.absoluteFillObject} />
                <TextInput
                  value={editName}
                  onChangeText={setEditName}
                  placeholder={t('displayNamePlaceholder')}
                  placeholderTextColor={colors.textMuted}
                  style={[styles.textInput, { color: colors.textActive }]}
                  maxLength={40}
                  autoFocus
                />
              </View>
            </View>

            {/* Bio Input */}
            <View style={styles.fieldGroup}>
              <View style={styles.fieldLabelRow}>
                <Edit3 size={14} color={colors.textMuted} />
                <Text style={[styles.fieldLabel, { color: colors.textSubtle }]}>{t('bioLabel')}</Text>
              </View>
              <View style={[styles.textAreaWrapper, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)', borderColor: colors.borderGlass, overflow: 'hidden' }]}>
                <BlurView intensity={isDark ? 15 : 10} tint={colors.blurTint} style={StyleSheet.absoluteFillObject} />
                <TextInput
                  value={editBio}
                  onChangeText={setEditBio}
                  placeholder={locale === 'vi' ? 'Kể về bản thân bạn... ✈️' : 'Tell us about yourself... ✈️'}
                  placeholderTextColor={colors.textMuted}
                  style={[styles.textInput, { color: colors.textActive, paddingTop: 12, paddingBottom: 12, textAlignVertical: 'top' }]}
                  maxLength={160}
                  multiline
                  numberOfLines={3}
                />
              </View>
              <Text style={[styles.charCount, { color: colors.textMuted }]}>{editBio.length}/160</Text>
            </View>

            {/* Save Button */}
            <TouchableOpacity
              style={[
                styles.saveBtn,
                {
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.04)',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.15)',
                  shadowColor: isDark ? '#ffffff' : '#000000',
                  shadowOffset: { width: 0, height: 3 },
                  shadowOpacity: isDark ? 0.12 : 0.06,
                  shadowRadius: 8,
                  elevation: 2,
                  overflow: 'hidden',
                }
              ]}
              onPress={handleSaveProfile}
              disabled={saving}
              activeOpacity={0.8}
            >
              <BlurView intensity={Platform.OS === 'android' ? 20 : 35} tint={colors.blurTint} style={StyleSheet.absoluteFillObject} />
              <View style={[styles.saveBtnHighlight, { borderColor: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.75)' }]} />
              {saving ? (
                <ActivityIndicator color={colors.textActive} />
              ) : (
                <View style={styles.saveBtnContent}>
                  <Check size={18} color={colors.textActive} />
                  <Text style={[styles.saveBtnText, { color: colors.textActive }]}>{t('saveProfile')}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  )
}

// ── BadgeCard Component ────────────────────────────────────────────────────────
function BadgeCard({ badge, unlocked, colors, isDark, t }: {
  badge: BadgeDef
  unlocked: boolean
  colors: any
  isDark: boolean
  t: (key: string) => string
}) {
  const icon = getBadgeIcon(badge.key, unlocked, badge.color)

  return (
    <View style={[
      styles.badgeCard,
      {
        backgroundColor: unlocked
          ? (isDark ? `${badge.color}18` : `${badge.color}12`)
          : (isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'),
        borderColor: unlocked
          ? `${badge.color}50`
          : colors.borderGlass,
      }
    ]}>
      {/* Lock overlay if not unlocked */}
      {!unlocked && (
        <View style={styles.lockedOverlay}>
          <Lock size={10} color="rgba(255,255,255,0.25)" />
        </View>
      )}

      <View style={[
        styles.badgeIconBg,
        {
          backgroundColor: unlocked
            ? `${badge.color}22`
            : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'),
          borderColor: unlocked ? `${badge.color}40` : colors.borderGlass,
        }
      ]}>
        {icon}
      </View>
      <Text
        numberOfLines={2}
        style={[
          styles.badgeName,
          { color: unlocked ? badge.color : colors.textInactive, opacity: unlocked ? 1 : 0.5 }
        ]}
      >
        {t(badge.nameKey)}
      </Text>
      <Text
        numberOfLines={2}
        style={[styles.badgeDesc, { color: colors.textMuted, opacity: unlocked ? 0.8 : 0.35 }]}
      >
        {t(badge.descKey)}
      </Text>
    </View>
  )
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const { width } = Dimensions.get('window')
const gridItemWidth = (width - 48) / 2

const styles = StyleSheet.create({
  headerButton: { padding: 4 },
  scrollContent: { paddingHorizontal: 16, gap: 16 },

  // Card
  card: {
    alignItems: 'center',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
  },

  // Edit button on profile card
  editBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Avatar
  avatarWrapper: { position: 'relative', marginBottom: 12 },
  avatar: { width: 84, height: 84, borderRadius: 42, borderWidth: 2 },

  nameText: { fontFamily: 'System', fontSize: 18, fontWeight: '700', marginBottom: 2 },
  emailText: { fontFamily: 'System', fontSize: 12, marginBottom: 10 },
  bioText: { fontFamily: 'System', fontSize: 12, textAlign: 'center', lineHeight: 18, paddingHorizontal: 12, marginBottom: 20 },

  statsBar: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: 16,
  },
  statItem: { alignItems: 'center', flex: 1 },
  statDivider: { width: 1, height: 28 },
  statValue: { fontFamily: 'System', fontSize: 18, fontWeight: '800' },
  statLabel: { fontFamily: 'System', fontSize: 10, marginTop: 2, textAlign: 'center' },

  // Badges
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4, marginTop: 4 },
  sectionTitle: { fontFamily: 'System', fontSize: 16, fontWeight: '700' },
  badgeCountPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1,
  },
  badgeCountText: { fontFamily: 'System', fontSize: 11, fontWeight: '600' },

  badgeGroup: { borderRadius: 20, padding: 16, borderWidth: 1, gap: 12 },
  badgeGroupTitle: { fontFamily: 'System', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  badgeRow: { flexDirection: 'row', gap: 10 },

  badgeCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    alignItems: 'center',
    gap: 6,
    position: 'relative',
    overflow: 'hidden',
  },
  lockedOverlay: { position: 'absolute', top: 6, right: 6 },
  badgeIconBg: {
    width: 44, height: 44, borderRadius: 22, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center', marginBottom: 2,
  },
  badgeName: { fontFamily: 'System', fontSize: 10, fontWeight: '700', textAlign: 'center' },
  badgeDesc: { fontFamily: 'System', fontSize: 9, textAlign: 'center', lineHeight: 13 },

  // Settings
  settingsTitle: { fontFamily: 'System', fontSize: 14, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, alignSelf: 'flex-start' },
  settingsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%' },
  settingsLabel: { fontFamily: 'System', fontSize: 14, fontWeight: '600' },
  langSelector: { flexDirection: 'row', borderRadius: 14, borderWidth: 1, padding: 3, gap: 4 },
  langBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  langBtnActive: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  langText: { fontFamily: 'System', fontSize: 12, fontWeight: '600' },

  // Gallery
  galleryContainer: { gap: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  gridItem: { width: gridItemWidth, height: gridItemWidth, borderRadius: 16, overflow: 'hidden', borderWidth: 1 },
  gridImage: { width: '100%', height: '100%' },
  emptyGallery: { alignItems: 'center', justifyContent: 'center', paddingVertical: 48, gap: 12, borderRadius: 20, borderWidth: 1 },
  emptyIconBg: { width: 56, height: 56, borderRadius: 28, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontFamily: 'System', fontSize: 13, textAlign: 'center' },

  // States
  centerState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 12 },
  stateText: { fontFamily: 'System', fontSize: 14 },
  glassBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, borderWidth: 1, marginTop: 8 },
  glassBtnText: { fontFamily: 'System', fontSize: 13, fontWeight: '600' },

  // Header
  headerRightGroup: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  themeTogglePill: { width: 60, height: 28, borderRadius: 14, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 8, position: 'relative', overflow: 'hidden' },
  themeToggleIndicator: { position: 'absolute', top: 1, width: 24, height: 24, borderRadius: 12 },
  toggleIcon: { zIndex: 2 },

  // Edit Modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.55)' },
  modalSheet: {
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    borderWidth: 1, borderBottomWidth: 0,
    padding: 24, paddingBottom: 40,
    gap: 20,
  },
  sheetHandle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 4 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { fontFamily: 'System', fontSize: 18, fontWeight: '700' },
  modalCloseBtn: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },

  // Avatar picker
  avatarPickerWrapper: { alignSelf: 'center', position: 'relative', borderRadius: 52, overflow: 'hidden' },
  editAvatar: { width: 104, height: 104, borderRadius: 52, borderWidth: 2 },
  avatarPickerOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', gap: 4, borderRadius: 52 },
  avatarPickerText: { fontFamily: 'System', fontSize: 10, fontWeight: '600', color: '#ffffff' },

  // Input field
  fieldGroup: { gap: 8 },
  fieldLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  fieldLabel: { fontFamily: 'System', fontSize: 12, fontWeight: '600' },
  inputWrapper: { borderRadius: 14, borderWidth: 1, height: 50, justifyContent: 'center', paddingHorizontal: 16 },
  textAreaWrapper: { borderRadius: 14, borderWidth: 1, minHeight: 88, paddingHorizontal: 16, justifyContent: 'flex-start' },
  textInput: { fontFamily: 'System', fontSize: 15, flex: 1 },
  charCount: { fontFamily: 'System', fontSize: 11, textAlign: 'right', marginTop: 2 },

  // Save button (glass)
  saveBtn: { height: 52, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  saveBtnHighlight: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 14, borderWidth: 1.2, opacity: 0.8 },
  saveBtnContent: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  saveBtnText: { fontFamily: 'System', fontSize: 15, fontWeight: '700' },
})
