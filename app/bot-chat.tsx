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
import {
  MessageItem,
  QuickSuggestions,
  VoiceSelectorModal,
  GrammarCorrectionModal,
} from '../components/bot'
import { useBotChat } from '../hooks/useBotChat'

export default function BotChatScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { colors, isDark } = useTheme()
  const { locale } = useTranslation()
  const { sessionId } = useLocalSearchParams()

  const flatListRef = useRef<FlatList | null>(null)

  const {
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
  } = useBotChat(sessionId as string, flatListRef)

  const renderMessageItem = ({ item }: { item: any }) => {
    return (
      <MessageItem
        item={item}
        language={activeSession?.language || ''}
        isDark={isDark}
        colors={colors}
        furiganaEnabled={furiganaEnabled}
        speakingId={speakingId}
        visibleTranslationId={visibleTranslationId}
        onSpeakMessage={handleSpeakMessage}
        onPlayUserAudio={handlePlayUserAudio}
        onToggleTranslation={setVisibleTranslationId}
        onSelectCorrection={setSelectedCorrection}
      />
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
      {!sending && messages.length > 0 && messages[messages.length - 1].sender === 'bot' && (
        <QuickSuggestions
          suggestions={messages[messages.length - 1].suggestions || []}
          onSelectSuggestion={handleSendMessage}
          colors={colors}
          isDark={isDark}
        />
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
      <GrammarCorrectionModal
        visible={!!selectedCorrection}
        onClose={() => setSelectedCorrection(null)}
        selectedCorrection={selectedCorrection}
        colors={colors}
        isDark={isDark}
      />

      {/* Modal: Voice Selector */}
      <VoiceSelectorModal
        visible={showVoiceModal}
        onClose={() => setShowVoiceModal(false)}
        availableVoices={availableVoices}
        selectedVoice={selectedVoice}
        onSelectVoice={setSelectedVoice}
        colors={colors}
        isDark={isDark}
      />


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
  bubble: {
    maxWidth: '85%',
    padding: 12,
    borderRadius: 18,
  },
  botBubble: {
    borderBottomLeftRadius: 4,
    borderWidth: 1,
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
