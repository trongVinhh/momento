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
import { Camera, MapPin, Type, Send, ArrowLeft, Plus, X } from 'lucide-react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useCreateMoment } from '../../hooks/useMoments'
import { COLORS, GLASS_STYLES } from '../../constants/theme'
import { useTheme } from '../../hooks/useTheme'
import { globalStyles } from '../../styles/globalStyles'
import { useTranslation } from '../../context/LanguageContext'

export default function CreateMomentScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { destId } = useLocalSearchParams<{ destId?: string }>()
  const { colors, theme, isDark } = useTheme()
  const { t, locale } = useTranslation()

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
    imageUris,
    pickImage,
    removeImage,
    loading,
    handleSaveMoment,
  } = useCreateMoment(destId)

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
        <Text style={[styles.headerTitle, { color: colors.textActive }]}>{t('newMomentTitle')}</Text>
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
          {/* Ảnh khoảnh khắc (Nhiều ảnh dạng Slide / List cuộn ngang) */}
          <View style={styles.imageSectionContainer}>
            <Text style={[styles.label, { color: colors.textActive, marginBottom: 8 }]}>{t('momentImagesLabel')}</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.imageScrollContent}
            >
              {/* Nút thêm ảnh */}
              {imageUris.length > 0 && imageUris.length < 10 && (
                <TouchableOpacity
                  style={[
                    styles.addImageSquare,
                    {
                      backgroundColor: theme === 'light' ? 'rgba(0,0,0,0.02)' : 'rgba(255, 255, 255, 0.03)',
                      borderColor: colors.borderGlass
                    }
                  ]}
                  activeOpacity={0.8}
                  onPress={pickImage}
                >
                  <Camera size={24} color={colors.textInactive} />
                  <Text style={[styles.addImageText, { color: colors.textInactive }]}>{t('addPhoto')}</Text>
                </TouchableOpacity>
              )}

              {/* Danh sách ảnh đã chọn */}
              {imageUris.map((uri, index) => (
                <View key={index} style={[styles.imageWrapper, { borderColor: colors.borderGlass }]}>
                  <Image source={{ uri }} style={styles.thumbnailImage} />
                  <TouchableOpacity
                    style={styles.removeImageBadge}
                    activeOpacity={0.7}
                    onPress={() => removeImage(index)}
                  >
                    <X size={12} color="#ffffff" />
                  </TouchableOpacity>
                  <View style={styles.indexBadge}>
                    <Text style={styles.indexBadgeText}>{index + 1}</Text>
                  </View>
                </View>
              ))}

              {/* Trạng thái trống */}
              {imageUris.length === 0 && (
                <TouchableOpacity
                  style={[
                    styles.imagePlaceholderEmpty,
                    {
                      backgroundColor: theme === 'light' ? 'rgba(0,0,0,0.02)' : 'rgba(255, 255, 255, 0.03)',
                      borderColor: colors.borderGlass
                    }
                  ]}
                  activeOpacity={0.8}
                  onPress={pickImage}
                >
                  <Camera size={32} color={colors.textInactive} style={{ marginBottom: 6 }} />
                  <Text style={[styles.placeholderText, { color: colors.textInactive }]}>{t('momentImagesPlaceholder')}</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>

          {/* Form Fields */}
          <View style={styles.form}>
            {/* Title */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textActive }]}>{t('momentTitleLabel')}</Text>
              <View style={[styles.inputWrapper, { backgroundColor: theme === 'light' ? 'rgba(0,0,0,0.02)' : 'rgba(255, 255, 255, 0.05)', borderColor: colors.borderGlass }]}>
                <Type size={16} color={colors.textMuted} style={styles.icon} />
                <TextInput
                  placeholder={t('momentTitlePlaceholder')}
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
                <Text style={[styles.label, { color: colors.textActive }]}>{t('selectDestLabel')}</Text>
              </View>

              {loadingDestinations ? (
                <View style={[styles.destLoading, { backgroundColor: theme === 'light' ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.04)', borderColor: colors.borderGlass }]}>
                  <ActivityIndicator size="small" color={colors.textInactive} />
                  <Text style={[styles.destLoadingText, { color: colors.textMuted }]}>{t('loadingDest')}</Text>
                </View>
              ) : destinations.length === 0 ? (
                <TouchableOpacity
                  style={[styles.noDestBtn, { backgroundColor: theme === 'light' ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.04)', borderColor: colors.borderGlass }]}
                  onPress={() => router.push('/destination/create')}
                >
                  <Plus size={16} color={colors.textInactive} />
                  <Text style={[styles.noDestText, { color: colors.textInactive }]}>
                    {locale === 'vi' ? 'Chưa có địa điểm. Tạo địa điểm đầu tiên!' : 'No destinations. Create the first one!'}
                  </Text>
                </TouchableOpacity>
              ) : (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.destRow}
                >
                  {/* Inline Create New Pill */}
                  <TouchableOpacity
                    style={[
                      styles.destPill,
                      {
                        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0,0,0,0.01)',
                        borderColor: colors.borderGlass,
                        borderStyle: 'dashed',
                        marginRight: 4,
                      }
                    ]}
                    onPress={() => router.push('/destination/create')}
                  >
                    <Plus size={13} color={colors.textMuted} style={{ marginRight: 2 }} />
                    <Text style={[styles.destPillText, { color: colors.textMuted, fontWeight: '500' }]}>
                      {locale === 'vi' ? 'Thêm mới...' : 'New...'}
                    </Text>
                  </TouchableOpacity>

                  {destinations.map((dest) => {
                    const isActive = selectedDestId === dest.id
                    return (
                      <TouchableOpacity
                        key={dest.id}
                        style={[
                          styles.destPill,
                          {
                            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.02)',
                            borderColor: colors.borderGlass
                          },
                          isActive && {
                            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.75)',
                            borderColor: isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.2)',
                            borderWidth: 1.5,
                          },
                        ]}
                        onPress={() => setSelectedDestId(dest.id)}
                      >
                        <MapPin size={12} color={isActive ? colors.textActive : colors.textMuted} style={{ marginRight: 2 }} />
                        <Text
                          style={[
                            styles.destPillText,
                            { color: colors.textInactive },
                            isActive && { color: colors.textActive, fontWeight: '700' },
                          ]}
                        >
                          {dest.name}
                        </Text>
                      </TouchableOpacity>
                    )
                  })}
                </ScrollView>
              )}
            </View>

            {/* Specific Location Name */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textActive }]}>{t('locationLabel')}</Text>
              <View style={[styles.inputWrapper, { backgroundColor: theme === 'light' ? 'rgba(0,0,0,0.02)' : 'rgba(255, 255, 255, 0.05)', borderColor: colors.borderGlass }]}>
                <MapPin size={16} color={colors.textMuted} style={styles.icon} />
                <TextInput
                  placeholder={t('locationPlaceholder')}
                  placeholderTextColor={colors.textMuted}
                  value={locationName}
                  onChangeText={setLocationName}
                  style={[styles.input, { color: colors.textActive }]}
                />
              </View>
            </View>

            {/* Description / Story */}
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

            {/* Submit Button */}
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
              onPress={handleSaveMoment}
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
                  <Send size={18} color={colors.textActive} />
                  <Text style={[styles.submitBtnText, { color: colors.textActive }]}>{t('createMomentSubmit')}</Text>
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
  imageSectionContainer: {
    width: '100%',
    gap: 8,
  },
  imageScrollContent: {
    gap: 12,
    alignItems: 'center',
    paddingVertical: 4,
  },
  addImageSquare: {
    width: 100,
    height: 100,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  addImageText: {
    fontFamily: 'System',
    fontSize: 11,
    fontWeight: '600',
  },
  imageWrapper: {
    width: 100,
    height: 100,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  removeImageBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  indexBadge: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  indexBadgeText: {
    fontFamily: 'System',
    fontSize: 10,
    fontWeight: '700',
    color: '#ffffff',
  },
  imagePlaceholderEmpty: {
    width: '100%',
    height: 180,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  destPillText: {
    fontFamily: 'System',
    fontSize: 12,
    color: COLORS.textInactive,
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
    borderRadius: 12,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
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
})
