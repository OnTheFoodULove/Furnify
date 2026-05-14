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

export default function UserLoginScreen({ navigation }) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(null); // null = checking, true = ok, false = fail
  const passwordRef = useRef(null);

  React.useEffect(() => {
    checkConnection();
  }, []);

  async function checkConnection() {
    try {
      const { error } = await supabase.from('furniture').select('id', { head: true, count: 'exact' }).limit(1);
      setIsConnected(!error);
    } catch (e) {
      setIsConnected(false);
    }
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
    setLoading(true);
    try {
      const cleanEmail = sanitizeEmail(email);
      const result = await signIn(cleanEmail, password);

      if (!result.success) {
        Toast.show({ type: 'error', text1: 'Login Failed', text2: result.error });
        return;
      }

      if (result.role === 'admin') {
        Toast.show({ type: 'info', text1: 'Admin detected', text2: 'Redirecting to admin panel...' });
        navigation.replace('AdminTabs');
        return;
      }

      Toast.show({ type: 'success', text1: 'Welcome back!' });
      navigation.replace('UserTabs');
    } catch (err) {
      console.error('[UserLoginScreen] handleLogin error:', err);
      Toast.show({ type: 'error', text1: 'Login Error', text2: 'An unexpected error occurred.' });
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
          <View style={styles.connStatus}>
            <View style={[styles.dot, isConnected === true ? styles.dotGreen : isConnected === false ? styles.dotRed : styles.dotGray]} />
            <Text style={styles.connText}>
              {isConnected === true ? 'Server Online' : isConnected === false ? 'Server Offline' : 'Checking connection...'}
            </Text>
            {isConnected === false && (
              <TouchableOpacity onPress={checkConnection}>
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            )}
          </View>
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

          <Button
            title="Sign In"
            onPress={handleLogin}
            loading={loading}
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
  connStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.base,
    backgroundColor: Colors.surfaceElevated,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotGreen: { backgroundColor: '#4ADE80' },
  dotRed: { backgroundColor: Colors.error },
  dotGray: { backgroundColor: Colors.textMuted },
  connText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  retryText: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
});
