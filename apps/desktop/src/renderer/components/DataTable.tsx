// Desktop High-Density Data Table
import React from 'react';
import { Colors, Spacing, Typography } from '../theme';

export interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  width?: string | number;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  testID?: string;
}

export function DataTable<T>({ columns, data, keyExtractor, testID }: DataTableProps<T>) {
  return (
    <div
      data-testid={testID}
      style={{
        backgroundColor: Colors.surface,
        border: `1px solid ${Colors.border}`,
        borderRadius: Spacing.borderRadius.lg,
        overflow: 'hidden',
        width: '100%',
      }}
    >
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead>
          <tr style={{ backgroundColor: Colors.surfaceSubtle, borderBottom: `1px solid ${Colors.border}` }}>
            {columns.map((col) => (
              <th
                key={col.key}
                style={{
                  padding: `${Spacing.sm}px ${Spacing.md}px`,
                  fontSize: Typography.fontSizes.xs,
                  fontWeight: Typography.fontWeights.bold,
                  color: Colors.textSecondary,
                  textTransform: 'uppercase',
                  width: col.width,
                }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item, idx) => (
            <tr
              key={keyExtractor(item)}
              style={{
                borderBottom: idx === data.length - 1 ? 'none' : `1px solid ${Colors.border}`,
                backgroundColor: idx % 2 === 0 ? Colors.surface : '#FAFAFA',
              }}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  style={{
                    padding: `${Spacing.sm}px ${Spacing.md}px`,
                    fontSize: Typography.fontSizes.sm,
                    color: Colors.textPrimary,
                  }}
                >
                  {col.render ? col.render(item) : (item as any)[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default DataTable;
