import { useState } from 'react'
import { Alert } from 'react-native'
import { supabase } from '../lib/supabase'

export function useAuth() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('Lỗi', 'Vui lòng điền đầy đủ Email và Mật khẩu.')
      return
    }

    setLoading(true)

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        })
        if (error) throw error

        Alert.alert(
          'Đăng ký thành công',
          'Vui lòng kiểm tra email của bạn để xác nhận tài khoản (nếu Supabase có bật tính năng xác thực email).'
        )
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
      }
    } catch (err: any) {
      Alert.alert(isSignUp ? 'Lỗi đăng ký' : 'Lỗi đăng nhập', err.message || 'Đã có lỗi xảy ra.')
    } finally {
      setLoading(false)
    }
  }

  return {
    email,
    setEmail,
    password,
    setPassword,
    loading,
    isSignUp,
    setIsSignUp,
    handleAuth,
  }
}
