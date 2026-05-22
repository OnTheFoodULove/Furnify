import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/Button';
import LoadingOverlay from '../../components/LoadingOverlay';
import EmptyState from '../../components/EmptyState';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../theme';

export default function CartScreen({ navigation }) {
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [selectedItemIds, setSelectedItemIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const prevCartCount = useRef(0);

  const toggleSelectItem = (id) => {
    setSelectedItemIds(prev =>
      prev.includes(id) ? prev.filter(itemId => itemId !== id) : [...prev, id]
    );
  };

  const fetchCart = useCallback(async () => {
    if (!user) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('cart_items')
        .select(`
          id,
          quantity,
          selected_variant,
          furniture:furniture_id (
            id,
            name,
            price,
            image_url,
            category,
            discount_percent
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

        if (error) throw error;
        if (data) {
          setCartItems(data);
          setSelectedItemIds(prev => {
            if (prev.length === 0) {
              return data.map(item => item.id);
            }
            return prev.filter(id => data.some(item => item.id === id));
          });
          if (prevCartCount.current && data.length > prevCartCount.current) {
            Toast.show({ type: 'success', text1: 'Item added to cart' });
          }
          prevCartCount.current = data.length;
        } else {
          setCartItems([]);
          setSelectedItemIds([]);
        }
    } catch (err) {
      console.error(err);
      Toast.show({ type: 'error', text1: 'Error fetching cart' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      fetchCart();
    }, [fetchCart])
  );

  useEffect(() => {
    if (user) {
      // Subscribe to real-time changes as a fallback
      const channel = supabase
        .channel('user_cart')
        .on('postgres_changes', { 
            event: '*', 
            schema: 'public', 
            table: 'cart_items'
          }, 
          fetchCart
        )
        .subscribe();
      return () => supabase.removeChannel(channel);
    }
  }, [fetchCart, user]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchCart();
  };

  const updateQuantity = async (id, newQuantity) => {
    if (newQuantity < 1) return;
    setUpdatingId(id);
    
    try {
      const { error } = await supabase
        .from('cart_items')
        .update({ quantity: newQuantity })
        .eq('id', id);

      if (error) throw error;
      
      // Update local state for immediate feedback
      setCartItems(prev => prev.map(item => 
        item.id === id ? { ...item, quantity: newQuantity } : item
      ));
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Failed to update quantity' });
    } finally {
      setUpdatingId(null);
    }
  };

  const removeItem = async (id) => {
    setUpdatingId(id);
    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setCartItems(prev => prev.filter(item => item.id !== id));
      Toast.show({ type: 'success', text1: 'Item removed from cart' });
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Failed to remove item' });
    } finally {
      setUpdatingId(null);
    }
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => {
      if (!item.furniture) return total; 
      if (!selectedItemIds.includes(item.id)) return total;
      
      const discountedPrice =
        item.furniture.discount_percent > 0
          ? item.furniture.price * (1 - item.furniture.discount_percent / 100)
          : null;
      const baseEffectivePrice = discountedPrice ?? item.furniture.price;
      const variantAdjustment = item.selected_variant?.price_adjustment || 0;
      const effectivePrice = baseEffectivePrice + variantAdjustment;

      return total + (effectivePrice * item.quantity);
    }, 0);
  };

  const handleCheckout = () => {
    const checkedItems = cartItems.filter(item => selectedItemIds.includes(item.id));
    if (checkedItems.length === 0) {
      Toast.show({ type: 'info', text1: 'Please select items to checkout' });
      return;
    }

    const mappedCheckedItems = checkedItems.map(item => {
      const discountedPrice =
        item.furniture.discount_percent > 0
          ? item.furniture.price * (1 - item.furniture.discount_percent / 100)
          : null;
      const baseEffectivePrice = discountedPrice ?? item.furniture.price;
      const variantAdjustment = item.selected_variant?.price_adjustment || 0;
      const effectivePrice = baseEffectivePrice + variantAdjustment;

      return {
        ...item,
        furniture: {
          ...item.furniture,
          name: item.selected_variant
            ? `${item.furniture.name} (${item.selected_variant.name}: ${item.selected_variant.value})`
            : item.furniture.name,
          price: effectivePrice,
        }
      };
    });

    navigation.navigate('Checkout', { cartItems: mappedCheckedItems, total });
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <EmptyState
          image={require('../../../assets/images/empty-cart.png')}
          title="Sign in to view cart"
          subtitle="You need to be signed in to add and view items in your cart."
          buttonTitle="Sign In"
          onButtonPress={() => navigation.navigate('UserLogin')}
        />
      </View>
    );
  }

  if (loading) return <LoadingOverlay message="Loading cart..." />;

  const total = calculateTotal();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Shopping Cart</Text>
      </View>

      <FlatList
        data={cartItems}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.primary} />
        }
        renderItem={({ item }) => {
          if (!item.furniture) return null; // Skip if referenced furniture is missing
          
          const discountedPrice =
            item.furniture.discount_percent > 0
              ? item.furniture.price * (1 - item.furniture.discount_percent / 100)
              : null;
          const baseEffectivePrice = discountedPrice ?? item.furniture.price;
          const variantAdjustment = item.selected_variant?.price_adjustment || 0;
          const effectivePrice = baseEffectivePrice + variantAdjustment;
          
          return (
            <View style={[styles.cartItem, Shadows.sm]}>
              <TouchableOpacity 
                style={styles.checkboxContainer}
                onPress={() => toggleSelectItem(item.id)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons 
                  name={selectedItemIds.includes(item.id) ? "checkbox" : "square-outline"} 
                  size={24} 
                  color={selectedItemIds.includes(item.id) ? Colors.primary : Colors.textMuted} 
                />
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.itemImageContainer}
                onPress={() => navigation.navigate('FurnitureDetail', { item: item.furniture })}
              >
                <Image
                  source={
                    item.selected_variant?.image_url
                      ? { uri: item.selected_variant.image_url }
                      : (item.furniture.image_url
                        ? { uri: item.furniture.image_url }
                        : require('../../../assets/images/empty-list.png'))
                  }
                  style={styles.itemImage}
                  resizeMode="cover"
                />
              </TouchableOpacity>
              
              <View style={styles.itemDetails}>
                <View style={styles.itemHeaderRow}>
                  <Text style={styles.itemName} numberOfLines={1}>{item.furniture.name}</Text>
                  <TouchableOpacity 
                    onPress={() => removeItem(item.id)}
                    disabled={updatingId === item.id}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons name="trash-outline" size={20} color={Colors.error} />
                  </TouchableOpacity>
                </View>
                
                <Text style={styles.itemCategory}>{item.furniture.category}</Text>
                
                {item.selected_variant && (
                  <Text style={styles.itemVariant}>
                    {item.selected_variant.name}: {item.selected_variant.value}
                  </Text>
                )}
                
                <View style={styles.itemFooterRow}>
                  <Text style={styles.itemPrice}>
                    ₱{Number(effectivePrice).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </Text>
                  
                  <View style={styles.quantityControl}>
                    <TouchableOpacity 
                      style={styles.qtyBtn}
                      onPress={() => updateQuantity(item.id, item.quantity - 1)}
                      disabled={updatingId === item.id || item.quantity <= 1}
                    >
                      <Ionicons 
                        name="remove" 
                        size={16} 
                        color={item.quantity <= 1 ? Colors.border : Colors.text} 
                      />
                    </TouchableOpacity>
                    
                    <Text style={styles.qtyText}>{item.quantity}</Text>
                    
                    <TouchableOpacity 
                      style={styles.qtyBtn}
                      onPress={() => updateQuantity(item.id, item.quantity + 1)}
                      disabled={updatingId === item.id}
                    >
                      <Ionicons name="add" size={16} color={Colors.text} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <EmptyState
            image={require('../../../assets/images/empty-cart.png')}
            title="Your cart is empty"
            subtitle="Looks like you haven't added any furniture to your cart yet."
            buttonTitle="Start Shopping"
            onButtonPress={() => navigation.navigate('Home')}
          />
        }
      />

      {cartItems.length > 0 && (
        <View style={styles.bottomBar}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total:</Text>
            <Text style={styles.summaryValue}>₱{total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
          </View>
          <Button
            title="Checkout"
            onPress={handleCheckout}
            style={styles.checkoutBtn}
          />
        </View>
      )}
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
    paddingBottom: Spacing.base,
    backgroundColor: Colors.background,
  },
  headerTitle: {
    fontSize: Typography.size.xxl,
    fontWeight: Typography.weight.extraBold,
    color: Colors.text,
  },
  listContent: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xxxl * 2,
    flexGrow: 1,
  },
  cartItem: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  itemImageContainer: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    backgroundColor: Colors.surfaceElevated,
    marginRight: Spacing.md,
  },
  itemImage: {
    width: '100%',
    height: '100%',
  },
  itemDetails: {
    flex: 1,
    justifyContent: 'space-between',
  },
  itemHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  itemName: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.bold,
    color: Colors.text,
    flex: 1,
    marginRight: Spacing.sm,
  },
  itemCategory: {
    fontSize: Typography.size.xs,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  itemFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemPrice: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.bold,
    color: Colors.primary,
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.full,
  },
  qtyBtn: {
    padding: Spacing.sm,
  },
  qtyText: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.bold,
    marginHorizontal: 4,
    minWidth: 16,
    textAlign: 'center',
  },
  bottomBar: {
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
    borderTopWidth: 1,
    borderColor: Colors.border,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  summaryLabel: {
    fontSize: Typography.size.lg,
    color: Colors.textSecondary,
    fontWeight: Typography.weight.medium,
  },
  summaryValue: {
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.bold,
    color: Colors.text,
  },
  checkoutBtn: {
    width: '100%',
  },
  checkboxContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingRight: Spacing.sm,
  },
  itemVariant: {
    fontSize: Typography.size.xs,
    color: Colors.primary,
    fontWeight: Typography.weight.medium,
    marginTop: 2,
  },
});
