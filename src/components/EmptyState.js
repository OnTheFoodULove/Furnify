import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import Button from './Button';
import { Colors, Typography, Spacing } from '../theme';

/**
 * Empty state component with illustration, title, subtitle, and optional CTA
 */
export default function EmptyState({
  image,
  title,
  subtitle,
  buttonTitle,
  onButtonPress,
}) {
  return (
    <View style={styles.container}>
      {image && (
        <Image source={image} style={styles.image} resizeMode="contain" />
      )}
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      {buttonTitle && onButtonPress ? (
        <Button
          title={buttonTitle}
          onPress={onButtonPress}
          style={styles.button}
          fullWidth={false}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xxxl,
  },
  image: {
    width: 200,
    height: 200,
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.bold,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: Typography.size.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: Typography.size.base * 1.6,
    marginBottom: Spacing.xl,
  },
  button: {
    paddingHorizontal: Spacing.xxxl,
  },
});
