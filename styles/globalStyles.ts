import { StyleSheet } from 'react-native'
import { COLORS } from '../constants/theme'

export const globalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  absoluteFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  flexRowAlignCenter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerBase: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 16,
    overflow: 'hidden',
  },
  headerTitle: {
    fontFamily: 'System',
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.white,
  },
  scrollBase: {
    flex: 1,
  },
})
