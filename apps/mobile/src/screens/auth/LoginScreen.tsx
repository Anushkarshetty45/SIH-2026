// Login Screen for CareGrid Mobile
import React, { useState } from 'react';
import { Colors, Spacing, Typography } from '../../theme';
import { Button, TextInput, ErrorState } from '../../components';
import { useAuth } from '../../context/AuthContext';
import { t, SupportedLanguage } from '../../i18n';
import { parseApiError } from '../../api/error-handler';

export const LoginScreen: React.FC = () => {
  const { login, switchLanguage, activeLanguage, isLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async () => {
    setErrorMsg(null);
    if (!email.trim() || !password.trim()) {
      setErrorMsg(t('common.required'));
      return;
    }

    try {
      await login({ email: email.trim(), password: password.trim() });
    } catch (err) {
      const parsed = parseApiError(err);
      if (parsed.isUnauthorized || parsed.statusCode === 401) {
        setErrorMsg(t('auth.invalidCredentials'));
      } else if (parsed.isNetworkError) {
        setErrorMsg(t('errors.network'));
      } else {
        setErrorMsg(t('errors.general'));
      }
    }
  };

  const handleLanguageChange = (lang: SupportedLanguage) => {
    switchLanguage(lang);
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: Colors.background,
        padding: Spacing.lg,
        boxSizing: 'border-box',
      }}
    >
      {/* Top Language Switcher */}
      <div
        style={{
          display: 'flex',
          gap: Spacing.sm,
          marginBottom: Spacing.xxl,
          backgroundColor: Colors.surface,
          padding: Spacing.xs,
          borderRadius: Spacing.borderRadius.full,
          border: `1px solid ${Colors.border}`,
        }}
      >
        {(['mr', 'hi', 'en'] as SupportedLanguage[]).map((lang) => {
          const isSelected = activeLanguage === lang;
          const label = lang === 'mr' ? 'मराठी' : lang === 'hi' ? 'हिन्दी' : 'English';
          return (
            <button
              key={lang}
              type="button"
              onClick={() => handleLanguageChange(lang)}
              style={{
                border: 'none',
                backgroundColor: isSelected ? Colors.primary : 'transparent',
                color: isSelected ? Colors.textInverse : Colors.textPrimary,
                borderRadius: Spacing.borderRadius.full,
                padding: `${Spacing.xs}px ${Spacing.md}px`,
                fontSize: Typography.fontSizes.sm,
                fontWeight: isSelected ? Typography.fontWeights.bold : Typography.fontWeights.medium,
                cursor: 'pointer',
                minHeight: 36,
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Main Login Card */}
      <div
        style={{
          backgroundColor: Colors.surface,
          borderRadius: Spacing.borderRadius.lg,
          padding: Spacing.xl,
          maxWidth: 400,
          width: '100%',
          border: `1px solid ${Colors.border}`,
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
          boxSizing: 'border-box',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: Spacing.xl }}>
          <h1
            style={{
              fontSize: Typography.fontSizes.xxl,
              fontWeight: Typography.fontWeights.bold,
              color: Colors.primary,
              margin: 0,
            }}
          >
            {t('app.name')}
          </h1>
          <p
            style={{
              fontSize: Typography.fontSizes.sm,
              color: Colors.textSecondary,
              marginTop: Spacing.xs,
              marginBottom: 0,
            }}
          >
            {t('app.tagline')}
          </p>
        </div>

        {errorMsg && (
          <div style={{ marginBottom: Spacing.md }}>
            <ErrorState message={errorMsg} />
          </div>
        )}

        <TextInput
          label={t('auth.email')}
          value={email}
          onChangeText={setEmail}
          placeholder="asha@caregrid.org / doctor@caregrid.org"
          keyboardType="email"
          required
          testID="login-email-input"
        />

        <TextInput
          label={t('auth.password')}
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          secureTextEntry
          required
          testID="login-password-input"
        />

        <div style={{ marginTop: Spacing.lg }}>
          <Button
            title={isLoading ? t('auth.loggingIn') : t('auth.login')}
            onPress={handleSubmit}
            isLoading={isLoading}
            testID="login-submit-button"
          />
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
