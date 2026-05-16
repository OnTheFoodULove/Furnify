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

const STATIC_COLORS = ['#C17F5E', '#2C2522', '#8A7F7A', '#F5F1EC'];

// Helper: build a fake cart-item shape for Checkout when using Buy Now
function buildSingleItemCart(item, quantity) {
  return [
    {
      id: `buynow-${item.id}`,
      quantity,
      furniture: {
        id: item.id,
        name: item.name,
        price: item.price,
        image_url: item.image_url,
        category: item.category,
      },
    },
  ];
}

export default function FurnitureDetailScreen({ route, navigation }) {
  const { item } = route.params;
  const { user } = useAuth();
  const [selectedColor, setSelectedColor] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);

  const handleAddToCart = async () => {
    if (!user) {
      Toast.show({ type: 'info', text1: 'Please sign in to add items to your cart' });
      return;
    }
    
    setAddingToCart(true);
    
    try {
      // Check if item already exists in cart
      const { data: existingItems, error: fetchError } = await supabase
        .from('cart_items')
        .select('*')
        .eq('user_id', user.id)
        .eq('furniture_id', item.id);
        
      if (fetchError) throw fetchError;
      
      if (existingItems && existingItems.length > 0) {
        // Update existing quantity
        const existing = existingItems[0];
        const { error: updateError } = await supabase
          .from('cart_items')
          .update({ quantity: existing.quantity + quantity })
          .eq('id', existing.id);
          
        if (updateError) throw updateError;
      } else {
        // Insert new cart item
        const { error: insertError } = await supabase
          .from('cart_items')
          .insert({
            user_id: user.id,
            furniture_id: item.id,
            quantity: quantity,
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
    const fakeCart = buildSingleItemCart(item, quantity);
    const total = item.price * quantity;
    navigation.navigate('Checkout', { cartItems: fakeCart, total });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Hero Image */}
        <View style={styles.imageContainer}>
          <Image
            source={item.image_url ? { uri: item.image_url } : require('../../../assets/images/empty-list.png')}
            style={styles.image}
            resizeMode="cover"
          />
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
            <Text style={styles.price}>${Number(item.price).toLocaleString()}</Text>
          </View>

          {/* Color Selector */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Colors</Text>
            <View style={styles.colorsRow}>
              {STATIC_COLORS.map((color, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.colorOuter,
                    selectedColor === index && { borderColor: color },
                  ]}
                  onPress={() => setSelectedColor(index)}
                >
                  <View style={[styles.colorInner, { backgroundColor: color }]} />
                </TouchableOpacity>
              ))}
            </View>
          </View>

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
                    onPress={() => setQuantity(quantity + 1)}
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
             />
             <Button
               title="Buy Now"
               variant="primary"
               onPress={handleBuyNow}
               style={styles.buyNowBtn}
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
  colorsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  colorOuter: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorInner: {
    width: 26,
    height: 26,
    borderRadius: 13,
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
