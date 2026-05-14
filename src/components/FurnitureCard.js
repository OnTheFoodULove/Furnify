import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
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
}) {
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
          <Text style={styles.listPrice}>${Number(item.price).toLocaleString()}</Text>
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
        {item.is_hidden && (
          <View style={styles.hiddenBadge}>
            <Text style={styles.hiddenBadgeText}>HIDDEN</Text>
          </View>
        )}
        <View style={styles.adminContent}>
          <View style={styles.adminInfo}>
            <Text style={styles.adminCategory}>{item.category}</Text>
            <Text style={styles.adminName} numberOfLines={1}>{item.name}</Text>
            <Text style={styles.adminPrice}>${Number(item.price).toLocaleString()}</Text>
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
      </View>
      <View style={styles.gridContent}>
        <Text style={styles.gridCategory}>{item.category}</Text>
        <Text style={styles.gridName} numberOfLines={2}>{item.name}</Text>
        <Text style={styles.gridPrice}>${Number(item.price).toLocaleString()}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // Grid card
  gridCard: {
    width: CARD_WIDTH,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  gridImageContainer: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: Colors.surfaceElevated,
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  gridContent: {
    padding: Spacing.md,
  },
  gridCategory: {
    fontSize: Typography.size.xs,
    color: Colors.primary,
    fontWeight: Typography.weight.semiBold,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  gridName: {
    fontSize: Typography.size.sm,
    color: Colors.text,
    fontWeight: Typography.weight.semiBold,
    marginBottom: Spacing.xs,
    lineHeight: 18,
  },
  gridPrice: {
    fontSize: Typography.size.base,
    color: Colors.primary,
    fontWeight: Typography.weight.bold,
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

  // Admin card
  adminCard: {
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
    height: 180,
    backgroundColor: Colors.surfaceElevated,
  },
  hiddenBadge: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    backgroundColor: Colors.error,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
  },
  hiddenBadgeText: {
    fontSize: Typography.size.xs,
    color: Colors.textInverse,
    fontWeight: Typography.weight.bold,
    letterSpacing: 0.5,
  },
  adminContent: {
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  adminInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  adminCategory: {
    fontSize: Typography.size.xs,
    color: Colors.primary,
    fontWeight: Typography.weight.semiBold,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  adminName: {
    fontSize: Typography.size.base,
    color: Colors.text,
    fontWeight: Typography.weight.semiBold,
    marginBottom: 2,
  },
  adminPrice: {
    fontSize: Typography.size.md,
    color: Colors.primary,
    fontWeight: Typography.weight.bold,
  },
  adminActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm - 1,
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
});
