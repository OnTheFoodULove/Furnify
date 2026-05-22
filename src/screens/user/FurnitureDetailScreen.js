import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/Button';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../theme';

const { width } = Dimensions.get('window');

// Helper: build a fake cart-item shape for Checkout when using Buy Now
function buildSingleItemCart(item, quantity, selectedVariant = null) {
  const discountedPrice =
    item.discount_percent > 0
      ? item.price * (1 - item.discount_percent / 100)
      : null;
  const baseEffectivePrice = discountedPrice ?? item.price;
  const variantAdjustment = selectedVariant?.price_adjustment || 0;
  const effectivePrice = baseEffectivePrice + variantAdjustment;

  return [
    {
      id: `buynow-${item.id}`,
      quantity,
      furniture: {
        id: item.id,
        name: selectedVariant
          ? `${item.name} (${selectedVariant.name}: ${selectedVariant.value})`
          : item.name,
        price: effectivePrice,
        image_url: selectedVariant?.image_url || item.image_url,
        category: item.category,
      },
    },
  ];
}

export default function FurnitureDetailScreen({ route, navigation }) {
  const { item } = route.params;
  const { user } = useAuth();
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  // Selected variant (default to null)
  const [selectedVariant, setSelectedVariant] = useState(null); 
  
  // Compute effective price with discount and variant adjustment
  const discountedPrice =
    item.discount_percent > 0
      ? item.price * (1 - item.discount_percent / 100)
      : null;

  const baseEffectivePrice = discountedPrice ?? item.price;
  const variantAdjustment = selectedVariant?.price_adjustment || 0;
  const effectivePrice = baseEffectivePrice + variantAdjustment;
  const isOutOfStock = item.stock_quantity !== undefined && item.stock_quantity <= 0;

  const handleAddToCart = async () => {
    if (!user) {
      Toast.show({ type: 'info', text1: 'Please sign in to add items to your cart' });
      return;
    }
    if (isOutOfStock) {
      Toast.show({ type: 'info', text1: 'Out of Stock', text2: 'This item is currently unavailable.' });
      return;
    }
    
    setAddingToCart(true);
    
    try {
      // Check if item already exists in cart (with the same variant)
      const { data: existingItems, error: fetchError } = await supabase
        .from('cart_items')
        .select('id, quantity, selected_variant')
        .eq('user_id', user.id)
        .eq('furniture_id', item.id);

      if (fetchError) throw fetchError;

      // Fetch the latest stock from the database to ensure up‑to‑date validation
      const { data: freshItem, error: stockErr } = await supabase
        .from('furniture')
        .select('stock_quantity')
        .eq('id', item.id)
        .single();
      if (stockErr) throw stockErr;
      const availableStock = freshItem?.stock_quantity ?? 0;

      // Ensure the total quantity of all variants of this item in the cart does not exceed the available stock
      const totalExistingQty = existingItems?.reduce((sum, existing) => sum + existing.quantity, 0) || 0;
      if (totalExistingQty + quantity > availableStock) {
        Toast.show({
          type: 'info',
          text1: `Only ${availableStock} in stock`,
          text2: `You already have ${totalExistingQty} in your cart`,
        });
        setAddingToCart(false);
        return;
      }
      
      const areVariantsEqual = (v1, v2) => {
        if (!v1 && !v2) return true;
        if (!v1 || !v2) return false;
        return v1.name === v2.name && v1.value === v2.value;
      };

      const matchingItem = existingItems?.find(existing => 
        areVariantsEqual(existing.selected_variant, selectedVariant)
      );

      if (matchingItem) {
        // Update existing quantity for matching variant
        const { error: updateError } = await supabase
          .from('cart_items')
          .update({ quantity: matchingItem.quantity + quantity })
          .eq('id', matchingItem.id);
          
        if (updateError) throw updateError;
      } else {
        // Insert new cart item with selected variant
        const { error: insertError } = await supabase
          .from('cart_items')
          .insert({
            user_id: user.id,
            furniture_id: item.id,
            quantity: quantity,
            selected_variant: selectedVariant,
          });
          
        if (insertError) throw insertError;
      }
      
      Toast.show({
        type: 'success',
        text1: 'Added to Cart',
        text2: `${quantity}x ${item.name} added.`,
      });
      navigation.goBack();
    } catch (err) {
      console.error(err);
      Toast.show({ type: 'error', text1: 'Error adding to cart' });
    } finally {
      setAddingToCart(false);
    }
  };

  const handleBuyNow = () => {
    if (!user) {
      Toast.show({ type: 'info', text1: 'Please sign in to purchase items' });
      return;
    }
    if (isOutOfStock) {
      Toast.show({ type: 'info', text1: 'Out of Stock', text2: 'This item is currently unavailable.' });
      return;
    }
    const fakeCart = buildSingleItemCart(item, quantity, selectedVariant);
    const total = effectivePrice * quantity;
    navigation.navigate('Checkout', { cartItems: fakeCart, total });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Hero Image */}
        <View style={styles.imageContainer}>
          <Image
            source={selectedVariant && selectedVariant.image_url ? { uri: selectedVariant.image_url } : (item.image_url ? { uri: item.image_url } : require('../../../assets/images/empty-list.png'))}
            style={styles.image}
            resizeMode="cover"
          />
          {item.discount_percent > 0 && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountBadgeText}>-{item.discount_percent}% OFF</Text>
            </View>
          )}
          <View style={styles.headerButtons}>
            <TouchableOpacity style={styles.roundBtn} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color={Colors.text} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.roundBtn}
              onPress={() =>
                Toast.show({ type: 'info', text1: 'Wishlist', text2: 'Coming soon!' })
              }
            >
              <Ionicons name="heart-outline" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.detailsContainer}>
          <View style={styles.titleRow}>
            <Text style={styles.category}>{item.category}</Text>
            <Text style={styles.title}>{item.name}</Text>

            {/* Stock badge */}
            {item.stock_quantity !== undefined && (
              <Text style={[styles.stockBadge, isOutOfStock && styles.outOfStockBadge]}>
                {isOutOfStock ? 'Out of Stock' : `${item.stock_quantity} in stock`}
              </Text>
            )}

            {/* Price with discount */}
            <Text style={styles.price}>₱{Number(effectivePrice).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</Text>
          </View>

          {/* Variants */}
          {item.variants && item.variants.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Variants</Text>
              <TouchableOpacity onPress={() => setSelectedVariant(null)}>
                <View style={[styles.variantRow, selectedVariant === null && styles.variantSelected]}>
                  <Text style={styles.variantLabel}>Standard:</Text>
                  <Text style={styles.variantValue}>No variant selected</Text>
                  <Text style={styles.variantAdj}>₱0</Text>
                </View>
              </TouchableOpacity>
              {item.variants.map((variant, index) => (
                <TouchableOpacity key={index} onPress={() => setSelectedVariant(selectedVariant === variant ? null : variant)}>
                  <View style={[styles.variantRow, selectedVariant === variant && styles.variantSelected]}>
                    <Text style={styles.variantLabel}>{variant.name}:</Text>
                    <Text style={styles.variantValue}>{variant.value}</Text>
                    <Text style={styles.variantAdj}>
                      {variant.price_adjustment > 0 ? '+' : variant.price_adjustment < 0 ? '-' : ''}₱{Math.abs(Number(variant.price_adjustment)).toLocaleString()}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Quantity */}
          <View style={styles.section}>
            <View style={styles.quantityHeader}>
              <Text style={styles.sectionTitle}>Quantity</Text>
              <View style={styles.quantityControl}>
                <TouchableOpacity 
                  style={styles.qtyBtn} 
                  onPress={() => setQuantity(Math.max(1, quantity - 1))}
                >
                  <Ionicons name="remove" size={20} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.qtyText}>{quantity}</Text>
                <TouchableOpacity 
                  style={styles.qtyBtn}
                  onPress={() => {
                    if (item.stock_quantity !== undefined && quantity >= item.stock_quantity) {
                      Toast.show({ type: 'info', text1: `Only ${item.stock_quantity} in stock` });
                      return;
                    }
                    setQuantity(quantity + 1);
                  }}
                >
                  <Ionicons name="add" size={20} color={Colors.text} />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>
              {item.description || 'No description available for this item.'}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomBar}>
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.tryInRoomBtn}
            onPress={() => navigation.navigate('ImagePlacement', { item })}
          >
            <Ionicons name="scan-outline" size={24} color={Colors.primary} />
          </TouchableOpacity>

          <View style={styles.ctaButtons}>
            <Button
              title="Add to Cart"
              variant="outline"
              loading={addingToCart}
              onPress={handleAddToCart}
              style={styles.addToCartBtn}
              disabled={isOutOfStock}
            />
            <Button
              title={isOutOfStock ? 'Unavailable' : 'Buy Now'}
              variant="primary"
              onPress={handleBuyNow}
              style={styles.buyNowBtn}
              disabled={isOutOfStock}
            />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  imageContainer: {
    width: width,
    height: width * 1.1,
    position: 'relative',
    backgroundColor: Colors.surfaceElevated,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  discountBadge: {
    position: 'absolute',
    bottom: 44,
    left: Spacing.xl,
    backgroundColor: Colors.error,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    zIndex: 2,
  },
  discountBadgeText: {
    fontSize: Typography.size.xs,
    color: Colors.textInverse,
    fontWeight: Typography.weight.bold,
  },
  headerButtons: {
    position: 'absolute',
    top: 50,
    left: Spacing.xl,
    right: Spacing.xl,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  roundBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.sm,
  },
  detailsContainer: {
    padding: Spacing.xl,
    marginTop: -30,
    backgroundColor: Colors.background,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
  },
  titleRow: {
    marginBottom: Spacing.xl,
  },
  category: {
    fontSize: Typography.size.sm,
    color: Colors.primary,
    fontWeight: Typography.weight.bold,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: Spacing.sm,
  },
  title: {
    fontSize: Typography.size.xxxl,
    fontWeight: Typography.weight.extraBold,
    color: Colors.text,
    marginBottom: Spacing.sm,
    lineHeight: 40,
  },
  stockBadge: {
    fontSize: Typography.size.xs,
    color: Colors.success,
    fontWeight: Typography.weight.bold,
    marginBottom: Spacing.sm,
  },
  outOfStockBadge: {
    color: Colors.error,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  originalPrice: {
    fontSize: Typography.size.lg,
    color: Colors.textMuted,
    textDecorationLine: 'line-through',
  },
  price: {
    fontSize: Typography.size.xxl,
    fontWeight: Typography.weight.bold,
    color: Colors.primary,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.bold,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  variantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: Spacing.sm,
  },
  variantSelected: {
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  variantLabel: {
    fontSize: Typography.size.base,
    color: Colors.textSecondary,
    fontWeight: Typography.weight.medium,
    minWidth: 70,
  },
  variantValue: {
    fontSize: Typography.size.base,
    color: Colors.text,
    fontWeight: Typography.weight.semiBold,
    flex: 1,
  },
  variantAdj: {
    fontSize: Typography.size.sm,
    color: Colors.primary,
    fontWeight: Typography.weight.semiBold,
  },
  quantityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    ...Shadows.sm,
  },
  qtyBtn: {
    padding: Spacing.sm,
  },
  qtyText: {
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.bold,
    marginHorizontal: Spacing.md,
  },
  description: {
    fontSize: Typography.size.base,
    color: Colors.textSecondary,
    lineHeight: 24,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Platform.OS === 'ios' ? 34 : Spacing.md,
    ...Shadows.lg,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  tryInRoomBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.primarySurface,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  ctaButtons: {
    flex: 1,
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  addToCartBtn: {
    flex: 1,
  },
  buyNowBtn: {
    flex: 1,
  },
});
