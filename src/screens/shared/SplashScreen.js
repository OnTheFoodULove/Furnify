import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Animated,
  StatusBar,
  Dimensions,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { Colors, Typography } from '../../theme';

const { width, height } = Dimensions.get('window');

export default function SplashScreen({ navigation }) {
  const { session, profile, loading } = useAuth();
  const logoScale = useRef(new Animated.Value(0.6)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animate logo in
    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          tension: 60,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(taglineOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    let timer;
    
    // Max splash duration — safety net
    const maxWait = setTimeout(() => {
      if (loading) {
        navigation.replace('Onboarding');
      }
    }, 4000);

    if (!loading) {
      clearTimeout(maxWait);
      // Small delay so the animation plays out
      timer = setTimeout(() => {
        if (session && profile) {
          if (profile.role === 'admin') {
            navigation.replace('AdminTabs');
          } else {
            navigation.replace('UserTabs');
          }
        } else {
          navigation.replace('Onboarding');
        }
      }, 2000);
    }

    return () => {
      clearTimeout(maxWait);
      if (timer) clearTimeout(timer);
    };
  }, [loading, session, profile]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      <Animated.View
        style={[
          styles.logoContainer,
          { opacity: logoOpacity, transform: [{ scale: logoScale }] },
        ]}
      >
        <Image
          source={require('../../../assets/images/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>

      <Animated.Text style={[styles.brandName, { opacity: textOpacity }]}>
        Furnify
      </Animated.Text>

      <Animated.Text style={[styles.tagline, { opacity: taglineOpacity }]}>
        Premium Furniture for Every Home
      </Animated.Text>

      {/* Bottom decorative element */}
      <View style={styles.bottomBar}>
        <View style={styles.dot} />
        <View style={[styles.dot, styles.dotActive]} />
        <View style={styles.dot} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: 24,
  },
  logo: {
    width: 120,
    height: 120,
  },
  brandName: {
    fontSize: Typography.size.xxxl,
    fontWeight: Typography.weight.extraBold,
    color: Colors.text,
    letterSpacing: 1,
    marginBottom: 10,
  },
  tagline: {
    fontSize: Typography.size.base,
    color: Colors.textSecondary,
    letterSpacing: 0.3,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 60,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.border,
  },
  dotActive: {
    width: 24,
    backgroundColor: Colors.primary,
  },
});
