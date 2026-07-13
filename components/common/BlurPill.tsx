import React from 'react'
import { View, StyleSheet, Platform, ViewStyle } from 'react-native'
import { BlurView } from 'expo-blur'
import { COLORS, GLASS_STYLES } from '../../constants/theme'

interface BlurPillProps {
  children: React.ReactNode
  style?: ViewStyle
  intensity?: number
}

export function BlurPill({ children, style, intensity }: BlurPillProps) {
  const defaultIntensity = intensity ?? (Platform.OS === 'android' ? 20 : GLASS_STYLES.pillIntensity)

  return (
    <View style={[styles.wrapper, style]}>
      <BlurView intensity={defaultIntensity} tint="light" style={styles.blur}>
        <View style={styles.innerBorder} />
        {children}
      </BlurView>
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: 999,
    overflow: 'hidden',
  },
  blur: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.borderGlassHeavy,
    shadowColor: COLORS.shadowLight,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
})
