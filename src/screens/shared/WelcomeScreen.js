import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  StatusBar,
  Image,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/Button';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../theme';

export default function WelcomeScreen() {
  const { profile, markOnboardingSeen } = useAuth();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleContinue = async () => {
    await markOnboardingSeen();
    // AppNavigator re-renders automatically once has_seen_onboarding is true
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      <Animated.View
        style={[
          styles.content,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        <View style={styles.iconWrapper}>
          <Image
            source={require('../../../assets/images/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <Text style={styles.welcomeLabel}>WELCOME TO FURNIFY</Text>

        <Text style={styles.title}>
          Hello, {profile?.username || 'there'}! 🎉
        </Text>

        <Text style={styles.subtitle}>
          Your account is all set up. Explore premium furniture, save your
          favorites, and shop with confidence.
        </Text>

        <View style={styles.features}>
          {[
            { icon: '🛋️', text: 'Browse curated furniture collections' },
            { icon: '📱', text: 'Preview items in your space with AR' },
            { icon: '🛒', text: 'Secure checkout with flexible payment' },
          ].map((item, i) => (
            <View key={i} style={styles.featureRow}>
              <Text style={styles.featureIcon}>{item.icon}</Text>
              <Text style={styles.featureText}>{item.text}</Text>
            </View>
          ))}
        </View>

        <Button
          title="Let's Get Started"
          onPress={handleContinue}
          style={styles.btn}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  content: {
    alignItems: 'center',
  },
  iconWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.primarySurface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
    ...Shadows.md,
  },
  logo: {
    width: 60,
    height: 60,
  },
  welcomeLabel: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.bold,
    color: Colors.primary,
    letterSpacing: 2,
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: Typography.size.xxxl,
    fontWeight: Typography.weight.extraBold,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  subtitle: {
    fontSize: Typography.size.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: Typography.size.base * 1.7,
    marginBottom: Spacing.xxl,
    paddingHorizontal: Spacing.md,
  },
  features: {
    alignSelf: 'stretch',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.xxl,
    ...Shadows.sm,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    gap: Spacing.md,
  },
  featureIcon: {
    fontSize: 22,
  },
  featureText: {
    fontSize: Typography.size.base,
    color: Colors.text,
    fontWeight: Typography.weight.medium,
    flex: 1,
  },
  btn: {
    alignSelf: 'stretch',
  },
});
