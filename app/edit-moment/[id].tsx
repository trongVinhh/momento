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
import { useRouter, useLocalSearchParams } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { Camera, Check, Trash2, ArrowLeft, MapPin, Type } from 'lucide-react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { GLASS_STYLES, COLORS } from '../../constants/theme'
import { useEditMoment } from '../../hooks/useEditMoment'
import { globalStyles } from '../../styles/globalStyles'

export default function EditMomentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const insets = useSafeAreaInsets()
  const router = useRouter()

  const {
    title,
    setTitle,
    description,
    setDescription,
    locationName,
    setLocationName,
    selectedDestId,
    setSelectedDestId,
    destinations,
    loadingDestinations,
    imageUri,
    pickImage,
    loading,
    fetching,
    handleUpdateMoment,
    handleDeleteMoment,
  } = useEditMoment(id)

  if (fetching) {
    return (
      <View style={[globalStyles.container, styles.centerState]}>
        <ActivityIndicator size="large" color="rgba(255,255,255,0.5)" />
        <Text style={styles.stateText}>Đang tải khoảnh khắc...</Text>
      </View>
    )
  }

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
        <Text style={styles.headerTitle}>Sửa Khoảnh Khắc</Text>
        <TouchableOpacity style={[styles.glassRoundBtn, styles.deleteHeaderBtn]} onPress={handleDeleteMoment}>
          <Trash2 size={18} color="#ef4444" />
        </TouchableOpacity>
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
          {/* Ảnh khoảnh khắc */}
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
                <Text style={styles.placeholderText}>Chọn ảnh khoảnh khắc mới</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Form */}
          <View style={styles.form}>
            {/* Tiêu đề */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Tiêu đề khoảnh khắc</Text>
              <View style={styles.inputWrapper}>
                <Type size={16} color={COLORS.textMuted} style={styles.icon} />
                <TextInput
                  placeholder="Tiêu đề..."
                  placeholderTextColor={COLORS.textMuted}
                  value={title}
                  onChangeText={setTitle}
                  style={styles.input}
                />
              </View>
            </View>

            {/* Chọn địa điểm lớn (Destination) */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Thuộc địa điểm</Text>
              {loadingDestinations ? (
                <View style={styles.destLoading}>
                  <ActivityIndicator size="small" color="rgba(255,255,255,0.4)" />
                  <Text style={styles.destLoadingText}>Đang tải địa điểm...</Text>
                </View>
              ) : (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.destRow}
                >
                  {destinations.map((dest) => (
                    <TouchableOpacity
                      key={dest.id}
                      style={[
                        styles.destPill,
                        selectedDestId === dest.id && styles.destPillActive,
                      ]}
                      onPress={() => setSelectedDestId(dest.id)}
                    >
                      <Text
                        style={[
                          styles.destPillText,
                          selectedDestId === dest.id && styles.destPillTextActive,
                        ]}
                      >
                        {dest.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>

            {/* Địa danh cụ thể */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Địa danh cụ thể</Text>
              <View style={styles.inputWrapper}>
                <MapPin size={16} color={COLORS.textMuted} style={styles.icon} />
                <TextInput
                  placeholder="Ví dụ: Cầu Rồng, Cầu Vàng..."
                  placeholderTextColor={COLORS.textMuted}
                  value={locationName}
                  onChangeText={setLocationName}
                  style={styles.input}
                />
              </View>
            </View>

            {/* Cảm nhận & Câu chuyện */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Cảm nhận & Câu chuyện</Text>
              <TextInput
                placeholder="Câu chuyện hoặc cảm xúc của bạn..."
                placeholderTextColor={COLORS.textMuted}
                multiline
                numberOfLines={4}
                value={description}
                onChangeText={setDescription}
                style={styles.textArea}
              />
            </View>

            {/* Buttons */}
            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={styles.submitBtn}
                activeOpacity={0.8}
                onPress={handleUpdateMoment}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <View style={styles.btnContent}>
                    <Check size={18} color={COLORS.white} />
                    <Text style={styles.submitBtnText}>Cập Nhật Khoảnh Khắc</Text>
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.deleteBtn}
                activeOpacity={0.8}
                onPress={handleDeleteMoment}
                disabled={loading}
              >
                <View style={styles.btnContent}>
                  <Trash2 size={18} color="#ef4444" />
                  <Text style={styles.deleteBtnText}>Xóa Khoảnh Khắc này</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  )
}

const styles = StyleSheet.create({
  centerState: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  stateText: {
    fontFamily: 'System',
    fontSize: 14,
    color: COLORS.textInactive,
  },
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
  deleteHeaderBtn: {
    borderColor: 'rgba(239, 68, 68, 0.25)',
    backgroundColor: 'rgba(239, 68, 68, 0.06)',
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
    gap: 12,
  },
  placeholderText: {
    fontFamily: 'System',
    fontSize: 13,
    color: COLORS.textInactive,
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
  destLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  destLoadingText: {
    fontFamily: 'System',
    fontSize: 13,
    color: COLORS.textMuted,
  },
  destRow: {
    gap: 8,
    paddingVertical: 2,
  },
  destPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
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
  textArea: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    color: COLORS.white,
    fontSize: 14,
    fontFamily: 'System',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    textAlignVertical: 'top',
    minHeight: 100,
  },
  buttonGroup: {
    gap: 12,
    marginTop: 12,
  },
  submitBtn: {
    backgroundColor: 'rgba(59, 130, 246, 0.75)',
    borderRadius: 12,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
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
  deleteBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderRadius: 12,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
  },
  deleteBtnText: {
    fontFamily: 'System',
    fontSize: 15,
    fontWeight: '600',
    color: '#ef4444',
  },
})
