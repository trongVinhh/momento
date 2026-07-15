import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native'
import { BlurView } from 'expo-blur'
import { useRouter } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { Camera, Send, FileText, ArrowLeft, MapPin, Compass, ChevronDown } from 'lucide-react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useCreateDestination } from '../hooks/useCreateDestination'
import { COLORS, GLASS_STYLES } from '../constants/theme'
import { globalStyles } from '../styles/globalStyles'
import { POPULAR_COUNTRIES } from '../constants/mockData'

export default function CreateDestinationScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const [pickerVisible, setPickerVisible] = useState(false)

  const {
    name,
    setName,
    description,
    setDescription,
    country,
    setCountry,
    imageUri,
    pickImage,
    loading,
    handleSaveDestination,
  } = useCreateDestination()

  return (
    <View style={globalStyles.container}>
      <StatusBar style="light" translucent />

      {/* Header */}
      <BlurView
        intensity={Platform.OS === 'android' ? 40 : GLASS_STYLES.headerIntensity}
        tint={COLORS.tintDark}
        style={[globalStyles.headerBase, { paddingTop: insets.top + 12 }]}
      >
        <TouchableOpacity style={styles.glassRoundBtn} onPress={() => router.back()}>
          <ArrowLeft size={20} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Địa Điểm Mới</Text>
        <View style={{ width: 40 }} />
      </BlurView>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={globalStyles.scrollBase}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + 76, paddingBottom: insets.bottom + 40 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Ảnh bìa */}
          <TouchableOpacity
            style={styles.imagePlaceholder}
            activeOpacity={0.8}
            onPress={pickImage}
          >
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.previewImage} />
            ) : (
              <View style={styles.placeholderContent}>
                <View style={styles.cameraCircle}>
                  <Camera size={28} color={COLORS.textInactive} />
                </View>
                <Text style={styles.placeholderTitle}>Chọn ảnh bìa địa điểm</Text>
                <Text style={styles.placeholderSub}>Tỷ lệ 16:9 được khuyên dùng</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Form */}
          <View style={styles.form}>
            {/* Destination Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Tên địa điểm</Text>
              <View style={styles.inputWrapper}>
                <MapPin size={16} color={COLORS.textMuted} style={styles.icon} />
                <TextInput
                  placeholder="Ví dụ: Đà Nẵng, Hội An, Huế..."
                  placeholderTextColor={COLORS.textMuted}
                  value={name}
                  onChangeText={setName}
                  style={styles.input}
                />
              </View>
            </View>

            {/* Country (Chọn thay vì nhập tay) */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Quốc gia</Text>
              <TouchableOpacity
                style={styles.inputWrapper}
                activeOpacity={0.8}
                onPress={() => setPickerVisible(true)}
              >
                <Compass size={16} color={COLORS.textMuted} style={styles.icon} />
                <Text style={[styles.inputText, !country && { color: COLORS.textMuted }]}>
                  {country || 'Chọn quốc gia...'}
                </Text>
                <ChevronDown size={16} color={COLORS.textMuted} style={styles.rightIcon} />
              </TouchableOpacity>
            </View>

            {/* Modal bộ chọn Quốc gia */}
            <Modal
              visible={pickerVisible}
              transparent
              animationType="fade"
              onRequestClose={() => setPickerVisible(false)}
            >
              <TouchableOpacity
                style={styles.modalOverlay}
                activeOpacity={1}
                onPress={() => setPickerVisible(false)}
              >
                <BlurView
                  intensity={Platform.OS === 'android' ? 40 : 25}
                  tint="dark"
                  style={styles.modalContent}
                >
                  <View style={styles.modalInnerBorder} />
                  <Text style={styles.modalTitle}>Chọn Quốc Gia</Text>
                  
                  <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                    {POPULAR_COUNTRIES.map((item) => (
                      <TouchableOpacity
                        key={item}
                        style={[
                          styles.modalItem,
                          country === item && styles.modalItemActive,
                        ]}
                        onPress={() => {
                          setCountry(item)
                          setPickerVisible(false)
                        }}
                      >
                        <Text
                          style={[
                            styles.modalItemText,
                            country === item && styles.modalItemTextActive,
                          ]}
                        >
                          {item}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </BlurView>
              </TouchableOpacity>
            </Modal>

            {/* Description */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Mô tả (tuỳ chọn)</Text>
              <View style={styles.inputWrapper}>
                <FileText size={16} color={COLORS.textMuted} style={styles.icon} />
                <TextInput
                  placeholder="Cảm nhận của bạn về địa điểm này..."
                  placeholderTextColor={COLORS.textMuted}
                  value={description}
                  onChangeText={setDescription}
                  style={styles.input}
                />
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={styles.submitBtn}
              activeOpacity={0.8}
              onPress={handleSaveDestination}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <View style={styles.btnContent}>
                  <Send size={18} color={COLORS.white} />
                  <Text style={styles.submitBtnText}>Tạo Địa Điểm</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  )
}

const styles = StyleSheet.create({
  glassRoundBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: 'System',
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.white,
  },
  scrollContent: {
    paddingHorizontal: 20,
    gap: 20,
  },
  imagePlaceholder: {
    width: '100%',
    height: 200,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  placeholderContent: {
    alignItems: 'center',
    gap: 10,
  },
  cameraCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderTitle: {
    fontFamily: 'System',
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textInactive,
  },
  placeholderSub: {
    fontFamily: 'System',
    fontSize: 11,
    color: COLORS.textMuted,
  },
  form: {
    gap: 18,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontFamily: 'System',
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
    paddingLeft: 2,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    height: 52,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  icon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: COLORS.white,
    fontSize: 14,
    fontFamily: 'System',
  },
  submitBtn: {
    backgroundColor: 'rgba(59, 130, 246, 0.75)',
    borderRadius: 12,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  btnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  submitBtnText: {
    fontFamily: 'System',
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.white,
  },
  inputText: {
    flex: 1,
    color: COLORS.white,
    fontSize: 14,
    fontFamily: 'System',
  },
  rightIcon: {
    marginLeft: 'auto',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    maxHeight: '70%',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
    backgroundColor: 'rgba(20, 20, 25, 0.85)',
  },
  modalInnerBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    pointerEvents: 'none',
  },
  modalTitle: {
    fontFamily: 'System',
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 16,
    textAlign: 'center',
  },
  modalScroll: {
    width: '100%',
  },
  modalItem: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.02)',
  },
  modalItemActive: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  modalItemText: {
    fontFamily: 'System',
    fontSize: 14,
    color: COLORS.textInactive,
  },
  modalItemTextActive: {
    color: '#3b82f6',
    fontWeight: '600',
  },
})
