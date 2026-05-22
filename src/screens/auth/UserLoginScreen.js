import React, { useState, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
  StatusBar,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme';
import { validateEmail, validatePassword } from '../../utils/validation';
import { sanitizeEmail } from '../../utils/sanitize';

export default function UserLoginScreen({ navigation }) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [lockoutMsg, setLockoutMsg] = useState('');
  const passwordRef = useRef(null);

  // User app is mobile-only
  if (Platform.OS === 'web') {
    return (
      <View style={styles.blockContainer}>
        <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
        <Text style={styles.blockIcon}>📱</Text>
        <Text style={styles.blockTitle}>Mobile App Only</Text>
        <Text style={styles.blockMessage}>
          Please download the Furnify mobile app to browse and shop. The web version is for administrators only.
        </Text>
        
        <TouchableOpacity
          style={{
            marginTop: Spacing.xl,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            paddingVertical: 10,
            paddingHorizontal: 20,
            borderRadius: BorderRadius.md,
            backgroundColor: Colors.primarySurface,
            borderWidth: 1.5,
            borderColor: Colors.primary,
          }}
          onPress={() => navigation.navigate('AdminLogin')}
        >
          <Ionicons name="shield-checkmark" size={16} color={Colors.primary} />
          <Text style={{ color: Colors.primary, fontWeight: '700', fontSize: 14 }}>
            Admin? Sign in to Dashboard
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  function validate() {
    const newErrors = {};
    const emailResult = validateEmail(email);
    if (!emailResult.valid) newErrors.email = emailResult.message;
    const passwordResult = validatePassword(password);
    if (!passwordResult.valid) newErrors.password = passwordResult.message;
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleLogin() {
    if (!validate()) return;
    setLockoutMsg('');
    setLoading(true);
    try {
      const cleanEmail = sanitizeEmail(email);
      const result = await signIn(cleanEmail, password);

      if (!result.success) {
        // Surface lockout messages prominently
        if (result.error?.includes('Too many failed attempts')) {
          setLockoutMsg(result.error);
        } else {
          Toast.show({ type: 'error', text1: 'Login Failed', text2: result.error });
        }
        return;
      }

      // AppNavigator reacts to session/profile changes automatically —
      // no manual navigation.replace() needed here.
      if (result.role === 'admin') {
        Toast.show({ type: 'info', text1: 'Admin account detected', text2: 'Redirecting to admin panel...' });
      } else {
        Toast.show({ type: 'success', text1: 'Welcome back!' });
      }
    } catch (err) {
      console.error('[UserLoginScreen] handleLogin error:', err?.message || err);
        Toast.show({ type: 'error', text1: 'Login Error', text2: err?.message || 'An unexpected error occurred.' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Decorative top blob */}
        <View style={styles.topBlob} />

        {/* Header */}
        <View style={styles.header}>
          <Image
            source={require('../../../assets/images/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>
            Sign in to browse our curated furniture collection.
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Input
            label="Email Address"
            value={email}
            onChangeText={(v) => {
              setEmail(v);
              if (errors.email) setErrors((e) => ({ ...e, email: undefined }));
            }}
            placeholder="you@example.com"
            keyboardType="email-address"
            error={errors.email}
            returnKeyType="next"
            onSubmitEditing={() => passwordRef.current?.focus()}
            leftIcon={<Ionicons name="mail-outline" size={18} color={Colors.textSecondary} />}
          />

          <Input
            inputRef={passwordRef}
            label="Password"
            value={password}
            onChangeText={(v) => {
              setPassword(v);
              if (errors.password) setErrors((e) => ({ ...e, password: undefined }));
            }}
            placeholder="Enter your password"
            secureTextEntry
            error={errors.password}
            returnKeyType="done"
            onSubmitEditing={handleLogin}
            leftIcon={<Ionicons name="lock-closed-outline" size={18} color={Colors.textSecondary} />}
          />

          {lockoutMsg ? (
            <View style={styles.lockoutBox}>
              <Ionicons name="lock-closed" size={18} color={Colors.error} />
              <Text style={styles.lockoutText}>{lockoutMsg}</Text>
            </View>
          ) : null}

          <Button
            title="Sign In"
            onPress={handleLogin}
            loading={loading}
            disabled={!!lockoutMsg}
            style={styles.loginBtn}
          />
        </View>

        {/* Sign up prompt */}
        <View style={styles.signupRow}>
          <Text style={styles.signupPrompt}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('UserSignUp')}>
            <Text style={styles.signupLink}>Sign Up</Text>
          </TouchableOpacity>
        </View>

        {/* Admin login link */}
        <TouchableOpacity
          style={styles.adminLink}
          onPress={() => navigation.navigate('AdminLogin')}
        >
          <Ionicons name="shield-outline" size={14} color={Colors.textMuted} />
          <Text style={styles.adminLinkText}>Admin? Sign in here</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },
  blockContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  blockIcon: { fontSize: 56, marginBottom: Spacing.xl },
  blockTitle: {
    fontSize: Typography.size.xxl,
    fontWeight: Typography.weight.bold,
    color: Colors.text,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  blockMessage: {
    fontSize: Typography.size.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: Typography.size.base * 1.6,
    maxWidth: 300,
  },
  scrollContent: {
    flexGrow: 1,
    padding: Spacing.xl,
    justifyContent: 'center',
  },
  topBlob: {
    position: 'absolute',
    top: -80,
    right: -80,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: Colors.primarySurface,
    opacity: 0.6,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xxxl,
  },
  logo: {
    width: 90,
    height: 90,
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: Typography.size.xxl,
    fontWeight: Typography.weight.extraBold,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: Typography.size.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: Typography.size.base * 1.6,
    maxWidth: 280,
  },
  form: {
    marginBottom: Spacing.xl,
  },
  loginBtn: {
    marginTop: Spacing.sm,
  },
  signupRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  signupPrompt: {
    fontSize: Typography.size.base,
    color: Colors.textSecondary,
  },
  signupLink: {
    fontSize: Typography.size.base,
    color: Colors.primary,
    fontWeight: Typography.weight.bold,
  },
  adminLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    opacity: 0.7,
  },
  adminLinkText: {
    fontSize: Typography.size.sm,
    color: Colors.textMuted,
  },
  lockoutBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#FFF1F0',
    borderWidth: 1,
    borderColor: Colors.error,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  lockoutText: {
    flex: 1,
    fontSize: Typography.size.sm,
    color: Colors.error,
    lineHeight: Typography.size.sm * 1.5,
    fontWeight: Typography.weight.medium,
  },
});
