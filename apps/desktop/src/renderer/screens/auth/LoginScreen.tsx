// Desktop Login Screen
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Colors, Spacing, Typography } from '../../theme';
import { Button, TextInput, ErrorState } from '../../components';
import { t } from '../../i18n';

export const LoginScreen: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('doctor.shirwal@caregrid.in');
  const [password, setPassword] = useState('Doctor@123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login({ email, password });
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      data-testid="desktop-login-screen"
      style={{
        display: 'flex',
        minHeight: '100vh',
        backgroundColor: Colors.sidebarBg,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          width: 440,
          backgroundColor: Colors.surface,
          borderRadius: Spacing.borderRadius.lg,
          padding: Spacing.xl,
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: Spacing.lg }}>
          <span style={{ fontSize: '40px' }}>🛡️</span>
          <h2 style={{ margin: `${Spacing.xs}px 0 0`, fontSize: Typography.fontSizes.xl, color: Colors.textPrimary }}>
            CareGrid Desktop
          </h2>
          <span style={{ fontSize: Typography.fontSizes.xs, color: Colors.textMuted }}>
            Rural Healthcare Coordination Platform
          </span>
        </div>

        {error && (
          <div style={{ marginBottom: Spacing.md }}>
            <ErrorState message={error} />
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: Spacing.md }}>
          <TextInput
            label="Email Address"
            value={email}
            onChangeText={setEmail}
            type="email"
            testID="login-email-input"
          />

          <TextInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            type="password"
            testID="login-password-input"
          />

          <div style={{ marginTop: Spacing.sm }}>
            <Button
              title={loading ? 'Signing in...' : 'Sign In'}
              onPress={() => handleSubmit({ preventDefault: () => {} } as any)}
              isLoading={loading}
              size="lg"
              testID="login-submit-btn"
            />
          </div>
        </form>

        <div style={{ marginTop: Spacing.lg, textAlign: 'center', fontSize: Typography.fontSizes.xs, color: Colors.textMuted }}>
          Designed for Doctors, Facility Managers & District Officers
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
