import React from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native'
import { BlurView } from 'expo-blur'
import { StatusBar } from 'expo-status-bar'
import { LogIn, UserPlus, Mail, Lock } from 'lucide-react-native'

import { useAuth } from '../hooks/useAuth'
import { COLORS } from '../constants/theme'
import { globalStyles } from '../styles/globalStyles'

export default function LoginScreen() {
  const {
    email,
    setEmail,
    password,
    setPassword,
    loading,
    isSignUp,
    setIsSignUp,
    handleAuth,
  } = useAuth()

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={globalStyles.container}>
        <StatusBar style="light" translucent />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          {/* Decorative background gradients */}
          <View style={styles.bgBlobLeft} />
          <View style={styles.bgBlobRight} />

          <View style={styles.content}>
            <Text style={styles.brandTitle}>Momento</Text>
            <Text style={styles.brandSubtitle}>Ghi lại & chia sẻ hành trình du lịch của bạn</Text>

            {/* Glass Login Card */}
            <BlurView intensity={25} tint="dark" style={styles.loginCard}>
              <View style={styles.innerBorder} />

              <Text style={styles.cardHeader}>
                {isSignUp ? 'Tạo tài khoản mới' : 'Chào mừng quay trở lại'}
              </Text>

              {/* Email Input */}
              <View style={styles.inputContainer}>
                <Mail size={18} color={COLORS.textMuted} style={styles.inputIcon} />
                <TextInput
                  placeholder="Email của bạn"
                  placeholderTextColor={COLORS.textMuted}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  style={styles.input}
                />
              </View>

              {/* Password Input */}
              <View style={styles.inputContainer}>
                <Lock size={18} color={COLORS.textMuted} style={styles.inputIcon} />
                <TextInput
                  placeholder="Mật khẩu"
                  placeholderTextColor={COLORS.textMuted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  style={styles.input}
                />
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  {
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    borderColor: 'rgba(255, 255, 255, 0.25)',
                    shadowColor: '#ffffff',
                    shadowOffset: { width: 0, height: 3 },
                    shadowOpacity: 0.12,
                    shadowRadius: 8,
                    elevation: 2,
                  }
                ]}
                activeOpacity={0.8}
                onPress={handleAuth}
                disabled={loading}
              >
                <BlurView
                  intensity={Platform.OS === 'android' ? 20 : 35}
                  tint="light"
                  style={StyleSheet.absoluteFillObject}
                />
                <View style={[styles.innerHighlight, { borderColor: 'rgba(255, 255, 255, 0.45)' }]} />

                {loading ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <View style={styles.btnContent}>
                    {isSignUp ? (
                      <UserPlus size={18} color={COLORS.white} />
                    ) : (
                      <LogIn size={18} color={COLORS.white} />
                    )}
                    <Text style={[styles.submitBtnText, { color: COLORS.white }]}>
                      {isSignUp ? 'Đăng Ký' : 'Đăng Nhập'}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* Switch Auth mode Button */}
              <TouchableOpacity
                style={styles.switchButton}
                activeOpacity={0.7}
                onPress={() => setIsSignUp(!isSignUp)}
              >
                <Text style={styles.switchText}>
                  {isSignUp ? 'Đã có tài khoản? Đăng nhập' : 'Chưa có tài khoản? Đăng ký ngay'}
                </Text>
              </TouchableOpacity>
            </BlurView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </TouchableWithoutFeedback>
  )
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  brandTitle: {
    fontFamily: 'System',
    fontSize: 42,
    fontWeight: '900',
    color: COLORS.white,
    letterSpacing: -1,
    marginBottom: 8,
  },
  brandSubtitle: {
    fontFamily: 'System',
    fontSize: 14,
    color: COLORS.textSubtle,
    textAlign: 'center',
    marginBottom: 40,
  },
  loginCard: {
    width: '100%',
    borderRadius: 24,
    padding: 24,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.01)',
  },
  innerBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  cardHeader: {
    fontFamily: 'System',
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.white,
    marginBottom: 24,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    height: 52,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: COLORS.white,
    fontSize: 14,
    fontFamily: 'System',
  },
  submitButton: {
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
  switchButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  switchText: {
    fontFamily: 'System',
    fontSize: 12,
    color: COLORS.textInactive,
  },
  bgBlobLeft: {
    position: 'absolute',
    left: -80,
    top: '25%',
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    filter: 'blur(60px)',
  },
  bgBlobRight: {
    position: 'absolute',
    right: -80,
    bottom: '25%',
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(139, 92, 246, 0.12)',
    filter: 'blur(60px)',
  },
})
