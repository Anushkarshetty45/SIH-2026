// React Authentication Context & Session State
import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthUser, Language, LoginRequest, UserRole } from '../types';
import { authService } from '../services/auth.service';
import { registerAuthFailureHandler } from '../api/auth';
import { getCurrentLanguage, SupportedLanguage } from '../i18n';

export interface AuthContextType {
  user: AuthUser | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  activeLanguage: SupportedLanguage;
  login: (req: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  switchLanguage: (lang: Language | SupportedLanguage) => Promise<void>;
  hasRole: (allowedRoles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeLanguage, setActiveLanguage] = useState<SupportedLanguage>(getCurrentLanguage());

  useEffect(() => {
    // Register global 401 unrecoverable auth failure handler
    registerAuthFailureHandler(() => {
      setUser(null);
    });

    // Attempt session restoration on mount
    const initSession = async () => {
      try {
        const restoredUser = await authService.restoreSession();
        setUser(restoredUser);
      } catch {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initSession();
  }, []);

  const login = async (req: LoginRequest): Promise<void> => {
    setIsLoading(true);
    try {
      const response = await authService.login(req);
      setUser(response.user);
      setActiveLanguage(getCurrentLanguage());
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    setIsLoading(true);
    try {
      await authService.logout();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const switchLanguage = async (lang: Language | SupportedLanguage): Promise<void> => {
    const normalized: Language =
      lang === 'mr' || lang === 'MARATHI'
        ? 'MARATHI'
        : lang === 'hi' || lang === 'HINDI'
        ? 'HINDI'
        : 'ENGLISH';

    await authService.changeLanguage(normalized);
    setActiveLanguage(getCurrentLanguage());
  };

  const hasRole = (allowedRoles: UserRole[]): boolean => {
    if (!user) return false;
    return allowedRoles.includes(user.role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || null,
        isAuthenticated: !!user,
        isLoading,
        activeLanguage,
        login,
        logout,
        switchLanguage,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
