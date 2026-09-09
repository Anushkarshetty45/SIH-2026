// Login Screen for CareGrid Mobile — React Native
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
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
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.keyboardContainer}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Top Language Switcher */}
        <View style={styles.langRow}>
          {(['mr', 'hi', 'en'] as SupportedLanguage[]).map((lang) => {
            const isSelected = activeLanguage === lang;
            const label =
              lang === 'mr' ? 'मराठी' : lang === 'hi' ? 'हिन्दी' : 'English';
            return (
              <TouchableOpacity
                key={lang}
                onPress={() => handleLanguageChange(lang)}
                style={[
                  styles.langButton,
                  isSelected && styles.langButtonSelected,
                ]}
                activeOpacity={0.7}
                accessibilityRole="button"
              >
                <Text
                  style={[
                    styles.langButtonText,
                    isSelected && styles.langButtonTextSelected,
                  ]}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Main Login Card */}
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>{t('app.name')}</Text>
            <Text style={styles.subtitle}>{t('app.tagline')}</Text>
          </View>

          {errorMsg && (
            <View style={styles.errorContainer}>
              <ErrorState message={errorMsg} />
            </View>
          )}

          <TextInput
            label={t('auth.email')}
            value={email}
            onChangeText={setEmail}
            placeholder="asha@caregrid.org / doctor@caregrid.org"
            keyboardType="email-address"
            autoCapitalize="none"
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

          <View style={styles.submitContainer}>
            <Button
              title={isLoading ? t('auth.loggingIn') : t('auth.login')}
              onPress={handleSubmit}
              isLoading={isLoading}
              testID="login-submit-button"
            />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  langRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.xxl,
    backgroundColor: Colors.surface,
    padding: Spacing.xs,
    borderRadius: Spacing.borderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  langButton: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: Spacing.borderRadius.full,
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  langButtonSelected: {
    backgroundColor: Colors.primary,
  },
  langButtonText: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: Typography.fontWeights.medium,
    color: Colors.textPrimary,
  },
  langButtonTextSelected: {
    color: Colors.textInverse,
    fontWeight: Typography.fontWeights.bold,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Spacing.borderRadius.lg,
    padding: Spacing.xl,
    maxWidth: 400,
    width: '100%',
    borderWidth: 1,
    borderColor: Colors.border,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: Typography.fontSizes.xxl,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.primary,
  },
  subtitle: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  errorContainer: {
    marginBottom: Spacing.md,
  },
  submitContainer: {
    marginTop: Spacing.lg,
  },
});

export default LoginScreen;
