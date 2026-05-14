import React from 'react';
import { View, ActivityIndicator, StyleSheet, Text, Platform } from 'react-native';
import { Colors, Typography } from '../theme';

export default function LoadingOverlay({ message = 'Loading...' }) {
  return (
    <View style={styles.overlay}>
      <View style={styles.card}>
        <ActivityIndicator size="large" color={Colors.primary} />
        {message ? <Text style={styles.message}>{message}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(250, 248, 245, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 28,
    alignItems: 'center',
    ...(Platform.OS === 'web'
      ? { boxShadow: '0px 8px 24px 0px rgba(44,37,34,0.14)' }
      : {
          shadowColor: 'rgba(44,37,34,0.14)',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 1,
          shadowRadius: 16,
          elevation: 8,
        }),
  },
  message: {
    marginTop: 12,
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
    fontWeight: Typography.weight.medium,
  },
});
