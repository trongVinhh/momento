import React, { useState, useEffect, useMemo } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
  Modal,
  Platform,
  Alert,
  ScrollView,
} from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { BlurView } from 'expo-blur'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import {
  MessageSquare,
  Globe,
  Settings,
  ArrowRight,
  Plus,
  ChevronRight,
  HelpCircle,
  BookOpen,
  X,
} from 'lucide-react-native'

import { supabase } from '../../lib/supabase'
import { useTheme } from '../../hooks/useTheme'
import { globalStyles } from '../../styles/globalStyles'
import { useTranslation } from '../../context/LanguageContext'

const SCENARIOS = [
  {
    id: 'free',
    titleVi: 'Hội thoại tự do',
    titleEn: 'Free Talk',
    prompt: 'Free conversation. Be a friendly language exchange partner. Keep answers natural and short (1-2 sentences).',
    icon: MessageSquare,
  },
  {
    id: 'izakaya',
    titleVi: 'Gọi món tại Izakaya',
    titleEn: 'Ordering at Izakaya',
    prompt: 'You are a lively staff member at a busy Japanese Izakaya restaurant. Guide the user in ordering drinks and food. Use standard polite Japanese (Desu/Masu) but sound energetic.',
    icon: BookOpen,
  },
  {
    id: 'job_interview',
    titleVi: 'Phỏng vấn xin việc',
    titleEn: 'Job Interview',
    prompt: 'You are an interviewer at a convenience store hiring a part-time clerk. Ask formal interview questions about their experience, schedule, and motivation. Speak politely and clearly.',
    icon: HelpCircle,
  },
  {
    id: 'asking_directions',
    titleVi: 'Hỏi đường ở nhà ga',
    titleEn: 'Asking for Directions',
    prompt: 'You are a helpful local resident at a Japanese train station. Help the user find their way to a nearby tourist spot. Speak clearly and politely.',
    icon: Globe,
  },
]

const LANGUAGES = [
  { code: 'Japanese', name: 'Nhật', flag: '🇯🇵' },
  { code: 'English', name: 'Anh', flag: '🇺🇸' },
  { code: 'Korean', name: 'Hàn', flag: '🇰🇷' },
  { code: 'Chinese', name: 'Trung', flag: '🇨🇳' },
]

export default function BotSetupScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { colors, isDark } = useTheme()
  const { locale } = useTranslation()

  // Setup options
  const [selectedLang, setSelectedLang] = useState('Japanese')
  const [selectedLevel, setSelectedLevel] = useState('Intermediate')
  const [selectedScenario, setSelectedScenario] = useState('free')
  const [customScenario, setCustomScenario] = useState('')

  // Database states
  const [sessions, setSessions] = useState<any[]>([])
  const [loadingSessions, setLoadingSessions] = useState(false)
  const [starting, setStarting] = useState(false)
  const [userProfile, setUserProfile] = useState<any | null>(null)

  // Selector Modal
  const [showScenarioModal, setShowScenarioModal] = useState(false)


  const callSupabaseFunction = async (body: any) => {
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || ''
    const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || ''
    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token || ''

    const response = await fetch(`${supabaseUrl}/functions/v1/momento-ai-proxy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'apikey': supabaseAnonKey,
      },
      body: JSON.stringify(body)
    })

    if (!response.ok) {
      const errorText = await response.text()
      let errorJson: any = {}
      try {
        errorJson = JSON.parse(errorText)
      } catch (_) {}
      const errMsg = errorJson.error || errorText
      throw new Error(errMsg)
    }

    return await response.json()
  }

  // Fetch User, Sessions and Language Preference on mount
  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserProfile(user)
        fetchSessions(user.id)
        
        try {
          const { data: profile, error: pErr } = await supabase
            .from('profiles')
            .select('default_language')
            .eq('id', user.id)
            .single()
          
          if (profile && profile.default_language) {
            setSelectedLang(profile.default_language)
          }
        } catch (err) {
          console.error('Error loading default language from database:', err)
        }
      }
    }
    init()
  }, [])

  const fetchSessions = async (userId: string) => {
    setLoadingSessions(true)
    try {
      const { data, error } = await supabase
        .from('bot_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })

      if (error) throw error
      setSessions(data || [])
    } catch (err: any) {
      console.error('Error fetching sessions:', err)
    } finally {
      setLoadingSessions(false)
    }
  }

  const handleLanguageChange = async (langCode: string) => {
    setSelectedLang(langCode)
    if (!userProfile) return
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ default_language: langCode })
        .eq('id', userProfile.id)
      if (error) throw error
    } catch (err) {
      console.error('Error saving default language to database:', err)
    }
  }

  const handleStartSession = async () => {
    if (!userProfile || starting) return

    let scenarioTitle = ''
    let scenarioPrompt = ''

    if (selectedScenario === 'custom') {
      if (!customScenario.trim()) {
        Alert.alert('Thông báo', 'Vui lòng nhập mô tả ngữ cảnh bạn mong muốn.')
        return
      }
      scenarioTitle = customScenario.trim().substring(0, 30) + '...'
      scenarioPrompt = `Custom context: ${customScenario.trim()}`
    } else {
      const matched = SCENARIOS.find(s => s.id === selectedScenario)
      scenarioTitle = locale === 'vi' ? matched?.titleVi || '' : matched?.titleEn || ''
      scenarioPrompt = matched?.prompt || ''
    }

    setStarting(true)
    try {
      // 1. Insert session
      const { data, error } = await supabase
        .from('bot_sessions')
        .insert({
          user_id: userProfile.id,
          language: selectedLang,
          level: selectedLevel,
          scenario_title: scenarioTitle,
          scenario_prompt: scenarioPrompt,
        })
        .select()
        .single()

      if (error) throw error

      // 2. Navigate to chat screen immediately so user doesn't wait
      router.push({ pathname: '/bot-chat', params: { sessionId: data.id } })

      fetchSessions(userProfile.id)
    } catch (err: any) {
      console.error('Error starting session:', err)
      Alert.alert('Lỗi', `Không thể khởi động cuộc hội thoại: ${err.message}`)
    } finally {
      setStarting(false)
    }
  }

  const handleDeleteSession = async (sessionId: string) => {
    Alert.alert(
      'Xác nhận xóa',
      'Bạn có chắc chắn muốn xóa cuộc hội thoại này không?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase.from('bot_sessions').delete().eq('id', sessionId)
              if (error) throw error
              if (userProfile) fetchSessions(userProfile.id)
            } catch (err) {
              console.error('Error deleting session:', err)
              Alert.alert('Lỗi', 'Không thể xóa hội thoại.')
            }
          }
        }
      ]
    )
  }

  const activeScenarioObject = useMemo(() => {
    return SCENARIOS.find(s => s.id === selectedScenario) || { titleVi: 'Ngữ cảnh tùy chọn khác', titleEn: 'Custom context' }
  }, [selectedScenario])

  return (
    <View style={[globalStyles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <BlurView
        intensity={Platform.OS === 'android' ? 40 : 60}
        tint={colors.blurTint}
        style={[globalStyles.headerBase, { paddingTop: insets.top + 12, borderBottomColor: colors.borderGlass }]}
      >
        <View>
          <Text style={[globalStyles.headerTitle, { color: colors.textActive }]}>Trợ lý</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>Hỗ trợ bạn mọi lúc</Text>
        </View>
      </BlurView>
 
      <ScrollView
        contentContainerStyle={[styles.setupScroll, { paddingTop: insets.top + 76, paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Minimal Setup Box */}
        <View style={[styles.compactCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : '#ffffff', borderColor: colors.borderGlass }]}>
          
          {/* Ngôn ngữ hàng ngang */}
          <View style={styles.setupRow}>
            <Text style={[styles.rowLabel, { color: colors.textSubtle }]}>Ngôn ngữ:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.langPills}>
              {LANGUAGES.map(lang => (
                <TouchableOpacity
                  key={lang.code}
                  style={[
                    styles.langPill,
                    { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', borderColor: 'transparent' },
                    selectedLang === lang.code && { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)', borderColor: colors.textActive, borderWidth: 1 },
                  ]}
                  onPress={() => handleLanguageChange(lang.code)}
                >
                  <Text style={styles.langFlag}>{lang.flag}</Text>
                  <Text style={[styles.langText, { color: colors.textActive }]}>
                    {lang.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Trình độ hàng ngang */}
          <View style={styles.setupRow}>
            <Text style={[styles.rowLabel, { color: colors.textSubtle }]}>Trình độ:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.langPills}>
              {[
                { code: 'Beginner', name: 'Sơ cấp' },
                { code: 'Intermediate', name: 'Trung cấp' },
                { code: 'Advanced', name: 'Cao cấp' }
              ].map(lvl => (
                <TouchableOpacity
                  key={lvl.code}
                  style={[
                    styles.langPill,
                    { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', borderColor: 'transparent' },
                    selectedLevel === lvl.code && { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)', borderColor: colors.textActive, borderWidth: 1 },
                  ]}
                  onPress={() => setSelectedLevel(lvl.code)}
                >
                  <Text style={[styles.langText, { color: colors.textActive }]}>
                    {lvl.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
 
          {/* Chọn Scenario Dropdown */}
          <View style={styles.setupRow}>
            <Text style={[styles.rowLabel, { color: colors.textSubtle }]}>Chủ đề:</Text>
            <TouchableOpacity
              style={[styles.selectorInput, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', borderColor: colors.borderGlass }]}
              onPress={() => setShowScenarioModal(true)}
            >
              <Text style={[styles.selectorInputText, { color: colors.textActive }]}>
                {selectedScenario === 'custom' ? 'Tự thiết lập ngữ cảnh...' : (locale === 'vi' ? activeScenarioObject.titleVi : activeScenarioObject.titleEn)}
              </Text>
              <ChevronRight size={14} color={colors.textInactive} />
            </TouchableOpacity>
          </View>
 
          {/* Nhập custom scenario nếu chọn custom */}
          {selectedScenario === 'custom' && (
            <TextInput
              style={[
                styles.customInput,
                {
                  color: colors.textActive,
                  borderColor: colors.borderGlass,
                  backgroundColor: isDark ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.01)',
                },
              ]}
              placeholder="Nhập ngữ cảnh (ví dụ: Bạn là lễ tân khách sạn gọi nhắc giờ check-out...)"
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={2}
              value={customScenario}
              onChangeText={setCustomScenario}
            />
          )}
 
          <TouchableOpacity
            style={[
              styles.startButton, 
              { 
                backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', 
                borderColor: colors.borderGlass,
                borderWidth: 1
              }
            ]}
            onPress={handleStartSession}
            disabled={starting}
          >
            {starting ? (
              <ActivityIndicator size="small" color={colors.textActive} />
            ) : (
              <>
                <Text style={[styles.startButtonText, { color: colors.textActive }]}>Bắt đầu hội thoại</Text>
                <ArrowRight size={16} color={colors.textActive} style={{ marginLeft: 6 }} />
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Lịch sử hội thoại */}
        <Text style={[styles.sectionTitle, { color: colors.textSubtle, marginTop: 16 }]}>Lịch sử trò chuyện</Text>
        
        {loadingSessions ? (
          <ActivityIndicator size="small" color={colors.accentPrimary} style={{ marginVertical: 12 }} />
        ) : sessions.length === 0 ? (
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>Chưa có cuộc trò chuyện nào.</Text>
        ) : (
          <View style={styles.historyList}>
            {sessions.map(sess => (
              <View
                key={sess.id}
                style={[styles.historyCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : '#ffffff', borderColor: colors.borderGlass }]}
              >
                <TouchableOpacity
                  style={styles.historyCardBody}
                  onPress={() => router.push({ pathname: '/bot-chat', params: { sessionId: sess.id } })}
                >
                  <Text style={styles.historyCardFlag}>
                    {sess.language === 'Japanese' ? '🇯🇵' : sess.language === 'English' ? '🇺🇸' : sess.language === 'Korean' ? '🇰🇷' : '🇨🇳'}
                  </Text>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <Text style={[styles.historyCardTitle, { color: colors.textActive }]} numberOfLines={1}>
                        {sess.scenario_title}
                      </Text>
                      <View style={[styles.levelTag, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', borderColor: colors.borderGlass, borderWidth: 1 }]}>
                        <Text style={[styles.levelTagText, { color: colors.textMuted }]}>
                          {sess.level === 'Beginner' ? 'Sơ cấp' : sess.level === 'Advanced' ? 'Cao cấp' : 'Trung cấp'}
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.historyCardDate, { color: colors.textMuted, marginTop: 2 }]}>
                      {new Date(sess.updated_at).toLocaleDateString(locale === 'vi' ? 'vi-VN' : 'en-US')}
                    </Text>
                  </View>
                  <ChevronRight size={16} color={colors.textInactive} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.deleteSessionBtn, { borderLeftColor: colors.borderGlass }]}
                  onPress={() => handleDeleteSession(sess.id)}
                >
                  <Plus size={16} color={colors.textInactive} style={{ transform: [{ rotate: '45deg' }] }} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
 
      {/* ── Modal: Chọn Scenario Dropdown ── */}
      <Modal visible={showScenarioModal} transparent animationType="slide" onRequestClose={() => setShowScenarioModal(false)}>
        <View style={styles.modalBackdrop}>
          <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={() => setShowScenarioModal(false)}>
            <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFillObject} />
          </TouchableOpacity>
 
          <View style={[styles.modalBox, { backgroundColor: isDark ? '#16161a' : '#ffffff', borderColor: colors.borderGlass }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textActive }]}>Chọn chủ đề hội thoại</Text>
              <TouchableOpacity onPress={() => setShowScenarioModal(false)}>
                <X size={18} color={colors.textActive} />
              </TouchableOpacity>
            </View>
 
            <ScrollView contentContainerStyle={styles.modalScroll}>
              {SCENARIOS.map(sc => (
                <TouchableOpacity
                  key={sc.id}
                  style={[
                    styles.modalItem,
                    { borderColor: colors.borderGlass },
                    selectedScenario === sc.id && { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)', borderColor: colors.textActive },
                  ]}
                  onPress={() => {
                    setSelectedScenario(sc.id)
                    setShowScenarioModal(false)
                  }}
                >
                  <Text style={[styles.modalItemText, { color: colors.textActive }]}>
                    {locale === 'vi' ? sc.titleVi : sc.titleEn}
                  </Text>
                </TouchableOpacity>
              ))}
 
              <TouchableOpacity
                style={[
                  styles.modalItem,
                  { borderColor: colors.borderGlass },
                  selectedScenario === 'custom' && { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)', borderColor: colors.textActive },
                ]}
                onPress={() => {
                  setSelectedScenario('custom')
                  setShowScenarioModal(false)
                }}
              >
                <Text style={[styles.modalItemText, { color: colors.textActive }]}>
                  Tự thiết lập ngữ cảnh khác...
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  headerSubtitle: {
    fontFamily: 'System',
    fontSize: 11,
    marginTop: 1,
  },
  setupScroll: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 16,
  },
  compactCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    gap: 14,
  },
  setupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  rowLabel: {
    fontFamily: 'System',
    fontSize: 13,
    fontWeight: '700',
    width: 75,
  },
  langPills: {
    flexDirection: 'row',
    gap: 6,
  },
  langPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  langFlag: {
    fontSize: 14,
    marginRight: 4,
  },
  langText: {
    fontFamily: 'System',
    fontSize: 12,
    fontWeight: '600',
  },
  selectorInput: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  selectorInputText: {
    fontFamily: 'System',
    fontSize: 13,
    fontWeight: '600',
  },
  customInput: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 10,
    fontSize: 12,
    fontFamily: 'System',
    textAlignVertical: 'top',
    height: 54,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    height: 44,
  },
  startButtonText: {
    fontFamily: 'System',
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  sectionTitle: {
    fontFamily: 'System',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  emptyText: {
    fontFamily: 'System',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 12,
  },
  historyList: {
    gap: 10,
  },
  historyCard: {
    flexDirection: 'row',
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  historyCardBody: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  historyCardFlag: {
    fontSize: 20,
    marginRight: 10,
  },
  historyCardTitle: {
    fontFamily: 'System',
    fontSize: 13,
    fontWeight: '700',
  },
  historyCardDate: {
    fontFamily: 'System',
    fontSize: 10,
    marginTop: 1,
  },
  deleteSessionBtn: {
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderLeftWidth: 1,
  },

  // Modal Dropdown Scenario
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalBox: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
    maxHeight: '60%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontFamily: 'System',
    fontSize: 15,
    fontWeight: '700',
  },
  modalScroll: {
    gap: 8,
  },
  modalItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  modalItemText: {
    fontFamily: 'System',
    fontSize: 13,
    fontWeight: '600',
  },
  levelTag: {
    paddingVertical: 1,
    paddingHorizontal: 5,
    borderRadius: 6,
  },
  levelTagText: {
    fontFamily: 'System',
    fontSize: 9,
    fontWeight: '700',
  },
})
