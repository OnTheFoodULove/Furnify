import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/Button';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../theme';

export default function AdminProfileScreen({ navigation }) {
  const { profile, signOut } = useAuth();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Admin Profile</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            {profile?.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarPlaceholderText}>
                  {profile?.username?.charAt(0).toUpperCase() || 'A'}
                </Text>
              </View>
            )}
            <View style={styles.adminBadge}>
              <Ionicons name="shield-checkmark" size={14} color={Colors.textInverse} />
            </View>
          </View>

          <Text style={styles.username}>{profile?.username || 'Admin User'}</Text>
          <Text style={styles.roleText}>System Administrator</Text>
        </View>

        <View style={styles.infoSection}>
          <View style={styles.infoRow}>
            <Ionicons name="information-circle-outline" size={20} color={Colors.textSecondary} />
            <Text style={styles.infoText}>
              Admin profiles are read-only. Username and role cannot be changed.
            </Text>
          </View>
        </View>

        <Button
          title="Sign Out"
          onPress={async () => {
            await signOut();
            // Admin tab navigator is one level below root stack
            const rootNav = navigation.getParent() ?? navigation;
            rootNav.reset({
              index: 0,
              routes: [{ name: 'AuthStack' }],
            });
          }}
          variant="outline"
          icon={<Ionicons name="log-out-outline" size={20} color={Colors.primary} />}
          style={styles.signOutBtn}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xxxl + Spacing.md,
    paddingBottom: Spacing.lg,
  },
  headerTitle: {
    fontSize: Typography.size.xxl,
    fontWeight: Typography.weight.extraBold,
    color: Colors.text,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
  },
  profileCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    marginBottom: Spacing.lg,
    ...Shadows.sm,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: Spacing.md,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.primarySurface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholderText: {
    fontSize: Typography.size.display,
    fontWeight: Typography.weight.bold,
    color: Colors.primary,
  },
  adminBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: Colors.primary,
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: Colors.surface,
  },
  username: {
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.bold,
    color: Colors.text,
    marginBottom: 4,
  },
  roleText: {
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
    fontWeight: Typography.weight.medium,
  },
  infoSection: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.xl,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  infoText: {
    flex: 1,
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
    lineHeight: Typography.size.sm * 1.5,
  },
  signOutBtn: {
    marginTop: 'auto',
    marginBottom: Spacing.xxxl,
  },
});
