// Desktop Role-based Navigation Sidebar
import React from 'react';
import { DesktopNavRoute, UserRole } from '../types';
import { Colors, Spacing, Typography } from '../theme';
import { useAuth } from '../context/AuthContext';
import { t } from '../i18n';

export interface SidebarProps {
  currentRoute: DesktopNavRoute;
  onNavigate: (route: DesktopNavRoute) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentRoute, onNavigate }) => {
  const { role, user, logout } = useAuth();

  const getNavItems = (): Array<{ route: DesktopNavRoute; label: string; icon: string }> => {
    const items: Array<{ route: DesktopNavRoute; label: string; icon: string }> = [];

    if (role === 'DOCTOR') {
      items.push({ route: 'DOCTOR_DASHBOARD', label: t('doctorDashboard'), icon: '🩺' });
      items.push({ route: 'REFERRALS', label: t('referrals'), icon: '📋' });
      items.push({ route: 'APPOINTMENTS', label: t('appointments'), icon: '📅' });
      items.push({ route: 'BEDS', label: t('bedManagement'), icon: '🛏️' });
      items.push({ route: 'INVENTORY', label: t('medicineInventory'), icon: '💊' });
    } else if (role === 'HOSPITAL_ADMIN' || role === 'FACILITY_STAFF') {
      items.push({ route: 'FACILITY_DASHBOARD', label: t('facilityDashboard'), icon: '🏥' });
      items.push({ route: 'BEDS', label: t('bedManagement'), icon: '🛏️' });
      items.push({ route: 'EQUIPMENT', label: t('equipmentManagement'), icon: '⚙️' });
      items.push({ route: 'INVENTORY', label: t('medicineInventory'), icon: '💊' });
      items.push({ route: 'REFERRALS', label: t('referrals'), icon: '📋' });
      items.push({ route: 'APPOINTMENTS', label: t('appointments'), icon: '📅' });
    } else if (role === 'SUPER_ADMIN') {
      items.push({ route: 'DISTRICT_DASHBOARD', label: t('districtDashboard'), icon: '🏛️' });
      items.push({ route: 'STALE_MONITOR', label: t('staleMonitoring'), icon: '⚠️' });
      items.push({ route: 'BEDS', label: t('bedManagement'), icon: '🛏️' });
      items.push({ route: 'EQUIPMENT', label: t('equipmentManagement'), icon: '⚙️' });
      items.push({ route: 'INVENTORY', label: t('medicineInventory'), icon: '💊' });
      items.push({ route: 'REFERRALS', label: t('referrals'), icon: '📋' });
    } else {
      // General Fallback
      items.push({ route: 'DOCTOR_DASHBOARD', label: t('dashboard'), icon: '📊' });
      items.push({ route: 'BEDS', label: t('bedManagement'), icon: '🛏️' });
      items.push({ route: 'INVENTORY', label: t('medicineInventory'), icon: '💊' });
    }

    return items;
  };

  const navItems = getNavItems();

  return (
    <div
      style={{
        width: 260,
        backgroundColor: Colors.sidebarBg,
        color: Colors.sidebarText,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        borderRight: `1px solid ${Colors.border}`,
        userSelect: 'none',
      }}
    >
      {/* Brand Header */}
      <div>
        <div
          style={{
            padding: `${Spacing.lg}px ${Spacing.md}px`,
            borderBottom: '1px solid #1E293B',
            display: 'flex',
            alignItems: 'center',
            gap: Spacing.sm,
          }}
        >
          <span style={{ fontSize: '24px' }}>🛡️</span>
          <div>
            <div style={{ color: '#FFFFFF', fontWeight: Typography.fontWeights.bold, fontSize: Typography.fontSizes.lg }}>
              CareGrid
            </div>
            <div style={{ fontSize: Typography.fontSizes.xs, color: '#64748B' }}>
              Rural Healthcare Platform
            </div>
          </div>
        </div>

        {/* Nav List */}
        <div style={{ padding: `${Spacing.md}px 0` }}>
          {navItems.map((item) => {
            const isActive = currentRoute === item.route;
            return (
              <div
                key={item.route}
                onClick={() => onNavigate(item.route)}
                data-testid={`nav-${item.route}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: Spacing.sm,
                  padding: `${Spacing.sm}px ${Spacing.md}px`,
                  margin: `2px ${Spacing.sm}px`,
                  borderRadius: Spacing.borderRadius.md,
                  cursor: 'pointer',
                  backgroundColor: isActive ? Colors.sidebarActiveBg : 'transparent',
                  color: isActive ? Colors.sidebarTextActive : Colors.sidebarText,
                  fontWeight: isActive ? Typography.fontWeights.semibold : Typography.fontWeights.regular,
                  fontSize: Typography.fontSizes.sm,
                  transition: 'background 0.15s ease',
                }}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* User Footer */}
      <div style={{ padding: Spacing.md, borderTop: '1px solid #1E293B' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              backgroundColor: Colors.primary,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFF',
              fontWeight: Typography.fontWeights.bold,
            }}
          >
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ color: '#FFF', fontSize: Typography.fontSizes.sm, fontWeight: Typography.fontWeights.medium, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
              {user?.name || 'CareGrid Staff'}
            </div>
            <div style={{ color: '#64748B', fontSize: Typography.fontSizes.xs }}>
              {user?.role || 'DOCTOR'}
            </div>
          </div>
        </div>

        <button
          onClick={logout}
          data-testid="logout-btn"
          style={{
            width: '100%',
            padding: `${Spacing.xs}px ${Spacing.sm}px`,
            backgroundColor: '#1E293B',
            color: '#F87171',
            border: 'none',
            borderRadius: Spacing.borderRadius.sm,
            cursor: 'pointer',
            fontSize: Typography.fontSizes.xs,
            fontWeight: Typography.fontWeights.medium,
          }}
        >
          ← {t('logout')}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
