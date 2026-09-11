// Desktop Authentication Context & Session Management
import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthUser, UserRole, Language, LoginRequest, LoginResponse } from '../types';
import { api, setAuthToken } from '../api/client';
import { setDesktopLanguage } from '../i18n';

export interface AuthContextType {
  user: AuthUser | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  language: Language;
  login: (req: LoginRequest) => Promise<void>;
  logout: () => void;
  changeLanguage: (lang: Language) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [language, setLanguage] = useState<Language>('ENGLISH');

  const login = async (req: LoginRequest) => {
    const res = await api.post<LoginResponse>('/auth/login', req);
    setAuthToken(res.accessToken);
    setUser(res.user);
    if (res.user.preferredLanguage) {
      setLanguage(res.user.preferredLanguage);
      setDesktopLanguage(res.user.preferredLanguage);
    }
  };

  const logout = () => {
    setAuthToken(null);
    setUser(null);
  };

  const changeLanguage = (lang: Language) => {
    setLanguage(lang);
    setDesktopLanguage(lang);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || null,
        isAuthenticated: Boolean(user),
        language,
        login,
        logout,
        changeLanguage,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
