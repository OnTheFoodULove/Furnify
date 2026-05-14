import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
} from 'react-native';
import { Colors, Typography, BorderRadius, Spacing, Layout } from '../theme';

/**
 * Reusable Button component
 * Variants: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
 * Sizes: 'sm' | 'md' | 'lg'
 */
export default function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'lg',
  loading = false,
  disabled = false,
  icon,
  iconRight,
  style,
  textStyle,
  fullWidth = true,
}) {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.75}
      style={[
        styles.base,
        styles[variant],
        styles[`size_${size}`],
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' || variant === 'danger' ? Colors.textInverse : Colors.primary}
          size="small"
        />
      ) : (
        <View style={styles.content}>
          {icon && <View style={styles.iconLeft}>{icon}</View>}
          <Text
            style={[
              styles.text,
              styles[`text_${variant}`],
              styles[`textSize_${size}`],
              textStyle,
            ]}
          >
            {title}
          </Text>
          {iconRight && <View style={styles.iconRight}>{iconRight}</View>}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  fullWidth: {
    width: '100%',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconLeft: {
    marginRight: Spacing.sm,
  },
  iconRight: {
    marginLeft: Spacing.sm,
  },

  // Variants
  primary: {
    backgroundColor: Colors.primary,
  },
  secondary: {
    backgroundColor: Colors.surfaceElevated,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  danger: {
    backgroundColor: Colors.error,
  },

  // Disabled state
  disabled: {
    opacity: 0.5,
  },

  // Sizes
  size_sm: {
    height: 38,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
  size_md: {
    height: 44,
    paddingHorizontal: Spacing.lg,
  },
  size_lg: {
    height: Layout.buttonHeight,
    paddingHorizontal: Spacing.xl,
  },

  // Text base
  text: {
    fontWeight: Typography.weight.semiBold,
    textAlign: 'center',
  },

  // Text by variant
  text_primary: {
    color: Colors.textInverse,
  },
  text_secondary: {
    color: Colors.text,
  },
  text_outline: {
    color: Colors.primary,
  },
  text_ghost: {
    color: Colors.primary,
  },
  text_danger: {
    color: Colors.textInverse,
  },

  // Text sizes
  textSize_sm: {
    fontSize: Typography.size.sm,
  },
  textSize_md: {
    fontSize: Typography.size.base,
  },
  textSize_lg: {
    fontSize: Typography.size.base,
    letterSpacing: 0.3,
  },
});
