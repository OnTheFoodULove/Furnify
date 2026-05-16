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
import { supabase, logActivity, uploadImage } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import Input from '../../components/Input';
import Button from '../../components/Button';
import LoadingOverlay from '../../components/LoadingOverlay';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../theme';
import {
  validateFurnitureName,
  validatePrice,
  validateRequired,
  validateDescription,
} from '../../utils/validation';
import { sanitizeName, sanitizeNumeric, sanitizeDescription } from '../../utils/sanitize';
import { validateImageAsset, generateStorageFileName, getContentType } from '../../utils/imageUtils';

const CATEGORIES = ['Living Room', 'Bedroom', 'Dining', 'Office', 'Outdoor', 'Kids'];

export default function AddFurnitureScreen({ navigation }) {
  const { profile } = useAuth();
  const [form, setForm] = useState({
    name: '',
    price: '',
    description: '',
    category: CATEGORIES[0],
  });
  const [imageAsset, setImageAsset] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const priceRef = useRef(null);
  const descRef = useRef(null);

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
      aspect: [4, 3],
      quality: 0.85,
    });

    if (!result.canceled && result.assets?.length > 0) {
      const asset = result.assets[0];
      const validation = validateImageAsset(asset);
      if (!validation.valid) {
        Toast.show({ type: 'error', text1: 'Invalid Image', text2: validation.message });
        return;
      }
      setImageAsset(asset);
      if (errors.image) setErrors((e) => ({ ...e, image: undefined }));
    }
  }

  function validate() {
    const newErrors = {};
    if (!imageAsset) newErrors.image = 'Please select a product image';
    const nameResult = validateFurnitureName(form.name);
    if (!nameResult.valid) newErrors.name = nameResult.message;
    const priceResult = validatePrice(form.price);
    if (!priceResult.valid) newErrors.price = priceResult.message;
    const categoryResult = validateRequired(form.category, 'Category');
    if (!categoryResult.valid) newErrors.category = categoryResult.message;
    const descResult = validateDescription(form.description);
    if (!descResult.valid) newErrors.description = descResult.message;
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setLoading(true);

    try {
      // Upload image
      const fileName = generateStorageFileName('furniture', imageAsset.uri, imageAsset.mimeType);
      const contentType = getContentType(imageAsset.uri, imageAsset.mimeType);
      const { url, error: uploadError } = await uploadImage(
        'furniture-images',
        fileName,
        imageAsset.uri,
        contentType
      );

      if (uploadError) throw new Error(uploadError);

      const cleanName = sanitizeName(form.name);
      const cleanPrice = parseFloat(sanitizeNumeric(form.price));
      const cleanDesc = sanitizeDescription(form.description);

      const { error: insertError } = await supabase.from('furniture').insert({
        name: cleanName,
        price: cleanPrice,
        image_url: url,
        description: cleanDesc,
        category: form.category,
        is_hidden: false,
      });

      if (insertError) throw insertError;

      await logActivity('ADD', cleanName);

      Toast.show({
        type: 'success',
        text1: 'Furniture Added!',
        text2: `"${cleanName}" is now live in the store.`,
      });
      navigation.goBack();
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to add furniture. Please try again.' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {loading && <LoadingOverlay message="Uploading & saving..." />}
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Furniture</Text>
        <View style={{ width: 42 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Image picker */}
        <TouchableOpacity
          style={[styles.imagePicker, errors.image && styles.imagePickerError]}
          onPress={pickImage}
          activeOpacity={0.8}
        >
          {imageAsset ? (
            <>
              <Image source={{ uri: imageAsset.uri }} style={styles.previewImage} resizeMode="cover" />
              <View style={styles.imageEditOverlay}>
                <Ionicons name="camera" size={22} color={Colors.textInverse} />
                <Text style={styles.imageEditText}>Change Photo</Text>
              </View>
            </>
          ) : (
            <View style={styles.imagePickerPlaceholder}>
              <View style={styles.imagePlaceholderIcon}>
                <Ionicons name="camera-outline" size={32} color={Colors.primary} />
              </View>
              <Text style={styles.imagePlaceholderTitle}>Add Product Photo</Text>
              <Text style={styles.imagePlaceholderSubtitle}>JPG, PNG or WebP · Max 5MB</Text>
            </View>
          )}
        </TouchableOpacity>
        {errors.image && (
          <View style={styles.imageErrorRow}>
            <Ionicons name="alert-circle-outline" size={13} color={Colors.error} />
            <Text style={styles.imageErrorText}>{errors.image}</Text>
          </View>
        )}

        <View style={styles.form}>
          <Input
            label="Furniture Name"
            value={form.name}
            onChangeText={(v) => setField('name', v)}
            placeholder="e.g. Nordic Lounge Chair"
            error={errors.name}
            returnKeyType="next"
            onSubmitEditing={() => priceRef.current?.focus()}
            autoCapitalize="words"
            leftIcon={<Ionicons name="cube-outline" size={18} color={Colors.textSecondary} />}
          />

          <Input
            inputRef={priceRef}
            label="Price (USD)"
            value={form.price}
            onChangeText={(v) => setField('price', sanitizeNumeric(v))}
            placeholder="e.g. 299.99"
            keyboardType="decimal-pad"
            error={errors.price}
            returnKeyType="next"
            onSubmitEditing={() => descRef.current?.focus()}
            leftIcon={<Ionicons name="pricetag-outline" size={18} color={Colors.textSecondary} />}
          />

          {/* Category selector */}
          <Text style={styles.categoryLabel}>Category</Text>
          <View style={styles.categoryGrid}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryOption,
                  form.category === cat && styles.categoryOptionActive,
                ]}
                onPress={() => setField('category', cat)}
              >
                <Text
                  style={[
                    styles.categoryOptionText,
                    form.category === cat && styles.categoryOptionTextActive,
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Input
            inputRef={descRef}
            label="Description (optional)"
            value={form.description}
            onChangeText={(v) => setField('description', v)}
            placeholder="Describe the material, dimensions, features..."
            multiline
            numberOfLines={4}
            error={errors.description}
            autoCapitalize="sentences"
            maxLength={1000}
          />
          {form.description.length > 0 && (
            <Text style={styles.charCount}>{form.description.length}/1000</Text>
          )}
        </View>

        <Button
          title="Add to Inventory"
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
  imagePicker: {
    width: '100%',
    height: 220,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    marginBottom: Spacing.md,
  },
  imagePickerError: {
    borderColor: Colors.error,
    backgroundColor: Colors.errorSurface,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  imageEditOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(44,37,34,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  imageEditText: {
    color: Colors.textInverse,
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.semiBold,
  },
  imagePickerPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  imagePlaceholderIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primarySurface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderTitle: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.semiBold,
    color: Colors.text,
  },
  imagePlaceholderSubtitle: {
    fontSize: Typography.size.sm,
    color: Colors.textMuted,
  },
  imageErrorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: Spacing.md,
    marginTop: -Spacing.sm,
  },
  imageErrorText: {
    fontSize: Typography.size.xs,
    color: Colors.error,
  },
  form: { marginBottom: Spacing.md },
  categoryLabel: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.semiBold,
    color: Colors.text,
    marginBottom: Spacing.sm,
    letterSpacing: 0.2,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.base,
  },
  categoryOption: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm - 2,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  categoryOptionActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primarySurface,
  },
  categoryOptionText: {
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
    fontWeight: Typography.weight.medium,
  },
  categoryOptionTextActive: {
    color: Colors.primary,
    fontWeight: Typography.weight.semiBold,
  },
  charCount: {
    fontSize: Typography.size.xs,
    color: Colors.textMuted,
    textAlign: 'right',
    marginTop: -Spacing.md,
    marginBottom: Spacing.base,
  },
  saveBtn: { marginTop: Spacing.sm },
});
