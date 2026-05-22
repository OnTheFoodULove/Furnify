import React, { useState, useRef } from 'react';
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

export default function AdminLoginScreen({ navigation }) {
  const { signIn, signOut } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [lockoutMsg, setLockoutMsg] = useState('');
  const passwordRef = useRef(null);

  // Admin panel is web-only
  if (Platform.OS !== 'web') {
    return (
      <View style={styles.blockContainer}>
        <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
        <Text style={styles.blockIcon}>🖥️</Text>
        <Text style={styles.blockTitle}>Desktop Only</Text>
        <Text style={styles.blockMessage}>
          The admin panel is only accessible from a desktop browser. Please visit Furnify on the web.
        </Text>
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
        if (result.error?.includes('Too many failed attempts')) {
          setLockoutMsg(result.error);
        } else {
          Toast.show({ type: 'error', text1: 'Login Failed', text2: result.error });
        }
        return;
      }

      if (result.role !== 'admin') {
        Toast.show({
          type: 'error',
          text1: 'Access Denied',
          text2: 'This account does not have admin privileges.',
        });
        // Sign out so the non-admin user isn't left in a partial auth state
        await signOut();
        return;
      }

      // AppNavigator reacts to session/profile changes automatically —
      // no manual navigation.replace() needed here.
      Toast.show({ type: 'success', text1: 'Welcome back, Admin!' });
    } catch (err) {
      console.error('[AdminLoginScreen] handleLogin error:', err.message);
      Toast.show({
        type: 'error',
        text1: 'Login Error',
        text2: 'An unexpected error occurred. Please try again.',
      });
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
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.adminBadge}>
            <Ionicons name="shield-checkmark" size={16} color={Colors.primary} />
            <Text style={styles.adminBadgeText}>Admin Portal</Text>
          </View>
          <Image
            source={require('../../../assets/images/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>Admin Sign In</Text>
          <Text style={styles.subtitle}>
            Manage your furniture inventory, orders, and more.
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
            placeholder="admin@furnify.com"
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
            title="Sign In to Dashboard"
            onPress={handleLogin}
            loading={loading}
            disabled={!!lockoutMsg}
            style={styles.loginBtn}
          />
        </View>

        {/* Footer note */}
        <View style={styles.footer}>
          <Ionicons name="information-circle-outline" size={14} color={Colors.textMuted} />
          <Text style={styles.footerText}>
            Admin access only. 5 failed attempts will lock the account for 5 minutes.
          </Text>
        </View>
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
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xxxl,
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primarySurface,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.primaryLight + '40',
  },
  adminBadgeText: {
    fontSize: Typography.size.sm,
    color: Colors.primary,
    fontWeight: Typography.weight.semiBold,
  },
  logo: {
    width: 80,
    height: 80,
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
  },
  form: {
    marginBottom: Spacing.xl,
  },
  loginBtn: {
    marginTop: Spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    paddingHorizontal: Spacing.md,
  },
  footerText: {
    flex: 1,
    fontSize: Typography.size.xs,
    color: Colors.textMuted,
    lineHeight: Typography.size.xs * 1.6,
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
