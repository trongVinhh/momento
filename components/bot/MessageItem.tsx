import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native'
import { Volume2, Eye, EyeOff, AlertCircle } from 'lucide-react-native'

interface MessageItemProps {
  item: {
    id: string
    sender: 'user' | 'bot'
    content: string
    translation?: string
    suggestions?: string[]
    grammar_correction?: {
      corrected: string
      explanation: string
    } | null
    audio_path?: string | null
    hiragana?: string | null
  }
  language: string
  isDark: boolean
  colors: any
  furiganaEnabled: boolean
  speakingId: string | null
  visibleTranslationId: string | null
  onSpeakMessage: (msgId: string, content: string, language: string) => void
  onPlayUserAudio: (msgId: string, audioPath: string) => void
  onToggleTranslation: (msgId: string | null) => void
  onSelectCorrection: (correction: any) => void
}

export default function MessageItem({
  item,
  language,
  isDark,
  colors,
  furiganaEnabled,
  speakingId,
  visibleTranslationId,
  onSpeakMessage,
  onPlayUserAudio,
  onToggleTranslation,
  onSelectCorrection,
}: MessageItemProps) {
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

        {/* Bot specific features: Volume & translation toggle */}
        {isBot && (
          <View style={styles.botAddonsRow}>
            <TouchableOpacity
              style={styles.addonActionBtn}
              onPress={() => onSpeakMessage(item.id, item.content, language)}
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
                  onPress={() => onToggleTranslation(null)}
                >
                  <EyeOff size={12} color={colors.textMuted} />
                  <Text style={[styles.addonActionText, { color: colors.textMuted }]}>Ẩn dịch</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.addonActionBtn}
                  onPress={() => onToggleTranslation(item.id)}
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
                onPress={() => onPlayUserAudio(item.id, item.audio_path!)}
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
                onPress={() => onSelectCorrection(item.grammar_correction)}
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

const styles = StyleSheet.create({
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
    fontSize: 11,
    fontWeight: '600',
  },
  translationBox: {
    borderTopWidth: 1,
    paddingTop: 8,
    marginTop: 8,
  },
  translationText: {
    fontSize: 12,
    lineHeight: 17,
    fontStyle: 'italic',
    marginBottom: 6,
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
    fontSize: 9,
    fontWeight: '600',
    marginBottom: 1,
  },
  furiganaBaseText: {
    fontSize: 14,
    lineHeight: 18,
  },
})
