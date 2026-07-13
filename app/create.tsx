import React from 'react'
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
} from 'react-native'
import { BlurView } from 'expo-blur'
import { useRouter } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { Camera, MapPin, Type, Save, ArrowLeft } from 'lucide-react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useCreateMoment } from '../hooks/useCreateMoment'
import { COLORS, GLASS_STYLES } from '../constants/theme'
import { globalStyles } from '../styles/globalStyles'

const DESTINATIONS = [
  { id: 'tokyo', label: 'Tokyo' },
  { id: 'seoul', label: 'Seoul' },
  { id: 'bali', label: 'Bali' },
  { id: 'rome', label: 'Rome' },
]

export default function CreateMomentScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()

  const {
    title,
    setTitle,
    description,
    setDescription,
    locationName,
    setLocationName,
    selectedDest,
    setSelectedDest,
    imageUri,
    pickImage,
    loading,
    handleSaveMoment,
  } = useCreateMoment()

  return (
    <View style={globalStyles.container}>
      <StatusBar style="light" translucent />

      {/* Header */}
      <BlurView
        intensity={Platform.OS === 'android' ? 40 : GLASS_STYLES.headerIntensity}
        tint={COLORS.tintDark}
        style={[globalStyles.headerBase, { paddingTop: insets.top + 12 }]}
      >
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={20} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Moment</Text>
        <View style={{ width: 40 }} />
      </BlurView>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={globalStyles.scrollBase}
          contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 76, paddingBottom: insets.bottom + 40 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Image Upload Area */}
          <TouchableOpacity
            style={styles.imagePlaceholder}
            activeOpacity={0.8}
            onPress={pickImage}
          >
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.previewImage} />
            ) : (
              <View style={styles.placeholderContent}>
                <Camera size={32} color={COLORS.textInactive} />
                <Text style={styles.placeholderText}>Chọn ảnh từ thư viện điện thoại</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Form Fields */}
          <View style={styles.form}>
            {/* Title */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Tiêu đề khoảnh khắc</Text>
              <View style={styles.inputWrapper}>
                <Type size={16} color={COLORS.textMuted} style={styles.icon} />
                <TextInput
                  placeholder="Ví dụ: Hoàng hôn rực rỡ ở đền thờ..."
                  placeholderTextColor={COLORS.textMuted}
                  value={title}
                  onChangeText={setTitle}
                  style={styles.input}
                />
              </View>
            </View>

            {/* Destination Selector */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Chọn địa điểm lớn</Text>
              <View style={styles.destRow}>
                {DESTINATIONS.map((dest) => (
                  <TouchableOpacity
                    key={dest.id}
                    style={[
                      styles.destPill,
                      selectedDest === dest.id && styles.destPillActive,
                    ]}
                    onPress={() => setSelectedDest(dest.id)}
                  >
                    <Text
                      style={[
                        styles.destPillText,
                        selectedDest === dest.id && styles.destPillTextActive,
                      ]}
                    >
                      {dest.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Specific Location Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Địa danh cụ thể</Text>
              <View style={styles.inputWrapper}>
                <MapPin size={16} color={COLORS.textMuted} style={styles.icon} />
                <TextInput
                  placeholder="Ví dụ: Shibuya Crossing hoặc Đền Tanah Lot"
                  placeholderTextColor={COLORS.textMuted}
                  value={locationName}
                  onChangeText={setLocationName}
                  style={styles.input}
                />
              </View>
            </View>

            {/* Description / Story */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Cảm nhận & Câu chuyện</Text>
              <TextInput
                placeholder="Bạn có cảm xúc hay câu chuyện thú vị nào muốn lưu lại tại đây không?"
                placeholderTextColor={COLORS.textMuted}
                multiline
                numberOfLines={4}
                value={description}
                onChangeText={setDescription}
                style={styles.textArea}
              />
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={styles.submitBtn}
              activeOpacity={0.8}
              onPress={handleSaveMoment}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <View style={styles.btnContent}>
                  <Save size={18} color={COLORS.white} />
                  <Text style={styles.submitBtnText}>Lưu Khoảnh Khắc</Text>
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
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
    height: 220,
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(255, 255, 255, 0.15)',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
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
    gap: 12,
    paddingHorizontal: 32,
  },
  placeholderText: {
    fontFamily: 'System',
    fontSize: 13,
    color: COLORS.textInactive,
    textAlign: 'center',
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
    backgroundColor: COLORS.cardBackground,
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
  destRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  destPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.cardBackground,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  destPillActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  destPillText: {
    fontFamily: 'System',
    fontSize: 12,
    color: COLORS.textInactive,
  },
  destPillTextActive: {
    color: COLORS.white,
    fontWeight: '600',
  },
  textArea: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 12,
    padding: 16,
    color: COLORS.white,
    fontSize: 14,
    fontFamily: 'System',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    textAlignVertical: 'top',
  },
  submitBtn: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
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
})
