import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import FurnitureCard from '../../components/FurnitureCard';
import LoadingOverlay from '../../components/LoadingOverlay';
import EmptyState from '../../components/EmptyState';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../theme';

const CATEGORIES = ['All', 'Living Room', 'Bedroom', 'Dining', 'Office', 'Outdoor'];

export default function HomeScreen({ navigation }) {
  const { profile } = useAuth();
  const [furniture, setFurniture] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All');

  const fetchFurniture = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('furniture')
        .select('*')
        // User side: only fetch visible items
        .eq('is_hidden', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFurniture(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchFurniture();
    // Subscribe to real-time changes
    const channel = supabase
      .channel('public:furniture')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'furniture' }, fetchFurniture)
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [fetchFurniture]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchFurniture();
  };

  const filteredFurniture =
    activeCategory === 'All'
      ? furniture
      : furniture.filter((item) => item.category === activeCategory);

  const renderHeader = () => (
    <View style={styles.header}>
      <View>
        <Text style={styles.greeting}>
          Hello, {profile?.username || 'Guest'} 👋
        </Text>
        <Text style={styles.subtitle}>Find your perfect furniture</Text>
      </View>
      <TouchableOpacity
        style={styles.cartBtn}
        onPress={() => navigation.navigate('Cart')}
      >
        <Ionicons name="cart-outline" size={24} color={Colors.text} />
      </TouchableOpacity>
    </View>
  );

  const renderBanner = () => (
    <View style={[styles.banner, Shadows.md]}>
      <View style={styles.bannerContent}>
        <Text style={styles.bannerTitle}>New Collection</Text>
        <Text style={styles.bannerSubtitle}>Up to 20% off on living room items</Text>
        <TouchableOpacity style={styles.bannerBtn}>
          <Text style={styles.bannerBtnText}>Shop Now</Text>
        </TouchableOpacity>
      </View>
      <Image
        source={require('../../../assets/images/onboarding1.png')}
        style={styles.bannerImage}
        resizeMode="contain"
      />
    </View>
  );

  if (loading) return <LoadingOverlay message="Loading products..." />;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      {/* Header outside ScrollView so it sticks */}
      {renderHeader()}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.primary} />
        }
      >
        {renderBanner()}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Categories</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryScroll}
          contentContainerStyle={styles.categoryContent}
        >
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.categoryChip,
                activeCategory === cat && styles.categoryChipActive,
              ]}
              onPress={() => setActiveCategory(cat)}
            >
              <Text
                style={[
                  styles.categoryText,
                  activeCategory === cat && styles.categoryTextActive,
                ]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.gridContainer}>
          {filteredFurniture.length > 0 ? (
            filteredFurniture.map((item) => (
              <View key={item.id} style={styles.gridItem}>
                <FurnitureCard
                  item={item}
                  variant="grid"
                  onPress={() => navigation.navigate('FurnitureDetail', { item })}
                />
              </View>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <EmptyState
                image={require('../../../assets/images/empty-list.png')}
                title="Nothing here yet"
                subtitle="We're adding new items soon. Check back later!"
              />
            </View>
          )}
        </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xxxl + Spacing.sm,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.background,
  },
  greeting: {
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.bold,
    color: Colors.text,
  },
  subtitle: {
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  cartBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.sm,
  },
  scrollContent: {
    paddingBottom: Spacing.xxxl,
  },
  banner: {
    flexDirection: 'row',
    backgroundColor: Colors.primarySurface,
    marginHorizontal: Spacing.xl,
    marginTop: Spacing.md,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    height: 140,
  },
  bannerContent: {
    flex: 1,
    padding: Spacing.lg,
    justifyContent: 'center',
  },
  bannerTitle: {
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.bold,
    color: Colors.primaryDark,
    marginBottom: 4,
  },
  bannerSubtitle: {
    fontSize: Typography.size.xs,
    color: Colors.primary,
    marginBottom: Spacing.md,
  },
  bannerBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
  },
  bannerBtnText: {
    color: Colors.textInverse,
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.bold,
  },
  bannerImage: {
    width: 120,
    height: '100%',
    marginRight: -20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    marginTop: Spacing.xl,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.bold,
    color: Colors.text,
  },
  categoryScroll: {
    flexGrow: 0,
    marginBottom: Spacing.lg,
  },
  categoryContent: {
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
  },
  categoryChip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    ...Shadows.sm,
  },
  categoryChipActive: {
    backgroundColor: Colors.primary,
  },
  categoryText: {
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
    fontWeight: Typography.weight.medium,
  },
  categoryTextActive: {
    color: Colors.textInverse,
    fontWeight: Typography.weight.bold,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.xl,
    justifyContent: 'space-between',
  },
  gridItem: {
    marginBottom: Spacing.md,
  },
  emptyContainer: {
    width: '100%',
    paddingTop: Spacing.xl,
  },
});
