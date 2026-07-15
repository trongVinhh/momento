import React from 'react'
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { MoreHorizontal } from 'lucide-react-native'
import { BlurPill } from '../common/BlurPill'
import { COLORS } from '../../constants/theme'

interface DestinationCardProps {
  name: string
  moments: number
  image: string
  animValue: Animated.Value
  onPress: () => void
}

export function DestinationCard({
  name,
  moments,
  image,
  animValue,
  onPress,
}: DestinationCardProps) {
  const opacity = animValue
  const translateY = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [24, 0],
  })

  return (
    <Animated.View style={[styles.card, { opacity, transform: [{ translateY }] }]}>
      <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={{ flex: 1 }}>
        {/* Full-bleed background image */}
        <Image source={{ uri: image }} style={styles.cardImage} resizeMode="cover" />

        {/* Parallax bottom overlay gradient */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.2)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.cardImage}
        />

        {/* Top-left: moments pill */}
        <View style={styles.pillWrapper}>
          <BlurPill>
            <Text style={styles.pillText}>{moments} moments</Text>
          </BlurPill>
        </View>

        {/* Top-right: more options circle */}
        <View style={styles.moreWrapper}>
          <BlurPill style={styles.moreCircle}>
            <MoreHorizontal size={16} color="rgba(255,255,255,0.8)" />
          </BlurPill>
        </View>

        {/* Bottom: large clipped destination name */}
        <View style={styles.nameClipContainer} pointerEvents="none">
          <Text 
            style={[
              styles.destinationName,
              {
                fontSize: name.length > 15 ? 32 : name.length > 10 ? 46 : name.length > 6 ? 60 : 80,
                lineHeight: name.length > 15 ? 38 : name.length > 10 ? 54 : name.length > 6 ? 70 : 92
              }
            ]} 
            numberOfLines={1}
          >
            {name}
          </Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  pillWrapper: {
    position: 'absolute',
    top: 12,
    left: 12,
  },
  pillText: {
    fontFamily: 'System',
    fontSize: 12,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.9)',
  },
  moreWrapper: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  moreCircle: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameClipContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 110,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  destinationName: {
    fontFamily: 'System',
    fontWeight: '700',
    color: 'rgba(255,255,255,0.55)',
    letterSpacing: -2,
    includeFontPadding: true,
    textAlign: 'center',
  },
})
