import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from 'react-native'
import { BlurView } from 'expo-blur'
import { AlertCircle } from 'lucide-react-native'

interface GrammarCorrectionModalProps {
  visible: boolean
  onClose: () => void
  selectedCorrection: {
    corrected: string
    explanation: string
  } | null
  colors: any
  isDark: boolean
}

export default function GrammarCorrectionModal({
  visible,
  onClose,
  selectedCorrection,
  colors,
  isDark,
}: GrammarCorrectionModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={onClose}>
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
  modalBody: {
    marginBottom: 20,
  },
  bodyLabel: {
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
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  explanationText: {
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
    fontSize: 14,
    fontWeight: '700',
  },
})
