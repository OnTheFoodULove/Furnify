import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  StatusBar,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../context/AuthContext';
import { supabase, uploadImage } from '../../lib/supabase';
import Button from '../../components/Button';
import LoadingOverlay from '../../components/LoadingOverlay';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../theme';
import { validateImageAsset, generateStorageFileName, getContentType } from '../../utils/imageUtils';

export default function AdminProfileScreen({ navigation }) {
  const { profile, refreshProfile, signOut } = useAuth();
  const [uploading, setUploading] = useState(false);

  async function pickAndUploadAvatar() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow access to your photo library.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled || !result.assets?.length) return;

    const asset = result.assets[0];
    const validation = validateImageAsset(asset);
    if (!validation.valid) {
      Toast.show({ type: 'error', text1: 'Invalid Image', text2: validation.message });
      return;
    }

    setUploading(true);
    try {
      const fileName = generateStorageFileName('avatar', asset.uri);
      const contentType = getContentType(asset.uri);
      const { url, error: uploadError } = await uploadImage(
        'furniture-images',
        fileName,
        asset.uri,
        contentType
      );
      if (uploadError) throw new Error(uploadError);

      const { error: updateError } = await supabase
        .from('users')
        .update({ avatar_url: url })
        .eq('id', profile.id);
      if (updateError) throw updateError;

      await refreshProfile();
      Toast.show({ type: 'success', text1: 'Avatar Updated', text2: 'Your profile picture has been saved.' });
    } catch (err) {
      console.error('[AdminProfile] avatar upload error:', err.message);
      Toast.show({ type: 'error', text1: 'Upload Failed', text2: 'Could not update avatar.' });
    } finally {
      setUploading(false);
    }
  }

  return (
    <View style={styles.container}>
      {uploading && <LoadingOverlay message="Updating avatar..." />}
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Admin Profile</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.profileCard}>
          {/* Tappable avatar */}
          <TouchableOpacity onPress={pickAndUploadAvatar} activeOpacity={0.85}>
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
              {/* Shield badge */}
              <View style={styles.adminBadge}>
                <Ionicons name="shield-checkmark" size={14} color={Colors.textInverse} />
              </View>
              {/* Camera overlay hint */}
              <View style={styles.cameraOverlay}>
                <Ionicons name="camera" size={16} color={Colors.textInverse} />
              </View>
            </View>
          </TouchableOpacity>

          <Text style={styles.username}>{profile?.username || 'Admin User'}</Text>
          <Text style={styles.roleText}>System Administrator</Text>
          <Text style={styles.tapHint}>Tap avatar to change photo</Text>
        </View>

        <View style={styles.infoSection}>
          <View style={styles.infoRow}>
            <Ionicons name="lock-closed-outline" size={18} color={Colors.textSecondary} />
            <Text style={styles.infoText}>
              Username and role are read-only. Contact your system administrator to make changes.
            </Text>
          </View>
        </View>

        <Button
          title="Sign Out"
          onPress={async () => {
            await signOut();
          }}
          variant="outline"
          icon={<Ionicons name="log-out-outline" size={20} color={Colors.primary} />}
          style={styles.signOutBtn}
        />
      </ScrollView>
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
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xxxl,
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
  cameraOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 50,
    backgroundColor: 'rgba(0,0,0,0.28)',
    justifyContent: 'center',
    alignItems: 'center',
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
    marginBottom: Spacing.xs,
  },
  tapHint: {
    fontSize: Typography.size.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  infoSection: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.xl,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  infoText: {
    flex: 1,
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
    lineHeight: Typography.size.sm * 1.5,
  },
  signOutBtn: {
    marginTop: Spacing.sm,
  },
});
