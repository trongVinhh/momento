import { useState, useEffect, useRef, useCallback } from 'react'
import { Alert, FlatList } from 'react-native'
import * as Speech from 'expo-speech'
import { Audio } from 'expo-av'
import * as FileSystem from 'expo-file-system/legacy'
import { supabase } from '../lib/supabase'

export function useBotChat(sessionId: string, flatListRef?: React.RefObject<FlatList | null>) {
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

  const activeSoundRef = useRef<Audio.Sound | null>(null)

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

  const getSpeechLanguageCode = (lang: string) => {
    if (lang === 'Japanese') return 'ja-JP'
    if (lang === 'English') return 'en-US'
    if (lang === 'Korean') return 'ko-KR'
    if (lang === 'Chinese') return 'zh-CN'
    return 'ja-JP'
  }

  const speakBotReply = useCallback((text: string, language: string) => {
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
  }, [selectedVoice])

  const handleSpeakMessage = (messageId: string, text: string, language: string) => {
    if (speakingId === messageId) {
      Speech.stop()
      setSpeakingId(null)
    } else {
      setSpeakingId(messageId)
      speakBotReply(text, language)
    }
  }

  const loadChatData = useCallback(async (sid: string, isInitial = false) => {
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
          const { data: resJson, error: fnErr } = await supabase.functions.invoke('momento-ai-proxy', {
            body: {
              message: botGreetingPrompt,
              history: [],
              language: sessionData.language,
              scenario_prompt: sessionData.scenario_prompt,
              level: sessionData.level,
            }
          })
          if (fnErr) throw fnErr

          const { data: insertedMsg, error: insertErr } = await supabase
            .from('bot_messages')
            .insert({
              session_id: sid,
              sender: 'bot',
              content: resJson.reply,
              translation: resJson.translation,
              suggestions: resJson.suggestions,
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
        setTimeout(() => flatListRef?.current?.scrollToEnd({ animated: false }), 200)
      }
    } catch (err: any) {
      console.error('Error loading chat:', err)
      Alert.alert('Lỗi', 'Không thể tải cuộc hội thoại.')
    } finally {
      if (isInitial) setLoading(false)
    }
  }, [autoSpeak, speakBotReply, flatListRef])

  // Load session and messages on mount
  useEffect(() => {
    if (sessionId) {
      loadChatData(sessionId, true)
    }
  }, [sessionId, loadChatData])

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
    setTimeout(() => flatListRef?.current?.scrollToEnd({ animated: true }), 100)

    try {
      // 1. Call Supabase Function Proxy first to get reply & grammar correction
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

      // 2. Save user message to database (including grammar correction if it exists)
      const { error: userMsgErr } = await supabase.from('bot_messages').insert({
        session_id: activeSession.id,
        sender: 'user',
        content: textToSend.trim(),
        grammar_correction: resJson.grammar_correction || null,
      })
      if (userMsgErr) throw userMsgErr

      // 3. Save Bot message response
      const { error: botMsgErr } = await supabase.from('bot_messages').insert({
        session_id: activeSession.id,
        sender: 'bot',
        content: resJson.reply,
        translation: resJson.translation,
        suggestions: resJson.suggestions,
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
    setTimeout(() => flatListRef?.current?.scrollToEnd({ animated: true }), 100)

    try {
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
        grammar_correction: resJson.grammar_correction,
      })
      if (userMsgErr) throw userMsgErr

      // Save Bot message response
      const { error: botMsgErr } = await supabase.from('bot_messages').insert({
        session_id: activeSession.id,
        sender: 'bot',
        content: resJson.reply,
        translation: resJson.translation,
        suggestions: resJson.suggestions,
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

  const handleTranslateInputText = async () => {
    if (!inputText.trim() || !activeSession) return
    setTranslating(true)
    setTranslatedText('')
    setTranslatedReading('')
    try {
      const { data: resJson, error: fnErr } = await supabase.functions.invoke('momento-ai-proxy', {
        body: {
          action: 'translate_idea',
          vietnamese_idea: inputText,
          language: activeSession.language,
          scenario_prompt: activeSession.scenario_prompt,
          level: activeSession.level,
        }
      })
      if (fnErr) throw fnErr
      setTranslatedText(resJson.translation || '')
      setTranslatedReading(resJson.reading || '')
    } catch (err: any) {
      console.error('Error translating input:', err)
      Alert.alert('Lỗi', `Không thể dịch: ${err.message}`)
    } finally {
      setTranslating(false)
    }
  }

  // Audio Recording Options & Methods
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

  return {
    activeSession,
    messages,
    loading,
    sending,
    inputText,
    setInputText,
    visibleTranslationId,
    setVisibleTranslationId,
    selectedCorrection,
    setSelectedCorrection,
    isRecording,
    autoSpeak,
    setAutoSpeak,
    speakingId,
    availableVoices,
    selectedVoice,
    setSelectedVoice,
    showVoiceModal,
    setShowVoiceModal,
    furiganaEnabled,
    setFuriganaEnabled,
    translatedText,
    setTranslatedText,
    translatedReading,
    setTranslatedReading,
    translating,
    handleSendMessage,
    handleSpeakMessage,
    handlePlayUserAudio,
    handleTranslateInputText,
    startRecording,
    stopRecording,
  }
}
