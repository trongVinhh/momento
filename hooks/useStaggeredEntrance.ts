import { useEffect, useRef } from 'react'
import { Animated } from 'react-native'

export function useStaggeredEntrance(itemCount: number, delays: number[]) {
  const animValues = useRef(
    Array.from({ length: itemCount }).map(() => new Animated.Value(0))
  ).current

  useEffect(() => {
    const timers = delays.map((delay, i) => {
      if (i >= animValues.length) return null
      return setTimeout(() => {
        Animated.timing(animValues[i], {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }).start()
      }, delay)
    })

    return () => {
      timers.forEach((t) => t && clearTimeout(t))
    }
  }, [itemCount, delays, animValues])

  return animValues
}
