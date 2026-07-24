import { useState, useEffect, useMemo, useCallback } from 'react'
import { Alert } from 'react-native'
import { useRouter } from 'expo-router'
import { supabase } from '../lib/supabase'
import { useTranslation } from '../context/LanguageContext'
import { SCENARIOS } from '../constants/botConstants'

export function useBotSessions() {
  const router = useRouter()
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

  const fetchSessions = useCallback(async (userId: string) => {
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
  }, [])

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
  }, [fetchSessions])

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

      // 2. Navigate to chat screen immediately
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

  return {
    selectedLang,
    selectedLevel,
    selectedScenario,
    customScenario,
    sessions,
    loadingSessions,
    starting,
    userProfile,
    showScenarioModal,
    setSelectedLang,
    setSelectedLevel,
    setSelectedScenario,
    setCustomScenario,
    setShowScenarioModal,
    handleLanguageChange,
    handleStartSession,
    handleDeleteSession,
    activeScenarioObject,
    locale,
  }
}
