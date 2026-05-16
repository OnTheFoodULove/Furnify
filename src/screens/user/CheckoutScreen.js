import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/Button';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../theme';

export default function CheckoutScreen({ route, navigation }) {
  const { cartItems = [], total = 0 } = route.params || {};
  const { profile } = useAuth();
  const [placing, setPlacing] = useState(false);
  const [placed, setPlaced] = useState(false);

  const handlePlaceOrder = async () => {
    setPlacing(true);
    try {
      // Clear the cart after "placing" order
      // Only delete real cart items (filter out fake 'buynow-' IDs from direct Buy Now purchases)
      const ids = cartItems
        .map((item) => item.id)
        .filter((id) => !String(id).startsWith('buynow-'));
        
      if (ids.length > 0) {
        const { error } = await supabase
          .from('cart_items')
          .delete()
          .in('id', ids);
        if (error) throw error;
      }
      setPlaced(true);
    } catch (err) {
      console.error('[CheckoutScreen] placeOrder error:', err.message);
      Toast.show({ type: 'error', text1: 'Order Failed', text2: 'Please try again.' });
    } finally {
      setPlacing(false);
    }
  };

  // ── Success State ────────────────────────────────────────────────
  if (placed) {
    return (
      <View style={styles.successContainer}>
        <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
        <View style={styles.successIconWrapper}>
          <Ionicons name="checkmark-circle" size={80} color={Colors.success} />
        </View>
        <Text style={styles.successTitle}>Order Placed!</Text>
        <Text style={styles.successSubtitle}>
          Thank you, {profile?.username || 'Customer'}! Your furniture is on its way.
        </Text>
        <Button
          title="Back to Home"
          onPress={() => {
            // Pop the current stack (Cart or Home) to its root, 
            // then switch to the Home tab
            navigation.popToTop();
            navigation.navigate('Home');
          }}
          style={styles.successBtn}
        />
      </View>
    );
  }

  // ── Checkout Form ────────────────────────────────────────────────
  const shippingAddress = profile?.address || 'No address saved';
  const mobileNumber = profile?.mobile_number || 'No mobile number saved';
  const hasAddress = !!profile?.address;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={{ width: 42 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Delivery Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Details</Text>
          <View style={[styles.card, Shadows.sm]}>
            <View style={styles.infoRow}>
              <View style={[styles.iconCircle, { backgroundColor: Colors.primarySurface }]}>
                <Ionicons name="person-outline" size={18} color={Colors.primary} />
              </View>
              <View style={styles.infoText}>
                <Text style={styles.infoLabel}>Name</Text>
                <Text style={styles.infoValue}>{profile?.username || 'User'}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <View style={[styles.iconCircle, { backgroundColor: Colors.primarySurface }]}>
                <Ionicons name="location-outline" size={18} color={Colors.primary} />
              </View>
              <View style={styles.infoText}>
                <Text style={styles.infoLabel}>Shipping Address</Text>
                <Text style={[styles.infoValue, !hasAddress && styles.missingValue]}>
                  {shippingAddress}
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <View style={[styles.iconCircle, { backgroundColor: Colors.primarySurface }]}>
                <Ionicons name="call-outline" size={18} color={Colors.primary} />
              </View>
              <View style={styles.infoText}>
                <Text style={styles.infoLabel}>Mobile</Text>
                <Text style={[styles.infoValue, !profile?.mobile_number && styles.missingValue]}>
                  {mobileNumber}
                </Text>
              </View>
            </View>
          </View>

          {!hasAddress && (
            <TouchableOpacity
              style={styles.editAddressBtn}
              onPress={() => navigation.navigate('Profile')}
            >
              <Ionicons name="create-outline" size={16} color={Colors.primary} />
              <Text style={styles.editAddressText}>Add shipping address in Profile</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Order Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          <View style={[styles.card, Shadows.sm]}>
            {cartItems.map((item, index) => {
              if (!item.furniture) return null;
              return (
                <View key={item.id}>
                  <View style={styles.orderItem}>
                    <View style={styles.orderItemLeft}>
                      <Text style={styles.orderItemName} numberOfLines={1}>
                        {item.furniture.name}
                      </Text>
                      <Text style={styles.orderItemCategory}>
                        {item.furniture.category} · Qty: {item.quantity}
                      </Text>
                    </View>
                    <Text style={styles.orderItemPrice}>
                      ${(item.furniture.price * item.quantity).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </Text>
                  </View>
                  {index < cartItems.length - 1 && <View style={styles.divider} />}
                </View>
              );
            })}
          </View>
        </View>

        {/* Payment Method (display-only) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          <View style={[styles.card, Shadows.sm]}>
            <View style={styles.infoRow}>
              <View style={[styles.iconCircle, { backgroundColor: '#EEF2FF' }]}>
                <Ionicons name="card-outline" size={18} color="#6366F1" />
              </View>
              <View style={styles.infoText}>
                <Text style={styles.infoValue}>Cash on Delivery</Text>
                <Text style={styles.infoLabel}>Pay when your order arrives</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Price Breakdown */}
        <View style={styles.section}>
          <View style={[styles.card, Shadows.sm]}>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Subtotal</Text>
              <Text style={styles.priceValue}>
                ${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Shipping</Text>
              <Text style={[styles.priceValue, { color: Colors.success }]}>Free</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.priceRow}>
              <Text style={styles.priceTotalLabel}>Total</Text>
              <Text style={styles.priceTotalValue}>
                ${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom bar */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomTotal}>
          <Text style={styles.bottomTotalLabel}>Total</Text>
          <Text style={styles.bottomTotalValue}>
            ${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Text>
        </View>
        <Button
          title="Place Order"
          loading={placing}
          onPress={handlePlaceOrder}
          style={styles.placeOrderBtn}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xxxl + Spacing.md,
    paddingBottom: Spacing.lg,
    backgroundColor: Colors.background,
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
    paddingHorizontal: Spacing.xl,
    paddingBottom: 120,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.bold,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoText: {
    flex: 1,
  },
  infoLabel: {
    fontSize: Typography.size.xs,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.medium,
    color: Colors.text,
  },
  missingValue: {
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.sm,
  },
  editAddressBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.sm,
  },
  editAddressText: {
    fontSize: Typography.size.sm,
    color: Colors.primary,
    fontWeight: Typography.weight.medium,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  orderItemLeft: {
    flex: 1,
    marginRight: Spacing.md,
  },
  orderItemName: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.medium,
    color: Colors.text,
  },
  orderItemCategory: {
    fontSize: Typography.size.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  orderItemPrice: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.bold,
    color: Colors.text,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  priceLabel: {
    fontSize: Typography.size.base,
    color: Colors.textSecondary,
  },
  priceValue: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.medium,
    color: Colors.text,
  },
  priceTotalLabel: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.bold,
    color: Colors.text,
  },
  priceTotalValue: {
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.extraBold,
    color: Colors.primary,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Platform.OS === 'ios' ? 34 : Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    ...Shadows.lg,
  },
  bottomTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  bottomTotalLabel: {
    fontSize: Typography.size.base,
    color: Colors.textSecondary,
  },
  bottomTotalValue: {
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.extraBold,
    color: Colors.text,
  },
  placeOrderBtn: {},
  // Success state
  successContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xxxl,
  },
  successIconWrapper: {
    marginBottom: Spacing.xl,
  },
  successTitle: {
    fontSize: Typography.size.xxxl,
    fontWeight: Typography.weight.extraBold,
    color: Colors.text,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: Typography.size.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: Typography.size.base * 1.6,
    marginBottom: Spacing.xxxl,
  },
  successBtn: {
    width: '100%',
  },
});
