import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  StatusBar,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import LoadingOverlay from '../../components/LoadingOverlay';
import EmptyState from '../../components/EmptyState';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../theme';

const PAGE_SIZE = 5;
const ACTION_FILTERS = ['ALL', 'ADD', 'EDIT', 'HIDE', 'DELETE'];
const DATE_FILTERS = [
  { label: 'All Time', value: null },
  { label: 'Today', value: 1 },
  { label: 'This Week', value: 7 },
  { label: 'This Month', value: 30 },
];

export default function ActivityLogScreen() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState(null); // days back, null = all

  // Pagination
  const [page, setPage] = useState(0);

  const fetchLogs = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*, users(username)')
        .order('timestamp', { ascending: false })
        .limit(500); // fetch a large set then filter client-side for pagination

      if (error) throw error;
      setLogs(data || []);
    } catch (err) {
      console.error('Error fetching logs', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Reset page when filters change
  useEffect(() => {
    setPage(0);
  }, [searchQuery, actionFilter, dateFilter]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchLogs();
  };

  const getActionColor = (action) => {
    switch (action) {
      case 'ADD':    return Colors.badge.add;
      case 'EDIT':   return Colors.badge.edit;
      case 'HIDE':   return Colors.warning;
      case 'DELETE': return Colors.badge.delete;
      default:       return Colors.textSecondary;
    }
  };

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleString();
  };

  const getEffectiveAction = (item) => {
    if (item.action === 'EDIT' && (item.furniture_name?.endsWith('(hidden)') || item.furniture_name?.endsWith('(shown)'))) {
      return 'HIDE';
    }
    return item.action;
  };

  // ── Apply filters ──────────────────────────────────────────
  const filtered = logs.filter((item) => {
    const effectiveAction = getEffectiveAction(item);

    // Action filter
    if (actionFilter !== 'ALL' && effectiveAction !== actionFilter) return false;

    // Date filter
    if (dateFilter) {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - dateFilter);
      if (new Date(item.timestamp) < cutoff) return false;
    }

    // Keyword search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const nameMatch = item.furniture_name?.toLowerCase().includes(q);
      const actionMatch = effectiveAction.toLowerCase().includes(q);
      const userMatch = item.users?.username?.toLowerCase().includes(q);
      if (!nameMatch && !actionMatch && !userMatch) return false;
    }

    return true;
  });

  // ── Pagination ─────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginatedLogs = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  if (loading) return <LoadingOverlay message="Loading logs..." />;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Activity Logs</Text>
        <Text style={styles.headerSubtitle}>
          {filtered.length} record{filtered.length !== 1 ? 's' : ''} found
        </Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchRow}>
        <Ionicons name="search-outline" size={18} color={Colors.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by item, action, or admin..."
          placeholderTextColor={Colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          clearButtonMode="while-editing"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Action Filter Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        {ACTION_FILTERS.map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.chip, actionFilter === f && styles.chipActive]}
            onPress={() => setActionFilter(f)}
          >
            <Text style={[styles.chipText, actionFilter === f && styles.chipTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
        <View style={styles.chipDivider} />
        {DATE_FILTERS.map((d) => (
          <TouchableOpacity
            key={d.label}
            style={[styles.chip, dateFilter === d.value && styles.chipActive]}
            onPress={() => setDateFilter(d.value)}
          >
            <Text style={[styles.chipText, dateFilter === d.value && styles.chipTextActive]}>
              {d.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Log List */}
      <FlatList
        data={paginatedLogs}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.primary} />
        }
        renderItem={({ item }) => {
          const effectiveAction = getEffectiveAction(item);
          const actionColor = getActionColor(effectiveAction);
          return (
            <View style={[styles.logCard, Shadows.sm]}>
              <View style={styles.logHeader}>
                <View
                  style={[
                    styles.actionBadge,
                    { backgroundColor: actionColor + '20' },
                  ]}
                >
                  <Text style={[styles.actionText, { color: actionColor }]}>
                    {effectiveAction}
                  </Text>
                </View>
                <Text style={styles.timestamp}>{formatDate(item.timestamp)}</Text>
              </View>
              <Text style={styles.logMessage}>
                Admin <Text style={styles.bold}>{item.users?.username || 'Unknown'}</Text>{' '}
                {effectiveAction === 'ADD'
                  ? 'added'
                  : effectiveAction === 'HIDE'
                  ? (item.furniture_name?.endsWith('(hidden)') ? 'hid' : 'showed')
                  : effectiveAction === 'EDIT'
                  ? 'edited'
                  : 'deleted'}{' '}
                item:{' '}
                <Text style={styles.bold}>
                  {effectiveAction === 'HIDE'
                    ? item.furniture_name?.replace(/\s*\((hidden|shown)\)$/, '')
                    : item.furniture_name}
                </Text>
              </Text>
            </View>
          );
        }}
        ListEmptyComponent={
          <EmptyState
            image={require('../../../assets/images/empty-list.png')}
            title="No Activity Found"
            subtitle={
              searchQuery || actionFilter !== 'ALL' || dateFilter
                ? 'Try adjusting your filters.'
                : 'Admin actions like adding or editing furniture will appear here.'
            }
          />
        }
      />

      {/* Pagination Controls */}
      {filtered.length > PAGE_SIZE && (
        <View style={styles.pagination}>
          <TouchableOpacity
            style={[styles.pageBtn, page === 0 && styles.pageBtnDisabled]}
            onPress={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
          >
            <Ionicons name="chevron-back" size={18} color={page === 0 ? Colors.border : Colors.primary} />
            <Text style={[styles.pageBtnText, page === 0 && styles.pageBtnTextDisabled]}>Prev</Text>
          </TouchableOpacity>

          <Text style={styles.pageInfo}>
            Page {page + 1} of {totalPages}
          </Text>

          <TouchableOpacity
            style={[styles.pageBtn, page >= totalPages - 1 && styles.pageBtnDisabled]}
            onPress={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
          >
            <Text style={[styles.pageBtnText, page >= totalPages - 1 && styles.pageBtnTextDisabled]}>Next</Text>
            <Ionicons name="chevron-forward" size={18} color={page >= totalPages - 1 ? Colors.border : Colors.primary} />
          </TouchableOpacity>
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
    paddingBottom: Spacing.sm,
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
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.xl,
    marginVertical: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    ...Shadows.sm,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.size.base,
    color: Colors.text,
    paddingVertical: 2,
  },
  filterRow: {
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
    paddingBottom: Spacing.md,
    alignItems: 'center',
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: Typography.size.xs,
    color: Colors.textSecondary,
    fontWeight: Typography.weight.semiBold,
  },
  chipTextActive: {
    color: Colors.textInverse,
  },
  chipDivider: {
    width: 1,
    height: 20,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.xs,
  },
  listContent: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xxxl,
    flexGrow: 1,
  },
  logCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  actionBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  actionText: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.bold,
  },
  timestamp: {
    fontSize: Typography.size.xs,
    color: Colors.textMuted,
  },
  logMessage: {
    fontSize: Typography.size.sm,
    color: Colors.text,
    lineHeight: Typography.size.sm * 1.5,
  },
  bold: {
    fontWeight: Typography.weight.bold,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  pageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primarySurface,
  },
  pageBtnDisabled: {
    backgroundColor: Colors.surfaceElevated,
  },
  pageBtnText: {
    fontSize: Typography.size.sm,
    color: Colors.primary,
    fontWeight: Typography.weight.semiBold,
  },
  pageBtnTextDisabled: {
    color: Colors.border,
  },
  pageInfo: {
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
    fontWeight: Typography.weight.medium,
  },
});
