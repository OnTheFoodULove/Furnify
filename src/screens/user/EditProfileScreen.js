import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { supabase, uploadImage } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import Input from '../../components/Input';
import Button from '../../components/Button';
import LoadingOverlay from '../../components/LoadingOverlay';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../theme';
import {
  validateUsername,
  validateMobile,
  validateAddress,
} from '../../utils/validation';
import { sanitizeName, sanitizeMobile, sanitizeText } from '../../utils/sanitize';
import { validateImageAsset, generateStorageFileName, getContentType } from '../../utils/imageUtils';

export default function EditProfileScreen({ navigation }) {
  const { profile, refreshProfile } = useAuth();
  
  const [form, setForm] = useState({
    username: profile?.username || '',
    mobile_number: profile?.mobile_number || '',
    address: profile?.address || '',
  });
  
  const [imageAsset, setImageAsset] = useState(null);
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState(profile?.avatar_url);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  
  const mobileRef = useRef(null);
  const addressRef = useRef(null);

  function setField(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
  }

  async function pickImage() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow access to your photo library to upload images.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets?.length > 0) {
      const asset = result.assets[0];
      const validation = validateImageAsset(asset);
      if (!validation.valid) {
        Toast.show({ type: 'error', text1: 'Invalid Image', text2: validation.message });
        return;
      }
      setImageAsset(asset);
    }
  }

  function validate() {
    const newErrors = {};
    const usernameResult = validateUsername(form.username);
    if (!usernameResult.valid) newErrors.username = usernameResult.message;
    
    // Only validate if they typed something (these fields are optional in DB, but good to validate if present)
    if (form.mobile_number && form.mobile_number.trim() !== '') {
       const mobileResult = validateMobile(form.mobile_number);
       if (!mobileResult.valid) newErrors.mobile_number = mobileResult.message;
    }
    
    if (form.address && form.address.trim() !== '') {
       const addressResult = validateAddress(form.address);
       if (!addressResult.valid) newErrors.address = addressResult.message;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setLoading(true);

    try {
      let finalAvatarUrl = currentAvatarUrl;
      
      // Upload new avatar if selected
      if (imageAsset) {
        const fileName = generateStorageFileName('avatar', imageAsset.uri);
        const contentType = getContentType(imageAsset.uri);
        const { url, error: uploadError } = await uploadImage(
          'furniture-images', // Reuse bucket or create new one like 'avatars'
          fileName,
          imageAsset.uri,
          contentType
        );

        if (uploadError) throw new Error(uploadError);
        finalAvatarUrl = url;
      }

      const cleanUsername = sanitizeName(form.username);
      const cleanMobile = sanitizeMobile(form.mobile_number);
      const cleanAddress = sanitizeText(form.address);

      if (!profile?.id) {
        throw new Error('User profile not loaded. Please try again.');
      }

      const { error: updateError } = await supabase
        .from('users')
        .update({
          username: cleanUsername,
          mobile_number: cleanMobile,
          address: cleanAddress,
          avatar_url: finalAvatarUrl,
        })
        .eq('id', profile.id);

      if (updateError) throw updateError;

      await refreshProfile(); // Update Context

      Toast.show({
        type: 'success',
        text1: 'Profile Updated',
        text2: 'Your information has been saved successfully.',
      });
      navigation.goBack();
    } catch (err) {
      console.error(err);
      Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to update profile.' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {loading && <LoadingOverlay message="Saving profile..." />}
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={{ width: 42 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar picker */}
        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={pickImage} activeOpacity={0.8}>
            <View style={styles.avatarContainer}>
              {imageAsset || currentAvatarUrl ? (
                <Image 
                  source={{ uri: imageAsset ? imageAsset.uri : currentAvatarUrl }} 
                  style={styles.avatar} 
                />
              ) : (
                <View style={styles.avatarPlaceholder}>
                   <Text style={styles.avatarPlaceholderText}>
                     {form.username.charAt(0).toUpperCase() || 'U'}
                   </Text>
                </View>
              )}
              <View style={styles.editBadge}>
                <Ionicons name="camera" size={16} color={Colors.textInverse} />
              </View>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.form}>
          <Input
            label="Username"
            value={form.username}
            onChangeText={(v) => setField('username', v)}
            placeholder="johndoe"
            error={errors.username}
            returnKeyType="next"
            onSubmitEditing={() => mobileRef.current?.focus()}
            autoCapitalize="none"
            leftIcon={<Ionicons name="person-outline" size={18} color={Colors.textSecondary} />}
          />

          <Input
            inputRef={mobileRef}
            label="Mobile Number"
            value={form.mobile_number}
            onChangeText={(v) => setField('mobile_number', v)}
            placeholder="+1 234 567 8900"
            keyboardType="phone-pad"
            error={errors.mobile_number}
            returnKeyType="next"
            onSubmitEditing={() => addressRef.current?.focus()}
            leftIcon={<Ionicons name="call-outline" size={18} color={Colors.textSecondary} />}
          />

          <Input
            inputRef={addressRef}
            label="Delivery Address"
            value={form.address}
            onChangeText={(v) => setField('address', v)}
            placeholder="123 Main St, City, Country"
            multiline
            numberOfLines={3}
            error={errors.address}
            autoCapitalize="words"
          />
        </View>

        <Button
          title="Save Changes"
          onPress={handleSave}
          loading={loading}
          style={styles.saveBtn}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xxxl + Spacing.md,
    paddingBottom: Spacing.lg,
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.sm,
  },
  headerTitle: {
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.bold,
    color: Colors.text,
  },
  scrollContent: {
    padding: Spacing.xl,
    paddingBottom: Spacing.xxxl,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: Spacing.xxxl,
  },
  avatarContainer: {
    position: 'relative',
    ...Shadows.md,
  },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
  },
  avatarPlaceholder: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: Colors.primarySurface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholderText: {
    fontSize: Typography.size.display,
    fontWeight: Typography.weight.bold,
    color: Colors.primary,
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: Colors.surface,
  },
  form: { 
    marginBottom: Spacing.xl 
  },
  saveBtn: { 
    marginTop: Spacing.sm 
  },
});
