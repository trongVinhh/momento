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
import { Camera, MapPin, Type, Send, ArrowLeft, Plus } from 'lucide-react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useCreateMoment } from '../hooks/useCreateMoment'
import { COLORS, GLASS_STYLES } from '../constants/theme'
import { useTheme } from '../hooks/useTheme'
import { globalStyles } from '../styles/globalStyles'

export default function CreateMomentScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { colors, theme, isDark } = useTheme()

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
    handleSaveMoment,
  } = useCreateMoment()

  return (
    <View style={[globalStyles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} translucent />

      {/* Header */}
      <BlurView
        intensity={Platform.OS === 'android' ? 40 : GLASS_STYLES.headerIntensity}
        tint={colors.blurTint}
        style={[globalStyles.headerBase, { paddingTop: insets.top + 12, borderBottomColor: colors.borderGlass, borderBottomWidth: 1 }]}
      >
        <TouchableOpacity style={[styles.glassRoundBtn, { backgroundColor: theme === 'light' ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.05)', borderColor: colors.borderGlass }]} onPress={() => router.back()}>
          <ArrowLeft size={20} color={colors.textActive} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textActive }]}>New Moment</Text>
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
            style={[styles.imagePlaceholder, { backgroundColor: theme === 'light' ? 'rgba(0,0,0,0.02)' : 'rgba(255, 255, 255, 0.03)', borderColor: colors.borderGlass }]}
            activeOpacity={0.8}
            onPress={pickImage}
          >
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.previewImage} />
            ) : (
              <View style={styles.placeholderContent}>
                <Camera size={32} color={colors.textInactive} />
                <Text style={[styles.placeholderText, { color: colors.textInactive }]}>Chọn ảnh từ thư viện điện thoại</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Form Fields */}
          <View style={styles.form}>
            {/* Title */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textActive }]}>Tiêu đề khoảnh khắc</Text>
              <View style={[styles.inputWrapper, { backgroundColor: theme === 'light' ? 'rgba(0,0,0,0.02)' : 'rgba(255, 255, 255, 0.05)', borderColor: colors.borderGlass }]}>
                <Type size={16} color={colors.textMuted} style={styles.icon} />
                <TextInput
                  placeholder="Ví dụ: Hoàng hôn rực rỡ ở đền thờ..."
                  placeholderTextColor={colors.textMuted}
                  value={title}
                  onChangeText={setTitle}
                  style={[styles.input, { color: colors.textActive }]}
                />
              </View>
            </View>

            {/* Destination Selector - Dynamic */}
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={[styles.label, { color: colors.textActive }]}>Chọn địa điểm</Text>
                <TouchableOpacity
                  style={[
                    styles.addDestBtn,
                    { 
                      backgroundColor: colors.accentPrimarySubtle,
                      borderColor: colors.accentPrimaryBorder
                    }
                  ]}
                  onPress={() => router.push('/create-destination')}
                >
                  <Plus size={12} color={colors.accentPrimary} />
                  <Text style={[styles.addDestBtnText, { color: colors.accentPrimary }]}>Thêm mới</Text>
                </TouchableOpacity>
              </View>

              {loadingDestinations ? (
                <View style={[styles.destLoading, { backgroundColor: theme === 'light' ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.04)', borderColor: colors.borderGlass }]}>
                  <ActivityIndicator size="small" color={colors.textInactive} />
                  <Text style={[styles.destLoadingText, { color: colors.textMuted }]}>Đang tải địa điểm...</Text>
                </View>
              ) : destinations.length === 0 ? (
                <TouchableOpacity
                  style={[styles.noDestBtn, { backgroundColor: theme === 'light' ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.04)', borderColor: colors.borderGlass }]}
                  onPress={() => router.push('/create-destination')}
                >
                  <Plus size={16} color={colors.textInactive} />
                  <Text style={[styles.noDestText, { color: colors.textInactive }]}>
                    Chưa có địa điểm. Tạo địa điểm đầu tiên!
                  </Text>
                </TouchableOpacity>
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
                        { 
                          backgroundColor: theme === 'light' ? 'rgba(0,0,0,0.02)' : 'rgba(255, 255, 255, 0.05)',
                          borderColor: colors.borderGlass 
                        },
                        selectedDestId === dest.id && [styles.destPillActive, { backgroundColor: colors.accentPrimary, borderColor: colors.accentPrimary }],
                      ]}
                      onPress={() => setSelectedDestId(dest.id)}
                    >
                      <Text
                        style={[
                          styles.destPillText,
                          { color: colors.textInactive },
                          selectedDestId === dest.id && [styles.destPillTextActive, { color: '#ffffff' }],
                        ]}
                      >
                        {dest.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>

            {/* Specific Location Name */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textActive }]}>Địa danh cụ thể</Text>
              <View style={[styles.inputWrapper, { backgroundColor: theme === 'light' ? 'rgba(0,0,0,0.02)' : 'rgba(255, 255, 255, 0.05)', borderColor: colors.borderGlass }]}>
                <MapPin size={16} color={colors.textMuted} style={styles.icon} />
                <TextInput
                  placeholder="Ví dụ: Bãi biển Mỹ Khê hoặc Đền Linh Ứng"
                  placeholderTextColor={colors.textMuted}
                  value={locationName}
                  onChangeText={setLocationName}
                  style={[styles.input, { color: colors.textActive }]}
                />
              </View>
            </View>

            {/* Description / Story */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textActive }]}>Cảm nhận & Câu chuyện</Text>
              <TextInput
                placeholder="Bạn có cảm xúc hay câu chuyện thú vị nào muốn lưu lại tại đây không?"
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={4}
                value={description}
                onChangeText={setDescription}
                style={[
                  styles.textArea,
                  { 
                    backgroundColor: theme === 'light' ? 'rgba(0,0,0,0.02)' : 'rgba(255, 255, 255, 0.05)',
                    borderColor: colors.borderGlass,
                    color: colors.textActive
                  }
                ]}
              />
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[
                styles.submitBtn,
                { 
                  backgroundColor: colors.accentPrimaryGlass,
                  borderColor: colors.borderGlass,
                  shadowColor: colors.accentPrimary
                }
              ]}
              activeOpacity={0.8}
              onPress={handleSaveMoment}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <View style={styles.btnContent}>
                  <Send size={18} color="#ffffff" />
                  <Text style={[styles.submitBtnText, { color: '#ffffff' }]}>Lưu Khoảnh Khắc</Text>
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
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    fontFamily: 'System',
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
    paddingLeft: 2,
  },
  addDestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.25)',
  },
  addDestBtnText: {
    fontFamily: 'System',
    fontSize: 11,
    fontWeight: '600',
    color: '#3b82f6',
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
  noDestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderStyle: 'dashed',
  },
  noDestText: {
    fontFamily: 'System',
    fontSize: 13,
    color: COLORS.textInactive,
    flex: 1,
  },
  destRow: {
    gap: 8,
    paddingVertical: 2,
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
})
