// Offline Queue Screen — View and Manage Pending Offline Writes & Sync Retries — React Native
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useOffline } from '../../context/OfflineContext';
import { Colors, Spacing, Typography } from '../../theme';
import {
  Button,
  EmptyState,
  OfflineBanner,
  StaleDataWarning,
  StatusBadge,
  SyncStatus,
} from '../../components';

export interface OfflineQueueScreenProps {
  onNavigateBack?: () => void;
}

export const OfflineQueueScreen: React.FC<OfflineQueueScreenProps> = (props) => {
  const navigation = useNavigation<any>();
  const onNavigateBack = props.onNavigateBack || (navigation.canGoBack() ? () => navigation.goBack() : undefined);

  const {
    networkStatus,
    isOnline,
    isSyncing,
    lastSyncedAt,
    lastSyncedText,
    pendingMutations,
    pendingCount,
    syncError,
    triggerSync,
    removeMutation,
    clearPendingQueue,
  } = useOffline();

  const handleSyncNow = () => {
    triggerSync();
  };

  return (
    <View testID="offline-queue-screen" style={styles.container}>
      {/* Offline Alert Banner */}
      <OfflineBanner
        status={networkStatus}
        lastSyncedText={lastSyncedText}
        onRetrySync={handleSyncNow}
        testID="offline-banner"
      />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {onNavigateBack && (
            <TouchableOpacity
              onPress={onNavigateBack}
              testID="back-button"
              style={styles.backButton}
              accessibilityRole="button"
            >
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
          )}
          <Text style={styles.screenTitle}>Offline Write Queue</Text>
          <Text style={styles.screenSubtitle}>
            Local mutations waiting to sync with central servers
          </Text>
        </View>

        <View style={styles.headerRight}>
          <SyncStatus
            status={networkStatus}
            pendingCount={pendingCount}
            lastSyncedText={lastSyncedText}
          />
          <Button
            title={isSyncing ? 'Syncing...' : 'Sync Now'}
            variant="primary"
            onPress={handleSyncNow}
            isLoading={isSyncing}
            disabled={!isOnline || isSyncing}
            testID="manual-sync-btn"
          />
        </View>
      </View>

      {/* Status Bar */}
      <View style={styles.statusBar}>
        <View style={styles.statusLeft}>
          <Text style={styles.lastSyncedLabel}>
            Last Synced: <Text style={styles.bold}>{lastSyncedText}</Text>
          </Text>
          {lastSyncedAt && (
            <StaleDataWarning lastUpdatedAt={lastSyncedAt} resourceName="server database" />
          )}
        </View>

        {pendingCount > 0 && (
          <TouchableOpacity
            onPress={clearPendingQueue}
            testID="clear-queue-btn"
            accessibilityRole="button"
          >
            <Text style={styles.discardText}>
              Discard All ({pendingCount})
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Sync Error Banner */}
      {syncError && (
        <View testID="sync-error-banner" style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>⚠️ {syncError}</Text>
          <TouchableOpacity onPress={handleSyncNow} accessibilityRole="button">
            <Text style={styles.retryText}>Retry Now</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Main Content */}
      <ScrollView contentContainerStyle={styles.contentContainer}>
        {pendingCount === 0 ? (
          <EmptyState
            title="All Changes Synced"
            description="Your device is in sync with the central CareGrid server. No pending offline actions."
          />
        ) : (
          <View style={styles.list}>
            {pendingMutations.map((mut, idx) => (
              <View
                key={mut.id}
                testID={`queue-item-${mut.id}`}
                style={styles.mutationCard}
              >
                <View style={styles.mutationInfo}>
                  <View style={styles.mutationHeader}>
                    <Text style={styles.mutationAction}>
                      #{idx + 1} • {mut.action} {mut.entity}
                    </Text>
                    <StatusBadge
                      label={isSyncing ? 'SYNCING' : 'PENDING'}
                      variant={isSyncing ? 'pending' : 'lowStock'}
                    />
                  </View>

                  <Text style={styles.mutationMeta}>
                    Logged at: {new Date(mut.clientTimestamp).toLocaleTimeString()} • ID: {mut.id.slice(0, 16)}...
                  </Text>

                  <Text style={styles.mutationPayload}>
                    {JSON.stringify(mut.payload).slice(0, 80)}...
                  </Text>
                </View>

                <Button
                  title="Remove"
                  variant="outline"
                  onPress={() => removeMutation(mut.id)}
                  testID={`remove-mut-${mut.id}`}
                />
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flex: 1,
  },
  backButton: {
    marginBottom: Spacing.xs,
  },
  backButtonText: {
    color: Colors.primary,
    fontSize: Typography.fontSizes.sm,
    fontWeight: Typography.fontWeights.medium,
  },
  screenTitle: {
    fontSize: Typography.fontSizes.lg,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.textPrimary,
  },
  screenSubtitle: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'center',
  },
  statusBar: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.surfaceSubtle,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  lastSyncedLabel: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.textSecondary,
  },
  bold: {
    fontWeight: Typography.fontWeights.bold,
  },
  discardText: {
    color: Colors.status.outOfStock.text,
    fontSize: Typography.fontSizes.xs,
    fontWeight: Typography.fontWeights.medium,
  },
  errorBanner: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.status.outOfStock.bg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.status.outOfStock.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  errorBannerText: {
    color: Colors.status.outOfStock.text,
    fontSize: Typography.fontSizes.xs,
  },
  retryText: {
    color: Colors.status.outOfStock.text,
    fontWeight: Typography.fontWeights.bold,
    fontSize: Typography.fontSizes.xs,
    textDecorationLine: 'underline',
  },
  contentContainer: {
    padding: Spacing.lg,
  },
  list: {
    flexDirection: 'column',
    gap: Spacing.sm,
  },
  mutationCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Spacing.borderRadius.lg,
    padding: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mutationInfo: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  mutationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  mutationAction: {
    fontWeight: Typography.fontWeights.bold,
    fontSize: Typography.fontSizes.sm,
    color: Colors.textPrimary,
  },
  mutationMeta: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  mutationPayload: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.textMuted,
    marginTop: 2,
    fontFamily: 'monospace',
  },
});

export default OfflineQueueScreen;
