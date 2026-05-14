import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, BorderRadius, Spacing, Layout } from '../theme';

/**
 * Reusable Input component with validation error display
 * and password show/hide toggle
 */
export default function Input({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
  autoCorrect = false,
  multiline = false,
  numberOfLines = 1,
  maxLength,
  leftIcon,
  editable = true,
  returnKeyType,
  onSubmitEditing,
  inputRef,
  style,
  containerStyle,
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const isPassword = secureTextEntry;
  const actualSecure = isPassword && !showPassword;

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <View
        style={[
          styles.inputWrapper,
          isFocused && styles.inputWrapperFocused,
          error && styles.inputWrapperError,
          !editable && styles.inputWrapperDisabled,
        ]}
      >
        {leftIcon && (
          <View style={styles.leftIconContainer}>{leftIcon}</View>
        )}

        <TextInput
          ref={inputRef}
          style={[
            styles.input,
            leftIcon && styles.inputWithLeftIcon,
            isPassword && styles.inputWithRightIcon,
            multiline && styles.multilineInput,
            !editable && styles.inputDisabled,
            style,
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={Colors.textMuted}
          secureTextEntry={actualSecure}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          multiline={multiline}
          numberOfLines={multiline ? numberOfLines : undefined}
          maxLength={maxLength}
          editable={editable}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />

        {isPassword && (
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setShowPassword((v) => !v)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={Colors.textSecondary}
            />
          </TouchableOpacity>
        )}
      </View>

      {error ? (
        <View style={styles.errorRow}>
          <Ionicons name="alert-circle-outline" size={13} color={Colors.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.base,
  },
  label: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.semiBold,
    color: Colors.text,
    marginBottom: Spacing.xs + 2,
    letterSpacing: 0.2,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    height: Layout.inputHeight,
    overflow: 'hidden',
  },
  inputWrapperFocused: {
    borderColor: Colors.borderFocus,
    backgroundColor: Colors.surface,
  },
  inputWrapperError: {
    borderColor: Colors.error,
    backgroundColor: Colors.errorSurface,
  },
  inputWrapperDisabled: {
    backgroundColor: Colors.surfaceElevated,
    borderColor: Colors.border,
  },
  leftIconContainer: {
    paddingLeft: Spacing.md,
    paddingRight: Spacing.xs,
  },
  input: {
    flex: 1,
    height: '100%',
    paddingHorizontal: Spacing.md,
    fontSize: Typography.size.base,
    color: Colors.text,
    fontWeight: Typography.weight.regular,
  },
  inputWithLeftIcon: {
    paddingLeft: Spacing.xs,
  },
  inputWithRightIcon: {
    paddingRight: 0,
  },
  inputDisabled: {
    color: Colors.textSecondary,
  },
  multilineInput: {
    height: undefined,
    minHeight: Layout.inputHeight,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
    textAlignVertical: 'top',
  },
  eyeButton: {
    paddingHorizontal: Spacing.md,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
    gap: 4,
  },
  errorText: {
    fontSize: Typography.size.xs,
    color: Colors.error,
    flex: 1,
  },
});
