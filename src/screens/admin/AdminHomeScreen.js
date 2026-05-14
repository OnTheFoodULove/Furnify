import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
  ScrollView,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { Ionicons } from '@expo/vector-icons';
import { supabase, logActivity } from '../../lib/supabase';
import FurnitureCard from '../../components/FurnitureCard';
import EmptyState from '../../components/EmptyState';
import LoadingOverlay from '../../components/LoadingOverlay';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../theme';

const CATEGORIES = ['All', 'Living Room', 'Bedroom', 'Dining', 'Office', 'Outdoor'];

export default function AdminHomeScreen({ navigation }) {
  const [furniture, setFurniture] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [stats, setStats] = useState({ total: 0, hidden: 0, visible: 0 });

  const fetchFurniture = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('furniture')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFurniture(data || []);
      setStats({
        total: data?.length || 0,
        hidden: data?.filter((i) => i.is_hidden).length || 0,
        visible: data?.filter((i) => !i.is_hidden).length || 0,
      });
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to load furniture.' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchFurniture();
    // Subscribe to real-time changes
    const channel = supabase
      .channel('furniture_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'furniture' }, fetchFurniture)
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [fetchFurniture]);

  // Filter furniture based on search + category
  useEffect(() => {
    let result = [...furniture];
    if (activeCategory !== 'All') {
      result = result.filter((item) => item.category === activeCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q)
      );
    }
    setFiltered(result);
  }, [furniture, searchQuery, activeCategory]);

  const handleHideToggle = async (item) => {
    const newHidden = !item.is_hidden;
    const action = newHidden ? 'DELETE' : 'ADD';
    const actionLabel = newHidden ? 'hidden' : 'shown';

    try {
      const { error } = await supabase
        .from('furniture')
        .update({ is_hidden: newHidden })
        .eq('id', item.id);

      if (error) throw error;

      await logActivity(action, item.name);
      Toast.show({
        type: 'success',
        text1: `Item ${actionLabel}`,
        text2: `"${item.name}" is now ${actionLabel}.`,
      });
      fetchFurniture();
    } catch {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to update item visibility.' });
    }
  };

  const handleEdit = (item) => {
    navigation.navigate('EditFurniture', { item });
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchFurniture();
  };

  if (loading) return <LoadingOverlay message="Loading inventory..." />;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Inventory</Text>
          <Text style={styles.headerSubtitle}>Manage your furniture catalog</Text>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate('AddFurniture')}
        >
          <Ionicons name="add" size={24} color={Colors.textInverse} />
        </TouchableOpacity>
      </View>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, Shadows.sm]}>
          <Text style={styles.statNumber}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={[styles.statCard, Shadows.sm]}>
          <Text style={[styles.statNumber, { color: Colors.success }]}>{stats.visible}</Text>
          <Text style={styles.statLabel}>Visible</Text>
        </View>
        <View style={[styles.statCard, Shadows.sm]}>
          <Text style={[styles.statNumber, { color: Colors.error }]}>{stats.hidden}</Text>
          <Text style={styles.statLabel}>Hidden</Text>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={18} color={Colors.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search furniture..."
          placeholderTextColor={Colors.textMuted}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Category filters */}
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
                styles.categoryChipText,
                activeCategory === cat && styles.categoryChipTextActive,
              ]}
            >
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Furniture list */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.primary} />
        }
        renderItem={({ item }) => (
          <FurnitureCard
            item={item}
            variant="admin"
            onEdit={handleEdit}
            onHide={handleHideToggle}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            image={require('../../../assets/images/empty-list.png')}
            title="No Items Found"
            subtitle={
              searchQuery
                ? `No results for "${searchQuery}"`
                : 'Your inventory is empty. Add your first furniture item.'
            }
            buttonTitle="Add Furniture"
            onButtonPress={() => navigation.navigate('AddFurniture')}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xxxl + Spacing.md,
    paddingBottom: Spacing.base,
  },
  headerTitle: {
    fontSize: Typography.size.xxl,
    fontWeight: Typography.weight.extraBold,
    color: Colors.text,
  },
  headerSubtitle: {
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  addBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.md,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
    marginBottom: Spacing.base,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.extraBold,
    color: Colors.text,
  },
  statLabel: {
    fontSize: Typography.size.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    marginHorizontal: Spacing.xl,
    paddingHorizontal: Spacing.md,
    height: 46,
    marginBottom: Spacing.md,
  },
  searchIcon: { marginRight: Spacing.sm },
  searchInput: {
    flex: 1,
    fontSize: Typography.size.base,
    color: Colors.text,
  },
  categoryScroll: { flexGrow: 0, marginBottom: Spacing.md },
  categoryContent: { paddingHorizontal: Spacing.xl, gap: Spacing.sm },
  categoryChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm - 1,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  categoryChipActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primarySurface,
  },
  categoryChipText: {
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
    fontWeight: Typography.weight.medium,
  },
  categoryChipTextActive: {
    color: Colors.primary,
    fontWeight: Typography.weight.semiBold,
  },
  listContent: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xxxl,
  },
});
