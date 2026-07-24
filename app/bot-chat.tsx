import React, { useState, useEffect, useRef, useMemo } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native'
import { BlurView } from 'expo-blur'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter, useLocalSearchParams } from 'expo-router'
import * as Speech from 'expo-speech'
import { Audio } from 'expo-av'
import * as FileSystem from 'expo-file-system/legacy'
import {
  Send,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowLeft,
  Mic,
  Volume2,
  VolumeX,
  Settings,
  Languages,
} from 'lucide-react-native'

import { supabase } from '../lib/supabase'
import { useTheme } from '../hooks/useTheme'
import { globalStyles } from '../styles/globalStyles'
import { useTranslation } from '../context/LanguageContext'

export default function BotChatScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { colors, isDark } = useTheme()
  const { locale } = useTranslation()
  const { sessionId } = useLocalSearchParams()

  const [activeSession, setActiveSession] = useState<any | null>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [inputText, setInputText] = useState('')

  // UI States
  const [visibleTranslationId, setVisibleTranslationId] = useState<string | null>(null)
  const [selectedCorrection, setSelectedCorrection] = useState<any | null>(null)

  // Voice States
  const [recording, setRecording] = useState<Audio.Recording | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [autoSpeak, setAutoSpeak] = useState(true)
  const [speakingId, setSpeakingId] = useState<string | null>(null)
  const [availableVoices, setAvailableVoices] = useState<Speech.Voice[]>([])
  const [selectedVoice, setSelectedVoice] = useState<string | null>(null)
  const [showVoiceModal, setShowVoiceModal] = useState(false)
  const [furiganaEnabled, setFuriganaEnabled] = useState(true)

  // Translation Helper States
  const [translatedText, setTranslatedText] = useState('')
  const [translatedReading, setTranslatedReading] = useState('')
  const [translating, setTranslating] = useState(false)

  const flatListRef = useRef<FlatList | null>(null)
  const activeSoundRef = useRef<Audio.Sound | null>(null)

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
      } catch (_) { }
      const errMsg = errorJson.error || errorText
      throw new Error(errMsg)
    }

    return await response.json()
  }

  // Configure audio mode and clean speech on mount/unmount
  useEffect(() => {
    const initAudio = async () => {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          playThroughEarpieceAndroid: false,
        })
      } catch (err) {
        console.error('Failed to initialize Audio mode:', err)
      }
    }
    initAudio()

    return () => {
      Speech.stop()
      if (activeSoundRef.current) {
        activeSoundRef.current.stopAsync().catch(() => {})
        activeSoundRef.current.unloadAsync().catch(() => {})
      }
    }
  }, [])

  // Load session and messages on mount
  useEffect(() => {
    if (sessionId) {
      loadChatData(sessionId as string, true)
    }
  }, [sessionId])

  // Fetch available voices when activeSession changes
  useEffect(() => {
    const fetchVoices = async () => {
      try {
        const allVoices = await Speech.getAvailableVoicesAsync()
        const langCode = getSpeechLanguageCode(activeSession?.language || '')
        const prefix = langCode.split('-')[0].toLowerCase()

        const matching = allVoices.filter((v: any) =>
          v.language.toLowerCase().startsWith(prefix)
        )
        setAvailableVoices(matching)

        if (matching.length > 0) {
          const enhanced = matching.find((v: any) => v.quality === 'Enhanced')
          setSelectedVoice(enhanced ? enhanced.identifier : matching[0].identifier)
        }
      } catch (err) {
        console.error('Error fetching voices:', err)
      }
    }

    if (activeSession) {
      fetchVoices()
    }
  }, [activeSession])

  const loadChatData = async (sid: string, isInitial = false) => {
    if (isInitial) setLoading(true)
    try {
      // 1. Fetch Session Info
      const { data: sessionData, error: sErr } = await supabase
        .from('bot_sessions')
        .select('*')
        .eq('id', sid)
        .single()

      if (sErr) throw sErr
      setActiveSession(sessionData)

      // 2. Fetch Messages
      const { data: msgs, error: mErr } = await supabase
        .from('bot_messages')
        .select('*')
        .eq('session_id', sid)
        .order('created_at', { ascending: true })

      if (mErr) throw mErr

      if (!msgs || msgs.length === 0) {
        setMessages([])
        setSending(true)
        try {
          const botGreetingPrompt = `Hi, I am ready to start our scenario. Please introduce yourself and start the conversation as your character in ${sessionData.language} based on the prompt.`
          const resJson = await callSupabaseFunction({
            message: botGreetingPrompt,
            history: [],
            language: sessionData.language,
            scenario_prompt: sessionData.scenario_prompt,
            level: sessionData.level,
          })

          const { data: insertedMsg, error: insertErr } = await supabase
            .from('bot_messages')
            .insert({
              session_id: sid,
              sender: 'bot',
              content: resJson.reply,
              translation: resJson.translation,
              suggestions: resJson.suggestions,
              grammar_correction: resJson.grammar_correction,
              hiragana: JSON.stringify(resJson.furigana),
            })
            .select()
            .single()

          if (insertErr) throw insertErr

          setMessages([insertedMsg])
          if (autoSpeak) {
            speakBotReply(resJson.reply, sessionData.language)
          }
        } catch (err: any) {
          console.error('Error generating greeting:', err)
          Alert.alert('Lỗi', `Không thể tải tin nhắn chào của trợ lý: ${err.message}`)
        } finally {
          setSending(false)
        }
      } else {
        setMessages(msgs || [])
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 200)
      }
    } catch (err: any) {
      console.error('Error loading chat:', err)
      Alert.alert('Lỗi', 'Không thể tải cuộc hội thoại.')
      router.back()
    } finally {
      if (isInitial) setLoading(false)
    }
  }

  const getSpeechLanguageCode = (lang: string) => {
    if (lang === 'Japanese') return 'ja-JP'
    if (lang === 'English') return 'en-US'
    if (lang === 'Korean') return 'ko-KR'
    if (lang === 'Chinese') return 'zh-CN'
    return 'ja-JP'
  }

  const speakBotReply = (text: string, language: string) => {
    Speech.stop()
    const code = getSpeechLanguageCode(language)
    Speech.speak(text, {
      language: code,
      voice: selectedVoice || undefined,
      pitch: 1.0,
      rate: 0.95,
    })
  }

  const handleSpeakMessage = (messageId: string, text: string, language: string) => {
    if (speakingId === messageId) {
      Speech.stop()
      setSpeakingId(null)
    } else {
      setSpeakingId(messageId)
      Speech.stop()
      const code = getSpeechLanguageCode(language)
      Speech.speak(text, {
        language: code,
        voice: selectedVoice || undefined,
        pitch: 1.0,
        rate: 0.95,
        onDone: () => setSpeakingId(null),
        onError: () => setSpeakingId(null),
      })
    }
  }

  const handleTranslateInputText = async () => {
    if (!inputText.trim() || !activeSession) return
    setTranslating(true)
    setTranslatedText('')
    setTranslatedReading('')
    try {
      const resJson = await callSupabaseFunction({
        action: 'translate_idea',
        vietnamese_idea: inputText,
        language: activeSession.language,
        scenario_prompt: activeSession.scenario_prompt,
        level: activeSession.level,
      })
      setTranslatedText(resJson.translation || '')
      setTranslatedReading(resJson.reading || '')
    } catch (err: any) {
      console.error('Error translating input:', err)
      Alert.alert('Lỗi', `Không thể dịch: ${err.message}`)
    } finally {
      setTranslating(false)
    }
  }

  const handlePlayUserAudio = async (msgId: string, audioPath: string) => {
    if (speakingId === msgId) {
      if (activeSoundRef.current) {
        await activeSoundRef.current.stopAsync().catch(() => {})
        await activeSoundRef.current.unloadAsync().catch(() => {})
        activeSoundRef.current = null
      }
      setSpeakingId(null)
    } else {
      Speech.stop()
      if (activeSoundRef.current) {
        try {
          await activeSoundRef.current.stopAsync().catch(() => {})
          await activeSoundRef.current.unloadAsync().catch(() => {})
        } catch (_) {}
        activeSoundRef.current = null
      }

      setSpeakingId(msgId)
      try {
        const { sound } = await Audio.Sound.createAsync(
          { uri: audioPath },
          { shouldPlay: true }
        )
        activeSoundRef.current = sound
        
        sound.setOnPlaybackStatusUpdate(async (status) => {
          if (status.isLoaded && status.didJustFinish) {
            await sound.unloadAsync().catch(() => {})
            if (activeSoundRef.current === sound) {
              activeSoundRef.current = null
            }
            setSpeakingId(null)
          }
        })
      } catch (err) {
        console.error('Error playing user voice:', err)
        Alert.alert('Lỗi', 'Không thể phát lại giọng nói của bạn.')
        setSpeakingId(null)
      }
    }
  }

  // Audio Recording Settings
  const recordingOptions = {
    android: {
      extension: '.m4a',
      outputFormat: Audio.AndroidOutputFormat.MPEG_4,
      audioEncoder: Audio.AndroidAudioEncoder.AAC,
      sampleRate: 16000,
      numberOfChannels: 1,
      bitRate: 64000,
    },
    ios: {
      extension: '.m4a',
      audioQuality: Audio.IOSAudioQuality.LOW,
      sampleRate: 16000,
      numberOfChannels: 1,
      bitRate: 64000,
      linearPCMBitDepth: 16,
      linearPCMIsBigEndian: false,
      linearPCMIsFloat: false,
    },
    web: {},
  }

  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync()
      if (permission.status !== 'granted') {
        Alert.alert('Quyền truy cập', 'Vui lòng cấp quyền truy cập microphone để ghi âm giọng nói.')
        return
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      })

      const { recording } = await Audio.Recording.createAsync(recordingOptions)
      setRecording(recording)
      setIsRecording(true)
    } catch (err) {
      console.error('Failed to start recording', err)
      Alert.alert('Lỗi', 'Không thể khởi động ghi âm.')
    }
  }

  const stopRecording = async () => {
    if (!recording) return

    setIsRecording(false)
    setRecording(null)

    try {
      await recording.stopAndUnloadAsync()
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        playThroughEarpieceAndroid: false,
      })

      const uri = recording.getURI()
      if (!uri) return

      const base64Audio = await FileSystem.readAsStringAsync(uri, {
        encoding: 'base64',
      })

      await handleSendAudioMessage(base64Audio, uri)
    } catch (err) {
      console.error('Failed to stop recording', err)
      Alert.alert('Lỗi', 'Không thể hoàn thành xử lý file âm thanh.')
    }
  }

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || sending || !activeSession) return

    setInputText('')
    setSending(true)

    // Optimistically insert user message locally
    const tempUserMsg = {
      id: Math.random().toString(),
      sender: 'user',
      content: textToSend.trim(),
    }
    setMessages(prev => [...prev, tempUserMsg])
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token || ''

      // 1. Save user message to database
      const { error: userMsgErr } = await supabase.from('bot_messages').insert({
        session_id: activeSession.id,
        sender: 'user',
        content: textToSend.trim(),
      })
      if (userMsgErr) throw userMsgErr

      // 2. Call Supabase Function Proxy
      const { data: resJson, error: fnErr } = await supabase.functions.invoke('momento-ai-proxy', {
        body: {
          message: textToSend.trim(),
          history: messages.filter(m => m.id.length > 10),
          language: activeSession.language,
          scenario_prompt: activeSession.scenario_prompt,
          level: activeSession.level,
        }
      })

      if (fnErr) throw fnErr

      // 3. Save Bot message response
      const { error: botMsgErr } = await supabase.from('bot_messages').insert({
        session_id: activeSession.id,
        sender: 'bot',
        content: resJson.reply,
        translation: resJson.translation,
        suggestions: resJson.suggestions,
        grammar_correction: resJson.grammar_correction,
        hiragana: JSON.stringify(resJson.furigana),
      })
      if (botMsgErr) throw botMsgErr

      await supabase
        .from('bot_sessions')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', activeSession.id)

      await loadChatData(activeSession.id)

      if (autoSpeak) {
        speakBotReply(resJson.reply, activeSession.language)
      }
    } catch (err: any) {
      console.error('Error sending message:', err)
      Alert.alert('Lỗi', `Gửi tin nhắn thất bại: ${err.message}`)
      loadChatData(activeSession.id)
    } finally {
      setSending(false)
    }
  }

  const handleSendAudioMessage = async (base64Audio: string, localUri: string) => {
    if (sending || !activeSession) return

    setSending(true)

    // Optimistically insert user message as audio placeholder
    const tempUserMsg = {
      id: Math.random().toString(),
      sender: 'user',
      content: '🎤 [Tin nhắn giọng nói]',
    }
    setMessages(prev => [...prev, tempUserMsg])
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token || ''

      // Save audio to permanent local file
      let finalAudioPath = ''
      try {
        const dir = `${FileSystem.documentDirectory}recordings`
        const dirInfo = await FileSystem.getInfoAsync(dir)
        if (!dirInfo.exists) {
          await FileSystem.makeDirectoryAsync(dir, { intermediates: true })
        }
        const permanentUri = `${dir}/${Date.now()}.m4a`
        await FileSystem.copyAsync({ from: localUri, to: permanentUri })
        finalAudioPath = permanentUri
      } catch (fileErr) {
        console.error('Failed to copy voice recording file:', fileErr)
      }

      // Call Supabase Function Proxy
      const { data: resJson, error: fnErr } = await supabase.functions.invoke('momento-ai-proxy', {
        body: {
          audio: base64Audio,
          audioMimeType: 'audio/m4a',
          history: messages.filter(m => m.id.length > 10),
          language: activeSession.language,
          scenario_prompt: activeSession.scenario_prompt,
          level: activeSession.level,
        }
      })

      if (fnErr) throw fnErr
      const userText = resJson.user_transcription || '🎤 [Gửi giọng nói thành công]'

      // Save user message to database
      const { error: userMsgErr } = await supabase.from('bot_messages').insert({
        session_id: activeSession.id,
        sender: 'user',
        content: userText,
        audio_path: finalAudioPath || null,
      })
      if (userMsgErr) throw userMsgErr

      // Save Bot message response
      const { error: botMsgErr } = await supabase.from('bot_messages').insert({
        session_id: activeSession.id,
        sender: 'bot',
        content: resJson.reply,
        translation: resJson.translation,
        suggestions: resJson.suggestions,
        grammar_correction: resJson.grammar_correction,
        hiragana: JSON.stringify(resJson.furigana),
      })
      if (botMsgErr) throw botMsgErr

      await supabase
        .from('bot_sessions')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', activeSession.id)

      await loadChatData(activeSession.id)

      if (autoSpeak) {
        speakBotReply(resJson.reply, activeSession.language)
      }
    } catch (err: any) {
      console.error('Error sending audio message:', err)
      Alert.alert('Lỗi', `Gửi giọng nói thất bại: ${err.message}`)
      loadChatData(activeSession.id)
    } finally {
      setSending(false)
    }
  }

  const renderMessageItem = ({ item }: { item: any }) => {
    const isBot = item.sender === 'bot'
    const hasCorrection = item.grammar_correction && item.grammar_correction.corrected

    let furiganaSegments = null
    if (isBot && item.hiragana) {
      try {
        const parsed = JSON.parse(item.hiragana)
        if (Array.isArray(parsed)) {
          furiganaSegments = parsed
        }
      } catch (_) { }
    }

    return (
      <View style={[styles.messageRow, isBot ? styles.botRow : styles.userRow]}>
        <View
          style={[
            styles.bubble,
            isBot
              ? [styles.botBubble, { backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)', borderColor: colors.borderGlass }]
              : [styles.userBubble, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)', borderColor: colors.borderGlassHeavy, borderWidth: 1 }],
          ]}
        >
          {isBot && furiganaEnabled && furiganaSegments ? (
            <View style={styles.furiganaContainer}>
              {furiganaSegments.map((seg: any, idx: number) => (
                <View key={idx} style={styles.furiganaSegmentCol}>
                  {seg.ruby ? (
                    <Text style={[styles.furiganaRubyText, { color: isDark ? '#38bdf8' : '#0284c7' }]}>
                      {seg.ruby}
                    </Text>
                  ) : (
                    <Text style={[styles.furiganaRubyText, { color: 'transparent' }]}>
                      {" "}
                    </Text>
                  )}
                  <Text style={[styles.furiganaBaseText, { color: colors.textActive }]}>
                    {seg.text}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={[styles.messageText, { color: colors.textActive }]}>
              {item.content}
            </Text>
          )}

          {/* Bot specific features: Loa phát âm & Dịch câu thoại */}
          {isBot && (
            <View style={styles.botAddonsRow}>
              <TouchableOpacity
                style={styles.addonActionBtn}
                onPress={() => handleSpeakMessage(item.id, item.content, activeSession.language)}
              >
                <Volume2 size={12} color={speakingId === item.id ? (isDark ? '#38bdf8' : '#0284c7') : colors.textInactive} />
                <Text style={[styles.addonActionText, { color: speakingId === item.id ? (isDark ? '#38bdf8' : '#0284c7') : colors.textInactive }]}>
                  {speakingId === item.id ? 'Dừng phát' : 'Phát âm'}
                </Text>
              </TouchableOpacity>

              {item.translation && (
                visibleTranslationId === item.id ? (
                  <TouchableOpacity
                    style={styles.addonActionBtn}
                    onPress={() => setVisibleTranslationId(null)}
                  >
                    <EyeOff size={12} color={colors.textMuted} />
                    <Text style={[styles.addonActionText, { color: colors.textMuted }]}>Ẩn dịch</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.addonActionBtn}
                    onPress={() => setVisibleTranslationId(item.id)}
                  >
                    <Eye size={12} color={isDark ? '#38bdf8' : '#0284c7'} />
                    <Text style={[styles.addonActionText, { color: isDark ? '#38bdf8' : '#0284c7' }]}>Xem dịch</Text>
                  </TouchableOpacity>
                )
              )}
            </View>
          )}

          {isBot && visibleTranslationId === item.id && item.translation && (
            <View style={[styles.translationBox, { borderTopColor: colors.borderGlass }]}>
              <Text style={[styles.translationText, { color: colors.textSubtle }]}>
                {item.translation}
              </Text>
            </View>
          )}

          {/* User specific features: Grammar warnings or audio playback */}
          {!isBot && (hasCorrection || item.audio_path) && (
            <View style={styles.botAddonsRow}>
              {item.audio_path && (
                <TouchableOpacity
                  style={styles.addonActionBtn}
                  onPress={() => handlePlayUserAudio(item.id, item.audio_path)}
                >
                  <Volume2 size={12} color={speakingId === item.id ? (isDark ? '#38bdf8' : '#0284c7') : colors.textInactive} />
                  <Text style={[styles.addonActionText, { color: speakingId === item.id ? (isDark ? '#38bdf8' : '#0284c7') : colors.textInactive }]}>
                    {speakingId === item.id ? 'Dừng phát' : 'Nghe lại'}
                  </Text>
                </TouchableOpacity>
              )}

              {hasCorrection && (
                <TouchableOpacity
                  style={styles.addonActionBtn}
                  onPress={() => setSelectedCorrection(item.grammar_correction)}
                >
                  <AlertCircle size={12} color={isDark ? '#f43f5e' : '#e11d48'} />
                  <Text style={[styles.addonActionText, { color: isDark ? '#f43f5e' : '#e11d48' }]}>Sửa ngữ pháp</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </View>
    )
  }

  if (loading) {
    return (
      <View style={[styles.centerState, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={isDark ? '#38bdf8' : '#0284c7'} />
        <Text style={[styles.loadingText, { color: colors.textMuted, marginTop: 12 }]}>Đang tải cuộc hội thoại...</Text>
      </View>
    )
  }

  return (
    <View style={[globalStyles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.chatHeader, { paddingTop: insets.top + 8, borderBottomColor: colors.borderGlass }]}>
        <TouchableOpacity
          style={[styles.iconButton, { marginRight: 12 }]}
          onPress={() => {
            Speech.stop()
            router.back()
          }}
        >
          <ArrowLeft size={20} color={colors.textActive} />
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <Text style={[styles.chatHeaderTitle, { color: colors.textActive }]} numberOfLines={1}>
            {activeSession?.scenario_title}
          </Text>
          <Text style={[styles.chatHeaderSubtitle, { color: colors.textMuted }]}>
            {activeSession?.language === 'Japanese' ? '🇯🇵 Tiếng Nhật' : activeSession?.language === 'English' ? '🇺🇸 Tiếng Anh' : activeSession?.language === 'Korean' ? '🇰🇷 Tiếng Hàn' : '🇨🇳 Tiếng Trung'}
          </Text>
        </View>

        {activeSession?.language === 'Japanese' && (
          <TouchableOpacity
            style={[
              styles.furiganaToggleBtn,
              {
                borderColor: colors.borderGlass,
                backgroundColor: furiganaEnabled ? (isDark ? 'rgba(56,189,248,0.15)' : 'rgba(2,132,199,0.08)') : 'transparent',
                marginRight: 8
              }
            ]}
            onPress={() => setFuriganaEnabled(!furiganaEnabled)}
          >
            <Text style={[styles.furiganaToggleText, { color: furiganaEnabled ? (isDark ? '#38bdf8' : '#0284c7') : colors.textInactive }]}>
              あ
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.iconButton, { marginRight: 8 }]}
          onPress={() => setShowVoiceModal(true)}
        >
          <Settings size={18} color={colors.textActive} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => {
            const next = !autoSpeak
            setAutoSpeak(next)
            if (!next) Speech.stop()
          }}
        >
          {autoSpeak ? (
            <Volume2 size={20} color={isDark ? '#38bdf8' : '#0284c7'} />
          ) : (
            <VolumeX size={20} color={colors.textInactive} />
          )}
        </TouchableOpacity>
      </View>

      {/* Message List */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={item => item.id}
        renderItem={renderMessageItem}
        contentContainerStyle={styles.chatScroll}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={
          sending ? (
            <View style={[styles.messageRow, styles.botRow]}>
              <View style={[styles.bubble, styles.botBubble, styles.typingIndicatorBubble, { backgroundColor: isDark ? '#1a1a24' : '#ffffff', borderColor: colors.borderGlass }]}>
                <ActivityIndicator size="small" color={colors.textMuted} />
                <Text style={[styles.typingText, { color: colors.textMuted }]}>Bot đang soạn câu trả lời...</Text>
              </View>
            </View>
          ) : null
        }
      />

      {/* Quick suggestions area */}
      {!sending && messages.length > 0 && messages[messages.length - 1].sender === 'bot' && messages[messages.length - 1].suggestions && (
        <View style={styles.suggestionsContainer}>
          <Text style={[styles.suggestionsLabel, { color: colors.textMuted }]}>💡 Gợi ý trả lời tiếp theo:</Text>
          <FlatList
            horizontal
            data={messages[messages.length - 1].suggestions}
            keyExtractor={(item, index) => index.toString()}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.suggestionsScroll}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.suggestionChip,
                  {
                    backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                    borderColor: colors.borderGlass,
                    borderWidth: 1
                  }
                ]}
                onPress={() => handleSendMessage(item)}
              >
                <Text style={[styles.suggestionChipText, { color: colors.textActive }]}>{item}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {translatedText ? (
          <TouchableOpacity
            style={[
              styles.translationTooltip,
              {
                backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
                borderColor: colors.borderGlass,
                borderBottomWidth: 1,
              }
            ]}
            onPress={() => {
              const txt = translatedText
              setTranslatedText('')
              setTranslatedReading('')
              setInputText('')
              handleSendMessage(txt)
            }}
          >
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 10, color: colors.textMuted, marginBottom: 2 }}>
                Dịch:
              </Text>
              <Text style={{ fontSize: 13, color: colors.textActive, fontWeight: '700' }}>
                {translatedText}
              </Text>
              {translatedReading ? (
                <Text style={{ fontSize: 10, color: colors.textMuted, marginTop: 2 }}>
                  {translatedReading}
                </Text>
              ) : null}
            </View>
            <View style={[styles.tooltipSendIcon, { backgroundColor: isDark ? 'rgba(56,189,248,0.2)' : 'rgba(2,132,199,0.1)' }]}>
              <Send size={12} color={isDark ? '#38bdf8' : '#0284c7'} />
            </View>
          </TouchableOpacity>
        ) : null}

        <View style={[styles.chatInputContainer, { paddingBottom: insets.bottom + 12, borderTopColor: colors.borderGlass }]}>
          <TouchableOpacity
            style={[
              styles.sendBtn,
              {
                backgroundColor: translating ? (isDark ? 'rgba(56,189,248,0.2)' : 'rgba(2,132,199,0.1)') : (isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'),
                borderColor: translating ? (isDark ? '#38bdf8' : '#0284c7') : colors.borderGlass,
                borderWidth: 1
              }
            ]}
            onPress={handleTranslateInputText}
            disabled={isRecording || sending || translating || !inputText.trim()}
          >
            {translating ? (
              <ActivityIndicator size="small" color={isDark ? '#38bdf8' : '#0284c7'} />
            ) : (
              <Languages size={16} color={inputText.trim() ? colors.textActive : colors.textInactive} />
            )}
          </TouchableOpacity>

          <TextInput
            style={[
              styles.chatTextInput,
              {
                color: colors.textActive,
                backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
                borderColor: colors.borderGlass,
              },
            ]}
            placeholder={isRecording ? "Đang ghi âm giọng nói..." : "Nhập tin nhắn..."}
            placeholderTextColor={colors.textMuted}
            value={inputText}
            onChangeText={(text) => {
              setInputText(text)
              if (translatedText) {
                setTranslatedText('')
                setTranslatedReading('')
              }
            }}
            multiline
            maxLength={400}
            editable={!isRecording && !sending && !translating}
          />

          {!inputText.trim() ? (
            <TouchableOpacity
              style={[
                styles.sendBtn,
                {
                  backgroundColor: isRecording ? 'rgba(239, 68, 68, 0.15)' : (isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)'),
                  borderColor: isRecording ? colors.accentRed : colors.borderGlass,
                  borderWidth: 1,
                }
              ]}
              onPress={isRecording ? stopRecording : startRecording}
              disabled={sending}
            >
              <Mic size={16} color={isRecording ? colors.accentRed : colors.textActive} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[
                styles.sendBtn,
                {
                  backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                  borderColor: colors.borderGlass,
                  borderWidth: 1
                }
              ]}
              onPress={() => handleSendMessage(inputText)}
              disabled={sending}
            >
              <Send size={16} color={colors.textActive} />
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>

      {/* Modal: Grammar Correction Detail */}
      <Modal visible={!!selectedCorrection} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={() => setSelectedCorrection(null)}>
            <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFillObject} />
          </TouchableOpacity>

          <View style={[styles.modalBox, { backgroundColor: isDark ? '#1a1a24' : '#ffffff', borderColor: colors.borderGlass }]}>
            <View style={styles.modalHeader}>
              <AlertCircle size={20} color={isDark ? '#38bdf8' : '#0284c7'} style={{ marginRight: 8 }} />
              <Text style={[styles.modalTitle, { color: colors.textActive }]}>Phân tích ngữ pháp</Text>
            </View>

            {selectedCorrection && (
              <View style={styles.modalBody}>
                <Text style={[styles.bodyLabel, { color: colors.textMuted }]}>Khuyên dùng sửa lại:</Text>
                <View style={[styles.correctedBox, { backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : '#f9f9f9', borderColor: colors.borderGlass }]}>
                  <Text style={[styles.correctedValue, { color: isDark ? '#38bdf8' : '#0284c7' }]}>
                    {selectedCorrection.corrected}
                  </Text>
                </View>

                <Text style={[styles.bodyLabel, { color: colors.textMuted, marginTop: 16 }]}>Giải thích từ Bot:</Text>
                <Text style={[styles.explanationText, { color: colors.textSubtle }]}>
                  {selectedCorrection.explanation}
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={[
                styles.modalCloseBtn,
                {
                  backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                  borderColor: colors.borderGlass,
                  borderWidth: 1
                }
              ]}
              onPress={() => setSelectedCorrection(null)}
            >
              <Text style={[styles.modalCloseText, { color: colors.textActive }]}>Đóng</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal: Voice Selector */}
      <Modal visible={showVoiceModal} transparent animationType="fade" onRequestClose={() => setShowVoiceModal(false)}>
        <View style={styles.modalBackdrop}>
          <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={() => setShowVoiceModal(false)}>
            <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFillObject} />
          </TouchableOpacity>

          <View style={[styles.modalBox, { backgroundColor: isDark ? '#1a1a24' : '#ffffff', borderColor: colors.borderGlass }]}>
            <View style={styles.modalHeader}>
              <Settings size={20} color={isDark ? '#38bdf8' : '#0284c7'} style={{ marginRight: 8 }} />
              <Text style={[styles.modalTitle, { color: colors.textActive }]}>Chọn giọng nói trợ lý</Text>
            </View>

            <View style={{ maxHeight: 250, marginVertical: 12 }}>
              <FlatList
                data={availableVoices}
                keyExtractor={item => item.identifier}
                ListEmptyComponent={
                  <Text style={{ textAlign: 'center', color: colors.textMuted, fontSize: 13, marginVertical: 20 }}>
                    Sử dụng giọng mặc định hệ thống
                  </Text>
                }
                renderItem={({ item }) => {
                  const isSelected = selectedVoice === item.identifier
                  return (
                    <TouchableOpacity
                      style={[
                        styles.voiceItem,
                        { borderColor: colors.borderGlass },
                        isSelected && { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)', borderColor: colors.textActive }
                      ]}
                      onPress={() => {
                        setSelectedVoice(item.identifier)
                        setShowVoiceModal(false)
                      }}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.voiceItemText, { color: colors.textActive }, isSelected && { fontWeight: '700' }]}>
                          {item.name || `Giọng nói (${item.language})`}
                        </Text>
                        <Text style={{ fontSize: 10, color: colors.textMuted, marginTop: 2 }}>
                          {item.quality === 'Enhanced' ? '✨ Chất lượng cao' : 'Tiêu chuẩn'}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  )
                }}
              />
            </View>

            <TouchableOpacity
              style={[
                styles.modalCloseBtn,
                {
                  backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                  borderColor: colors.borderGlass,
                  borderWidth: 1,
                  marginTop: 8
                }
              ]}
              onPress={() => setShowVoiceModal(false)}
            >
              <Text style={[styles.modalCloseText, { color: colors.textActive }]}>Đóng</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>


    </View>
  )
}

const styles = StyleSheet.create({
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  chatHeaderTitle: {
    fontFamily: 'System',
    fontSize: 16,
    fontWeight: '700',
  },
  chatHeaderSubtitle: {
    fontFamily: 'System',
    fontSize: 11,
    marginTop: 1,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatScroll: {
    padding: 16,
    paddingBottom: 24,
    gap: 14,
  },
  messageRow: {
    flexDirection: 'row',
    width: '100%',
  },
  botRow: {
    justifyContent: 'flex-start',
  },
  userRow: {
    justifyContent: 'flex-end',
  },
  bubble: {
    maxWidth: '85%',
    padding: 12,
    borderRadius: 18,
  },
  botBubble: {
    borderBottomLeftRadius: 4,
    borderWidth: 1,
  },
  userBubble: {
    borderBottomRightRadius: 4,
  },
  messageText: {
    fontFamily: 'System',
    fontSize: 14,
    lineHeight: 19,
  },
  botAddonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 8,
  },
  addonActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addonActionText: {
    fontFamily: 'System',
    fontSize: 11,
    fontWeight: '600',
  },
  translationBox: {
    borderTopWidth: 1,
    paddingTop: 8,
    marginTop: 8,
  },
  translationText: {
    fontFamily: 'System',
    fontSize: 12,
    lineHeight: 17,
    fontStyle: 'italic',
    marginBottom: 6,
  },
  correctionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  correctionBadgeText: {
    fontFamily: 'System',
    fontSize: 10,
    fontWeight: '700',
    color: '#ffffff',
  },
  typingIndicatorBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  typingText: {
    fontFamily: 'System',
    fontSize: 12,
    fontStyle: 'italic',
  },
  centerState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: 'System',
    fontSize: 13,
  },
  suggestionsContainer: {
    paddingVertical: 8,
    backgroundColor: 'transparent',
  },
  suggestionsLabel: {
    fontFamily: 'System',
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 16,
    marginBottom: 6,
  },
  suggestionsScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  suggestionChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  suggestionChipText: {
    fontFamily: 'System',
    fontSize: 12,
    fontWeight: '600',
  },
  chatInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    borderTopWidth: 1,
    gap: 10,
  },
  chatTextInput: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 14,
    maxHeight: 80,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalBox: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 18,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontFamily: 'System',
    fontSize: 16,
    fontWeight: '700',
  },
  modalBody: {
    marginBottom: 20,
  },
  bodyLabel: {
    fontFamily: 'System',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 6,
  },
  correctedBox: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  correctedValue: {
    fontFamily: 'System',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  explanationText: {
    fontFamily: 'System',
    fontSize: 13,
    lineHeight: 18,
  },
  modalCloseBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 16,
  },
  modalCloseText: {
    fontFamily: 'System',
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  voiceItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  voiceItemText: {
    fontFamily: 'System',
    fontSize: 13,
  },
  furiganaToggleBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  furiganaToggleText: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'System',
  },
  furiganaContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-end',
  },
  furiganaSegmentCol: {
    flexDirection: 'column',
    alignItems: 'center',
    paddingHorizontal: 1,
  },
  furiganaRubyText: {
    fontFamily: 'System',
    fontSize: 9,
    fontWeight: '600',
    marginBottom: 1,
  },
  furiganaBaseText: {
    fontFamily: 'System',
    fontSize: 14,
    lineHeight: 18,
  },
  translationTooltip: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tooltipSendIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
})
