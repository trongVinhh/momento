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
import { useRouter, useLocalSearchParams } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { Camera, Check, Trash2, ArrowLeft, MapPin, FileText, Compass, ChevronDown } from 'lucide-react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { GLASS_STYLES, COLORS } from '../../constants/theme'
import { useTheme } from '../../hooks/useTheme'
import { useEditDestination } from '../../hooks/useEditDestination'
import { globalStyles } from '../../styles/globalStyles'
import { POPULAR_COUNTRIES } from '../../constants/mockData'
import { useTranslation } from '../../context/LanguageContext'

export default function EditDestinationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const [pickerVisible, setPickerVisible] = useState(false)
  const { colors, theme, isDark } = useTheme()
  const { t, locale } = useTranslation()

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
    fetching,
    handleUpdateDestination,
    handleDeleteDestination,
  } = useEditDestination(id)

  if (fetching) {
    return (
      <View style={[globalStyles.container, styles.centerState, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.3)'} />
        <Text style={[styles.stateText, { color: colors.textInactive }]}>
          {locale === 'vi' ? 'Đang tải địa điểm...' : 'Loading destination details...'}
        </Text>
      </View>
    )
  }

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
        <Text style={[styles.headerTitle, { color: colors.textActive }]}>{t('editDestTitle')}</Text>
        <TouchableOpacity style={[styles.glassRoundBtn, styles.deleteHeaderBtn, { backgroundColor: theme === 'light' ? 'rgba(239, 68, 68, 0.08)' : 'rgba(239, 68, 68, 0.15)', borderColor: 'rgba(239, 68, 68, 0.25)' }]} onPress={handleDeleteDestination}>
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
          {/* Ảnh bìa */}
          <TouchableOpacity
            style={[styles.imagePlaceholder, { backgroundColor: theme === 'light' ? 'rgba(0,0,0,0.02)' : 'rgba(255, 255, 255, 0.03)', borderColor: colors.borderGlass }]}
            activeOpacity={0.8}
            onPress={pickImage}
          >
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.previewImage} />
            ) : (
              <View style={styles.placeholderContent}>
                <View style={[styles.cameraCircle, { backgroundColor: theme === 'light' ? 'rgba(0,0,0,0.03)' : 'rgba(255, 255, 255, 0.06)', borderColor: colors.borderGlass }]}>
                  <Camera size={28} color={colors.textInactive} />
                </View>
                <Text style={[styles.placeholderTitle, { color: colors.textInactive }]}>
                  {locale === 'vi' ? 'Chọn ảnh bìa mới' : 'Select new cover image'}
                </Text>
                <Text style={[styles.placeholderSub, { color: colors.textMuted }]}>
                  {locale === 'vi' ? 'Tỷ lệ 16:9 được khuyên dùng' : 'Aspect ratio 16:9 recommended'}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Form */}
          <View style={styles.form}>
            {/* Tên địa điểm */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textActive }]}>{t('destNameLabel')}</Text>
              <View style={[styles.inputWrapper, { backgroundColor: theme === 'light' ? 'rgba(0,0,0,0.02)' : 'rgba(255, 255, 255, 0.05)', borderColor: colors.borderGlass }]}>
                <MapPin size={16} color={colors.textMuted} style={styles.icon} />
                <TextInput
                  placeholder={t('destNamePlaceholder')}
                  placeholderTextColor={colors.textMuted}
                  value={name}
                  onChangeText={setName}
                  style={[styles.input, { color: colors.textActive }]}
                />
              </View>
            </View>

            {/* Quốc gia (Chọn thay vì nhập tay) */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textActive }]}>{t('countryLabel')}</Text>
              <TouchableOpacity
                style={[styles.inputWrapper, { backgroundColor: theme === 'light' ? 'rgba(0,0,0,0.02)' : 'rgba(255, 255, 255, 0.05)', borderColor: colors.borderGlass }]}
                activeOpacity={0.8}
                onPress={() => setPickerVisible(true)}
              >
                <Compass size={16} color={colors.textMuted} style={styles.icon} />
                <Text style={[styles.inputText, { color: country ? colors.textActive : colors.textMuted }]}>
                  {country || t('countryPlaceholder')}
                </Text>
                <ChevronDown size={16} color={colors.textInactive} style={styles.rightIcon} />
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
                  tint={colors.blurTint}
                  style={[styles.modalContent, { backgroundColor: theme === 'light' ? 'rgba(255,255,255,0.92)' : 'rgba(20, 20, 25, 0.92)', borderColor: colors.borderGlass }]}
                >
                  <View style={[styles.modalInnerBorder, { borderColor: colors.borderGlass }]} />
                  <Text style={[styles.modalTitle, { color: colors.textActive }]}>
                    {locale === 'vi' ? 'Chọn Quốc Gia' : 'Select Country'}
                  </Text>

                  <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                    {POPULAR_COUNTRIES.map((item) => (
                      <TouchableOpacity
                        key={item}
                        style={[
                          styles.modalItem,
                          {
                            backgroundColor: theme === 'light' ? 'rgba(0,0,0,0.01)' : 'rgba(255, 255, 255, 0.02)',
                            borderColor: colors.borderGlass
                          },
                          country === item && { backgroundColor: colors.accentPrimarySubtle, borderColor: colors.accentPrimaryBorder, borderWidth: 1.5 },
                        ]}
                        onPress={() => {
                          setCountry(item)
                          setPickerVisible(false)
                        }}
                      >
                        <Text
                          style={[
                            styles.modalItemText,
                            { color: colors.textInactive },
                            country === item && { color: colors.accentPrimary, fontWeight: '700' },
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

            {/* Mô tả */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textActive }]}>{t('descriptionLabel')}</Text>
              <TextInput
                placeholder={t('descriptionPlaceholder')}
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

            {/* Buttons */}
            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={[
                  styles.submitBtn,
                  {
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.05)',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.15)',
                    shadowColor: isDark ? '#ffffff' : '#000000',
                    shadowOffset: { width: 0, height: 3 },
                    shadowOpacity: isDark ? 0.12 : 0.06,
                    shadowRadius: 8,
                    elevation: 2,
                  }
                ]}
                activeOpacity={0.8}
                onPress={handleUpdateDestination}
                disabled={loading}
              >
                <BlurView
                  intensity={Platform.OS === 'android' ? 20 : 35}
                  tint={colors.blurTint}
                  style={StyleSheet.absoluteFillObject}
                />
                <View style={[styles.innerHighlight, { borderColor: isDark ? 'rgba(255, 255, 255, 0.35)' : 'rgba(255, 255, 255, 0.75)' }]} />

                {loading ? (
                  <ActivityIndicator color={colors.textActive} />
                ) : (
                  <View style={styles.btnContent}>
                    <Check size={18} color={colors.textActive} />
                    <Text style={[styles.submitBtnText, { color: colors.textActive }]}>{t('updateDestBtn')}</Text>
                  </View>
                )}
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
  buttonGroup: {
    gap: 12,
    marginTop: 12,
  },
  submitBtn: {
    borderRadius: 12,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    overflow: 'hidden',
  },
  innerHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 12,
    borderWidth: 1.2,
    opacity: 0.8,
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
    minHeight: 120,
  },
})
