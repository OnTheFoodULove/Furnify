import React, { useState, useRef, useEffect } from 'react';
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
import Input from '../../components/Input';
import Button from '../../components/Button';
import LoadingOverlay from '../../components/LoadingOverlay';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../theme';
import {
  validateFurnitureName,
  validatePrice,
  validateRequired,
  validateDescription,
  validateStockQuantity,
  validateDiscount,
} from '../../utils/validation';
import {
  sanitizeName,
  sanitizeNumeric,
  sanitizeDescription,
  sanitizeAlphanumericSpace,
  sanitizeVariantChoice,
  sanitizeSignedNumeric,
} from '../../utils/sanitize';
import { validateImageAsset, generateStorageFileName, getContentType } from '../../utils/imageUtils';

const CATEGORIES = ['Living Room', 'Bedroom', 'Dining', 'Office', 'Outdoor', 'Kids'];

export default function EditFurnitureScreen({ route, navigation }) {
  const { item } = route.params;
  
  const [form, setForm] = useState({
    name: item.name || '',
    price: item.price ? String(item.price) : '',
    description: item.description || '',
    category: item.category || CATEGORIES[0],
    stock_quantity: item.stock_quantity !== undefined ? String(item.stock_quantity) : '',
    discount_percent: item.discount_percent ? String(item.discount_percent) : '',
    variants: item.variants || [],
  });
  
  const [imageAsset, setImageAsset] = useState(null);
  const [currentImageUrl, setCurrentImageUrl] = useState(item.image_url);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  
  const priceRef = useRef(null);
  const descRef = useRef(null);

  function setField(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
    if (field === 'variants' && errors.variants) {
      setErrors((e) => ({ ...e, variants: undefined }));
    }
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
    if (!imageAsset && !currentImageUrl) newErrors.image = 'Product must have an image';
    const nameResult = validateFurnitureName(form.name);
    if (!nameResult.valid) newErrors.name = nameResult.message;
    const priceResult = validatePrice(form.price);
    if (!priceResult.valid) newErrors.price = priceResult.message;
    const categoryResult = validateRequired(form.category, 'Category');
    if (!categoryResult.valid) newErrors.category = categoryResult.message;
    const descResult = validateDescription(form.description);
    if (!descResult.valid) newErrors.description = descResult.message;
    const stockResult = validateStockQuantity(form.stock_quantity);
    if (!stockResult.valid) newErrors.stock_quantity = stockResult.message;
    const discountResult = validateDiscount(form.discount_percent);
    if (!discountResult.valid) newErrors.discount_percent = discountResult.message;

    // Validate Variants array
    const variantErrors = [];
    let hasVariantErrors = false;
    form.variants.forEach((v, index) => {
      const rowErrors = {};
      const hasAny = (v.name && v.name.trim()) || (v.value && v.value.trim()) || (v.price_adjustment && String(v.price_adjustment).trim());
      if (hasAny) {
        if (!v.name || !v.name.trim()) {
          rowErrors.name = 'Type is required';
          hasVariantErrors = true;
        }
        if (!v.value || !v.value.trim()) {
          rowErrors.value = 'Choice is required';
          hasVariantErrors = true;
        }
        if (v.price_adjustment && String(v.price_adjustment).trim()) {
          const parsed = parseFloat(v.price_adjustment);
          if (isNaN(parsed)) {
            rowErrors.price_adjustment = 'Invalid number';
            hasVariantErrors = true;
          }
        }
      }
      variantErrors[index] = rowErrors;
    });

    if (hasVariantErrors) {
      newErrors.variants = variantErrors;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setLoading(true);

    try {
      let finalImageUrl = currentImageUrl;
      
      // Upload new image if selected
      if (imageAsset) {
        const fileName = generateStorageFileName('furniture', imageAsset.uri, imageAsset.mimeType);
        const contentType = getContentType(imageAsset.uri, imageAsset.mimeType);
        const { url, error: uploadError } = await uploadImage(
          'furniture-images',
          fileName,
          imageAsset.uri,
          contentType
        );

        if (uploadError) throw new Error(uploadError);
        finalImageUrl = url;
      }

      const cleanName = sanitizeName(form.name);
      const cleanPrice = parseFloat(sanitizeNumeric(form.price));
      const cleanDesc = sanitizeDescription(form.description);

      const { data, error: updateError } = await supabase
        .from('furniture')
        .update({
          name: cleanName,
          price: cleanPrice,
          image_url: finalImageUrl,
          description: cleanDesc,
          category: form.category,
          stock_quantity: parseInt(form.stock_quantity, 10) || 0,
          discount_percent: parseFloat(form.discount_percent) || 0,
          variants: form.variants.filter(v => v.name && v.name.trim() && v.value && v.value.trim()).map(v => ({
            name: v.name.trim(),
            value: v.value.trim(),
            price_adjustment: parseFloat(v.price_adjustment) || 0,
          })),
        })
        .eq('id', item.id)
        .select();

      if (updateError) throw updateError;
      if (!data || data.length === 0) {
        throw new Error('Access Denied: You do not have permission to update this product.');
      }

      await logActivity('EDIT', cleanName);

      Toast.show({
        type: 'success',
        text1: 'Furniture Updated!',
        text2: `"${cleanName}" has been successfully updated.`,
      });
      navigation.goBack();
    } catch (err) {
      console.error('[EditFurnitureScreen] handleSave error:', err);
      const errMsg = err.message || err.details || String(err);
      Toast.show({
        type: 'error',
        text1: 'Failed to Update Furniture',
        text2: errMsg,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {loading && <LoadingOverlay message="Saving changes..." />}
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Furniture</Text>
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
          {imageAsset || currentImageUrl ? (
            <>
              <Image 
                source={{ uri: imageAsset ? imageAsset.uri : currentImageUrl }} 
                style={styles.previewImage} 
                resizeMode="cover" 
              />
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
            label="Price (₱)"
            value={form.price}
            onChangeText={(v) => setField('price', sanitizeNumeric(v))}
            placeholder="e.g. 299.99"
            keyboardType="decimal-pad"
            error={errors.price}
            returnKeyType="next"
            onSubmitEditing={() => descRef.current?.focus()}
            leftIcon={<Ionicons name="pricetag-outline" size={18} color={Colors.textSecondary} />}
          />

          <Input
            label="Stock Quantity"
            value={form.stock_quantity}
            onChangeText={(v) => setField('stock_quantity', sanitizeNumeric(v))}
            placeholder="e.g. 50"
            keyboardType="number-pad"
            error={errors.stock_quantity}
            leftIcon={<Ionicons name="layers-outline" size={18} color={Colors.textSecondary} />}
          />

          <Input
            label="Discount % (optional)"
            value={form.discount_percent}
            onChangeText={(v) => setField('discount_percent', sanitizeNumeric(v))}
            placeholder="e.g. 15"
            keyboardType="decimal-pad"
            error={errors.discount_percent}
            leftIcon={<Ionicons name="pricetags-outline" size={18} color={Colors.textSecondary} />}
          />

          {/* Variants */}
          <Text style={styles.categoryLabel}>Variants (optional)</Text>
          {form.variants.map((variant, index) => (
            <View key={index} style={styles.variantRow}>
              <View style={styles.variantInputs}>
                <Input
                  label="Variant Type"
                  value={variant.name}
                  onChangeText={(v) => {
                    const cleaned = sanitizeAlphanumericSpace(v);
                    const updated = [...form.variants];
                    updated[index] = { ...updated[index], name: cleaned };
                    setField('variants', updated);
                  }}
                  placeholder="e.g. Color"
                  containerStyle={styles.variantInput}
                  error={errors.variants?.[index]?.name}
                />
                <Input
                  label="Option Choice"
                  value={variant.value}
                  onChangeText={(v) => {
                    const cleaned = sanitizeVariantChoice(v);
                    const updated = [...form.variants];
                    updated[index] = { ...updated[index], value: cleaned };
                    setField('variants', updated);
                  }}
                  placeholder="e.g. Walnut"
                  containerStyle={styles.variantInput}
                  error={errors.variants?.[index]?.value}
                />
                <Input
                  label="Price Impact (₱)"
                  value={variant.price_adjustment}
                  onChangeText={(v) => {
                    const cleaned = sanitizeSignedNumeric(v);
                    const updated = [...form.variants];
                    updated[index] = { ...updated[index], price_adjustment: cleaned };
                    setField('variants', updated);
                  }}
                  placeholder="e.g. +500"
                  keyboardType="numeric"
                  containerStyle={styles.variantInputSmall}
                  error={errors.variants?.[index]?.price_adjustment}
                />
              </View>
              <TouchableOpacity
                onPress={() => {
                  const updated = form.variants.filter((_, i) => i !== index);
                  setField('variants', updated);
                }}
                style={styles.removeVariantBtn}
              >
                <Ionicons name="close-circle" size={22} color={Colors.error} />
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity
            style={styles.addVariantBtn}
            onPress={() => {
              setField('variants', [...form.variants, { name: '', value: '', price_adjustment: '' }]);
            }}
          >
            <Ionicons name="add-circle-outline" size={20} color={Colors.primary} />
            <Text style={styles.addVariantText}>Add Variant</Text>
          </TouchableOpacity>

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
  variantRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  variantInputs: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  variantInput: {
    flex: 1,
    minWidth: 100,
  },
  variantInputSmall: {
    width: 80,
  },
  removeVariantBtn: {
    marginTop: 28,
    padding: Spacing.xs,
  },
  addVariantBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.base,
  },
  addVariantText: {
    fontSize: Typography.size.sm,
    color: Colors.primary,
    fontWeight: Typography.weight.semiBold,
  },
});
