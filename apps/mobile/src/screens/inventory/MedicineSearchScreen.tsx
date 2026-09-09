// Medicine Search Screen — Search Master Catalog with Generic Lookup & Deterministic Alternatives
import React, { useState, useEffect, useCallback } from 'react';
import { medicineService } from '../../services/medicine.service';
import { Medicine } from '../../types';
import { Colors, Spacing, Typography } from '../../theme';
import {
  Button,
  EmptyState,
  ErrorState,
  LoadingState,
  TextInput,
} from '../../components';

export interface MedicineSearchScreenProps {
  facilityId?: string;
  onSelectMedicine: (medicine: Medicine) => void;
  onNavigateBack?: () => void;
}

export const MedicineSearchScreen: React.FC<MedicineSearchScreenProps> = ({
  facilityId,
  onSelectMedicine,
  onNavigateBack,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [medicines, setMedicines] = useState<Medicine[]>([]);

  const searchMedicines = useCallback(async (query: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await medicineService.searchMedicines({
        search: query.trim() || undefined,
        limit: 25,
      });
      setMedicines(response.data || []);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to search medicine catalog');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    searchMedicines('');
  }, [searchMedicines]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    searchMedicines(searchTerm);
  };

  return (
    <div
      data-testid="medicine-search-screen"
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        backgroundColor: Colors.background,
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: `${Spacing.md}px ${Spacing.lg}px`,
          backgroundColor: Colors.surface,
          borderBottom: `1px solid ${Colors.border}`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: Spacing.sm }}>
          {onNavigateBack && (
            <button
              onClick={onNavigateBack}
              data-testid="back-button"
              style={{
                background: 'none',
                border: 'none',
                color: Colors.primary,
                cursor: 'pointer',
                fontSize: Typography.fontSizes.sm,
                fontWeight: Typography.fontWeights.medium,
                padding: 0,
                marginRight: Spacing.md,
              }}
            >
              ← Back
            </button>
          )}
          <div>
            <h2
              style={{
                margin: 0,
                fontSize: Typography.fontSizes.lg,
                fontWeight: Typography.fontWeights.bold,
                color: Colors.textPrimary,
              }}
            >
              Medicine Catalog Search
            </h2>
            <span style={{ fontSize: Typography.fontSizes.xs, color: Colors.textSecondary }}>
              Search by brand name or generic chemical formula
            </span>
          </div>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: Spacing.sm, alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
            <TextInput
              value={searchTerm}
              onChangeText={(text) => {
                setSearchTerm(text);
                if (text.length === 0 || text.length > 2) {
                  searchMedicines(text);
                }
              }}
              placeholder="e.g. Paracetamol, Amoxicillin, Metformin..."
              testID="medicine-search-input"
            />
          </div>
          <Button
            title="Search"
            onPress={() => searchMedicines(searchTerm)}
            testID="search-submit-btn"
          />
        </form>
      </div>

      {/* Results List */}
      <div style={{ flex: 1, padding: Spacing.lg, overflowY: 'auto' }}>
        {loading && <LoadingState message="Searching medicines catalog..." />}

        {error && !loading && (
          <ErrorState
            title="Search Failed"
            message={error}
            onRetry={() => searchMedicines(searchTerm)}
          />
        )}

        {!loading && !error && medicines.length === 0 && (
          <EmptyState
            title="No Medicines Found"
            description={
              searchTerm
                ? `No results matched "${searchTerm}". Check the spelling or search by generic chemical name.`
                : 'Type a medicine name in the search bar above.'
            }
          />
        )}

        {!loading && !error && medicines.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: Spacing.sm }}>
            {medicines.map((medicine) => (
              <div
                key={medicine.id}
                onClick={() => onSelectMedicine(medicine)}
                data-testid={`medicine-item-${medicine.id}`}
                style={{
                  backgroundColor: Colors.surface,
                  border: `1px solid ${Colors.border}`,
                  borderRadius: Spacing.borderRadius.lg,
                  padding: Spacing.md,
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <h4
                    style={{
                      margin: 0,
                      fontSize: Typography.fontSizes.sm,
                      fontWeight: Typography.fontWeights.bold,
                      color: Colors.textPrimary,
                    }}
                  >
                    {medicine.name}
                  </h4>
                  <div style={{ fontSize: Typography.fontSizes.xs, color: Colors.textSecondary, marginTop: 2 }}>
                    Generic: <span style={{ fontWeight: Typography.fontWeights.medium }}>{medicine.genericName}</span>
                  </div>
                  <div style={{ fontSize: Typography.fontSizes.xs, color: Colors.textMuted, marginTop: 2 }}>
                    {medicine.strength} • {medicine.dosageForm} • Unit: {medicine.unit}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: Spacing.sm }}>
                  <Button
                    title="View Stock →"
                    variant="outline"
                    onPress={() => onSelectMedicine(medicine)}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MedicineSearchScreen;
