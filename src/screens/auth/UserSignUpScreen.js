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
  StatusBar,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme';
import {
  validateEmail,
  validatePassword,
  validateConfirmPassword,
  validateUsername,
} from '../../utils/validation';
import { sanitizeEmail, sanitizeName } from '../../utils/sanitize';

export default function UserSignUpScreen({ navigation }) {
  const { signUp } = useAuth();
  const [form, setForm] = useState({ username: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const confirmRef = useRef(null);

  function setField(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
  }

  function validate() {
    const newErrors = {};
    const usernameResult = validateUsername(form.username);
    if (!usernameResult.valid) newErrors.username = usernameResult.message;

    const emailResult = validateEmail(form.email);
    if (!emailResult.valid) newErrors.email = emailResult.message;

    const passwordResult = validatePassword(form.password);
    if (!passwordResult.valid) newErrors.password = passwordResult.message;

    const confirmResult = validateConfirmPassword(form.password, form.confirm);
    if (!confirmResult.valid) newErrors.confirm = confirmResult.message;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSignUp() {
    if (!validate()) return;
    setLoading(true);

    try {
      const cleanEmail = sanitizeEmail(form.email);
      const cleanUsername = sanitizeName(form.username);

      const result = await signUp(cleanEmail, form.password, cleanUsername);

      if (!result.success) {
        Toast.show({ type: 'error', text1: 'Sign Up Failed', text2: result.error });
        return;
      }

      if (result.needsConfirmation) {
        Toast.show({
          type: 'success',
          text1: 'Account Created!',
          text2: 'Check your email for a confirmation link, then sign in.',
          visibilityTime: 5000,
        });
      } else {
        Toast.show({
          type: 'success',
          text1: 'Account Created!',
          text2: 'Welcome to Furnify! You can now sign in.',
          visibilityTime: 4000,
        });
      }
      navigation.navigate('UserLogin');
    } catch (err) {
      console.error('[UserSignUpScreen] handleSignUp error:', err);
      Toast.show({
        type: 'error',
        text1: 'Sign Up Error',
        text2: 'An unexpected error occurred. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  }

  // Password strength indicator
  const getPasswordStrength = () => {
    const p = form.password;
    if (!p) return { level: 0, label: '', color: Colors.border };
    let score = 0;
    if (p.length >= 8) score++;
    if (/\d/.test(p)) score++;
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(p)) score++;
    if (p.length >= 12) score++;
    const levels = [
      { label: '', color: Colors.border },
      { label: 'Weak', color: Colors.error },
      { label: 'Fair', color: Colors.warning },
      { label: 'Good', color: Colors.info },
      { label: 'Strong', color: Colors.success },
    ];
    return { level: score, ...levels[score] };
  };

  const strength = getPasswordStrength();

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
        {/* Back button */}
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={Colors.text} />
        </TouchableOpacity>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>
            Join Furnify and discover your perfect furniture.
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Input
            label="Username"
            value={form.username}
            onChangeText={(v) => setField('username', v)}
            placeholder="johndoe"
            autoCapitalize="none"
            error={errors.username}
            returnKeyType="next"
            onSubmitEditing={() => emailRef.current?.focus()}
            leftIcon={<Ionicons name="person-outline" size={18} color={Colors.textSecondary} />}
          />

          <Input
            inputRef={emailRef}
            label="Email Address"
            value={form.email}
            onChangeText={(v) => setField('email', v)}
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
            value={form.password}
            onChangeText={(v) => setField('password', v)}
            placeholder="Min 8 chars, 1 number, 1 special"
            secureTextEntry
            error={errors.password}
            returnKeyType="next"
            onSubmitEditing={() => confirmRef.current?.focus()}
            leftIcon={<Ionicons name="lock-closed-outline" size={18} color={Colors.textSecondary} />}
          />

          {/* Password strength bar */}
          {form.password.length > 0 && (
            <View style={styles.strengthContainer}>
              <View style={styles.strengthBars}>
                {[1, 2, 3, 4].map((i) => (
                  <View
                    key={i}
                    style={[
                      styles.strengthBar,
                      { backgroundColor: i <= strength.level ? strength.color : Colors.border },
                    ]}
                  />
                ))}
              </View>
              {strength.label ? (
                <Text style={[styles.strengthLabel, { color: strength.color }]}>
                  {strength.label}
                </Text>
              ) : null}
            </View>
          )}

          <Input
            inputRef={confirmRef}
            label="Confirm Password"
            value={form.confirm}
            onChangeText={(v) => setField('confirm', v)}
            placeholder="Re-enter your password"
            secureTextEntry
            error={errors.confirm}
            returnKeyType="done"
            onSubmitEditing={handleSignUp}
            leftIcon={<Ionicons name="checkmark-circle-outline" size={18} color={Colors.textSecondary} />}
          />

          <Button
            title="Create Account"
            onPress={handleSignUp}
            loading={loading}
            style={styles.signupBtn}
          />
        </View>

        {/* Login link */}
        <View style={styles.loginRow}>
          <Text style={styles.loginPrompt}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('UserLogin')}>
            <Text style={styles.loginLink}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },
  scrollContent: {
    flexGrow: 1,
    padding: Spacing.xl,
    paddingTop: Spacing.xxxl + Spacing.xl,
  },
  backBtn: {
    position: 'absolute',
    top: Spacing.xl + 16,
    left: Spacing.xl,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    ...(Platform.OS === 'web'
      ? { boxShadow: '0px 2px 6px 0px rgba(44,37,34,0.10)' }
      : {
          shadowColor: 'rgba(44,37,34,0.12)',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 1,
          shadowRadius: 6,
          elevation: 3,
        }),
  },
  header: {
    marginBottom: Spacing.xxxl,
    marginTop: Spacing.xxl,
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
    lineHeight: Typography.size.base * 1.6,
  },
  form: {
    marginBottom: Spacing.xl,
  },
  strengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: -Spacing.sm,
    marginBottom: Spacing.base,
    gap: Spacing.sm,
  },
  strengthBars: {
    flexDirection: 'row',
    gap: 4,
    flex: 1,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  strengthLabel: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.semiBold,
    width: 44,
    textAlign: 'right',
  },
  signupBtn: {
    marginTop: Spacing.sm,
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginPrompt: {
    fontSize: Typography.size.base,
    color: Colors.textSecondary,
  },
  loginLink: {
    fontSize: Typography.size.base,
    color: Colors.primary,
    fontWeight: Typography.weight.bold,
  },
});
