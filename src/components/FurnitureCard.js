import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, BorderRadius, Spacing, Shadows } from '../theme';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - Spacing.base * 2 - Spacing.md) / 2;

/**
 * Furniture card for grid/list display
 * Variants: 'grid' | 'list' | 'admin'
 */
export default function FurnitureCard({
  item,
  onPress,
  variant = 'grid',
  onEdit,
  onHide,
  onDelete,
}) {
  const discountedPrice =
    item.discount_percent > 0
      ? item.price * (1 - item.discount_percent / 100)
      : null;

  if (variant === 'list') {
    return (
      <TouchableOpacity
        style={[styles.listCard, Shadows.sm]}
        onPress={onPress}
        activeOpacity={0.85}
      >
        <Image
          source={
            item.image_url
              ? { uri: item.image_url }
              : require('../../assets/images/empty-list.png')
          }
          style={styles.listImage}
          resizeMode="cover"
        />
        <View style={styles.listContent}>
          <Text style={styles.listCategory}>{item.category}</Text>
          <Text style={styles.listName} numberOfLines={2}>{item.name}</Text>
          {discountedPrice ? (
            <View style={styles.priceRow}>
              <Text style={styles.listPriceStrike}>₱{Number(item.price).toLocaleString()}</Text>
              <Text style={styles.listPrice}>₱{Number(discountedPrice).toLocaleString(undefined, { maximumFractionDigits: 0 })}</Text>
            </View>
          ) : (
            <Text style={styles.listPrice}>₱{Number(item.price).toLocaleString()}</Text>
          )}
          {item.stock_quantity !== undefined && (
            <Text style={[styles.stockLabel, item.stock_quantity === 0 && styles.outOfStock]}>
              {item.stock_quantity > 0 ? `In Stock: ${item.stock_quantity}` : 'Out of Stock'}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  }

  if (variant === 'admin') {
    return (
      <View style={[styles.adminCard, Shadows.sm, item.is_hidden && styles.adminCardHidden]}>
        <Image
          source={
            item.image_url
              ? { uri: item.image_url }
              : require('../../assets/images/empty-list.png')
          }
          style={styles.adminImage}
          resizeMode="cover"
        />
        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={() => onDelete?.(item)}
        >
          <Ionicons name="trash" size={15} color={Colors.error} />
        </TouchableOpacity>
        {item.is_hidden && (
          <View style={styles.hiddenBadge}>
            <Text style={styles.hiddenBadgeText}>HIDDEN</Text>
          </View>
        )}
        {item.discount_percent > 0 && !item.is_hidden && (
          <View style={[styles.discountBadge, styles.discountBadgeLeft]}>
            <Text style={styles.discountBadgeText}>-{item.discount_percent}%</Text>
          </View>
        )}
        <View style={styles.adminContent}>
          <View style={styles.adminInfo}>
            <Text style={styles.adminCategory}>{item.category}</Text>
            <Text style={styles.adminName} numberOfLines={1}>{item.name}</Text>
            {discountedPrice ? (
              <View style={styles.priceRow}>
                <Text style={styles.adminPriceStrike}>₱{Number(item.price).toLocaleString()}</Text>
                <Text style={styles.adminPrice}>₱{Number(discountedPrice).toLocaleString(undefined, { maximumFractionDigits: 0 })}</Text>
              </View>
            ) : (
              <Text style={styles.adminPrice}>₱{Number(item.price).toLocaleString()}</Text>
            )}
            {item.stock_quantity !== undefined && (
              <Text style={[styles.adminStock, item.stock_quantity === 0 && styles.outOfStock]}>
                Stock: {item.stock_quantity}
              </Text>
            )}
          </View>
          <View style={styles.adminActions}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.editBtn]}
              onPress={() => onEdit?.(item)}
            >
              <Text style={styles.editBtnText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, item.is_hidden ? styles.showBtn : styles.hideBtn]}
              onPress={() => onHide?.(item)}
            >
              <Text style={item.is_hidden ? styles.showBtnText : styles.hideBtnText}>
                {item.is_hidden ? 'Show' : 'Hide'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  // Grid (default)
  return (
    <TouchableOpacity
      style={[styles.gridCard, Shadows.sm]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={styles.gridImageContainer}>
        <Image
          source={
            item.image_url
              ? { uri: item.image_url }
              : require('../../assets/images/empty-list.png')
          }
          style={styles.gridImage}
          resizeMode="cover"
        />
        {item.discount_percent > 0 && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountBadgeText}>-{item.discount_percent}%</Text>
          </View>
        )}
      </View>
      <View style={styles.gridContent}>
        <Text style={styles.gridCategory}>{item.category}</Text>
        <Text style={styles.gridName} numberOfLines={2}>{item.name}</Text>
        {discountedPrice ? (
          <View style={styles.priceRow}>
            <Text style={styles.gridPriceStrike}>₱{Number(item.price).toLocaleString()}</Text>
            <Text style={styles.gridPrice}>₱{Number(discountedPrice).toLocaleString(undefined, { maximumFractionDigits: 0 })}</Text>
          </View>
        ) : (
          <Text style={styles.gridPrice}>₱{Number(item.price).toLocaleString()}</Text>
        )}
        {item.stock_quantity !== undefined && (
          <Text style={[styles.stockLabel, item.stock_quantity === 0 && styles.outOfStock]}>
            {item.stock_quantity > 0 ? `In Stock: ${item.stock_quantity}` : 'Out of Stock'}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // Grid card
  gridCard: {
    flex: 1,
    margin: Spacing.xs,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  gridImageContainer: {
    width: '100%',
    aspectRatio: 1.1, // slightly wider aspect ratio for a more compact grid look
    backgroundColor: Colors.surfaceElevated,
    position: 'relative',
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  gridContent: {
    padding: Spacing.sm,
  },
  gridCategory: {
    fontSize: 10,
    color: Colors.primary,
    fontWeight: Typography.weight.semiBold,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  gridName: {
    fontSize: Typography.size.sm - 1,
    color: Colors.text,
    fontWeight: Typography.weight.semiBold,
    marginBottom: 4,
    lineHeight: 16,
  },
  gridPrice: {
    fontSize: Typography.size.sm,
    color: Colors.primary,
    fontWeight: Typography.weight.bold,
  },
  gridPriceStrike: {
    fontSize: Typography.size.xs - 1,
    color: Colors.textMuted,
    textDecorationLine: 'line-through',
    marginRight: 4,
  },

  // List card
  listCard: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  listImage: {
    width: 100,
    height: 100,
    backgroundColor: Colors.surfaceElevated,
  },
  listContent: {
    flex: 1,
    padding: Spacing.md,
    justifyContent: 'center',
  },
  listCategory: {
    fontSize: Typography.size.xs,
    color: Colors.primary,
    fontWeight: Typography.weight.semiBold,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  listName: {
    fontSize: Typography.size.base,
    color: Colors.text,
    fontWeight: Typography.weight.semiBold,
    marginBottom: Spacing.xs,
  },
  listPrice: {
    fontSize: Typography.size.md,
    color: Colors.primary,
    fontWeight: Typography.weight.bold,
  },
  listPriceStrike: {
    fontSize: Typography.size.xs,
    color: Colors.textMuted,
    textDecorationLine: 'line-through',
    marginRight: 4,
  },

  // Admin card
  adminCard: {
    flex: 1,
    margin: Spacing.xs,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  adminCardHidden: {
    opacity: 0.65,
  },
  adminImage: {
    width: '100%',
    height: 130,
    backgroundColor: Colors.surfaceElevated,
  },
  hiddenBadge: {
    position: 'absolute',
    top: Spacing.xs,
    right: Spacing.xs,
    backgroundColor: Colors.error,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  hiddenBadgeText: {
    fontSize: 10,
    color: Colors.textInverse,
    fontWeight: Typography.weight.bold,
    letterSpacing: 0.5,
  },
  adminContent: {
    padding: Spacing.sm,
    flexDirection: 'column',
    alignItems: 'stretch',
    justifyContent: 'space-between',
    flex: 1,
  },
  adminInfo: {
    marginBottom: Spacing.sm,
  },
  adminCategory: {
    fontSize: 10,
    color: Colors.primary,
    fontWeight: Typography.weight.semiBold,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  adminName: {
    fontSize: Typography.size.sm,
    color: Colors.text,
    fontWeight: Typography.weight.semiBold,
    marginBottom: 2,
  },
  adminPrice: {
    fontSize: Typography.size.sm,
    color: Colors.primary,
    fontWeight: Typography.weight.bold,
  },
  adminPriceStrike: {
    fontSize: Typography.size.xs - 1,
    color: Colors.textMuted,
    textDecorationLine: 'line-through',
    marginRight: 4,
  },
  adminStock: {
    fontSize: Typography.size.xs - 1,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  adminActions: {
    flexDirection: 'row',
    gap: Spacing.xs,
    width: '100%',
  },
  actionBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xs + 2,
    borderRadius: BorderRadius.sm,
    borderWidth: 1.5,
  },
  editBtn: {
    borderColor: Colors.info,
    backgroundColor: Colors.infoSurface,
  },
  editBtnText: {
    color: Colors.info,
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.semiBold,
  },
  hideBtn: {
    borderColor: Colors.error,
    backgroundColor: Colors.errorSurface,
  },
  hideBtnText: {
    color: Colors.error,
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.semiBold,
  },
  showBtn: {
    borderColor: Colors.success,
    backgroundColor: Colors.successSurface,
  },
  showBtnText: {
    color: Colors.success,
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.semiBold,
  },

  // Shared
  discountBadge: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    backgroundColor: Colors.error,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    zIndex: 2,
  },
  discountBadgeLeft: {
    right: undefined,
    left: Spacing.md,
    top: Spacing.md,
  },
  discountBadgeText: {
    fontSize: Typography.size.xs,
    color: Colors.textInverse,
    fontWeight: Typography.weight.bold,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  stockLabel: {
    fontSize: 10,
    color: Colors.success,
    fontWeight: Typography.weight.medium,
    marginTop: 2,
  },
  outOfStock: {
    color: Colors.error,
  },
  deleteBtn: {
    position: 'absolute',
    top: Spacing.xs,
    left: Spacing.xs,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
});
