import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
} from 'react-native'
import { BlurView } from 'expo-blur'
import { Settings } from 'lucide-react-native'
import * as Speech from 'expo-speech'

interface VoiceSelectorModalProps {
  visible: boolean
  onClose: () => void
  availableVoices: Speech.Voice[]
  selectedVoice: string | null
  onSelectVoice: (voiceId: string) => void
  colors: any
  isDark: boolean
}

export default function VoiceSelectorModal({
  visible,
  onClose,
  availableVoices,
  selectedVoice,
  onSelectVoice,
  colors,
  isDark,
}: VoiceSelectorModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={onClose}>
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
                      onSelectVoice(item.identifier)
                      onClose()
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
            onPress={onClose}
          >
            <Text style={[styles.modalCloseText, { color: colors.textActive }]}>Đóng</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
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
    fontSize: 16,
    fontWeight: '700',
  },
  modalCloseBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 16,
  },
  modalCloseText: {
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
    fontSize: 13,
  },
})
