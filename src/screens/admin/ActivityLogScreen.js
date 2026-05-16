import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { supabase } from '../../lib/supabase';
import LoadingOverlay from '../../components/LoadingOverlay';
import EmptyState from '../../components/EmptyState';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../theme';

export default function ActivityLogScreen() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchLogs = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*, users(username)')
        .order('timestamp', { ascending: false })
        .limit(100);

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

  const handleRefresh = () => {
    setRefreshing(true);
    fetchLogs();
  };

  const getActionColor = (action) => {
    switch (action) {
      case 'ADD':
        return Colors.badge.add;
      case 'EDIT':
        return Colors.badge.edit;
      case 'DELETE':
        return Colors.badge.delete;
      default:
        return Colors.textSecondary;
    }
  };

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleString();
  };

  if (loading) return <LoadingOverlay message="Loading logs..." />;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Activity Logs</Text>
        <Text style={styles.headerSubtitle}>Recent admin actions</Text>
      </View>

      <FlatList
        data={logs}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.primary} />
        }
        renderItem={({ item }) => (
          <View style={[styles.logCard, Shadows.sm]}>
            <View style={styles.logHeader}>
              <View
                style={[
                  styles.actionBadge,
                  { backgroundColor: getActionColor(item.action) + '20' },
                ]}
              >
                <Text
                  style={[
                    styles.actionText,
                    { color: getActionColor(item.action) },
                  ]}
                >
                  {item.action === 'DELETE' ? 'HIDE' : item.action}
                </Text>
              </View>
              <Text style={styles.timestamp}>{formatDate(item.timestamp)}</Text>
            </View>
            <Text style={styles.logMessage}>
              Admin <Text style={styles.bold}>{item.users?.username || 'Unknown'}</Text>{' '}
              {item.action === 'ADD' ? 'added' : item.action === 'EDIT' ? 'edited' : 'hid'} item:{' '}
              <Text style={styles.bold}>{item.furniture_name}</Text>
            </Text>
          </View>
        )}
        ListEmptyComponent={
          <EmptyState
            image={require('../../../assets/images/empty-list.png')}
            title="No Activity Yet"
            subtitle="Admin actions like adding or editing furniture will appear here."
          />
        }
      />
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
  listContent: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xxxl,
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
});
