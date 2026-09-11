// Authentication Service integrating with backend /auth & /users endpoints

import { api } from '../api/client';
import {
  setAuthTokens,
  clearAuthSession,
  getAccessToken,
  getRefreshToken,
} from '../api/auth';
import {
  AuthUser,
  Language,
  LoginRequest,
  LoginResponse,
  UserProfile,
} from '../types';
import { setLanguage } from '../i18n';

export const authService = {
  /**
   * Login with email and password
   */
  login: async (req: LoginRequest): Promise<LoginResponse> => {
    const res = await api.post<LoginResponse>('/auth/login', req);
    setAuthTokens(res.accessToken, res.refreshToken, res.user);

    // Sync app language with user's preferred language
    if (res.user.preferredLanguage) {
      await setLanguage(res.user.preferredLanguage);
    }

    return res;
  },

  /**
   * Restore existing session from stored tokens
   */
  restoreSession: async (): Promise<AuthUser | null> => {
    const token = getAccessToken();
    const refreshToken = getRefreshToken();

    if (!token && !refreshToken) {
      return null;
    }

    try {
      const userProfile = await api.get<UserProfile>('/users/me');
      const authUser: AuthUser = {
        id: userProfile.id,
        email: userProfile.email,
        name: userProfile.name,
        role: userProfile.role,
        preferredLanguage: userProfile.preferredLanguage,
        phone: userProfile.phone,
      };

      if (authUser.preferredLanguage) {
        await setLanguage(authUser.preferredLanguage);
      }

      return authUser;
    } catch {
      clearAuthSession();
      return null;
    }
  },

  /**
   * Logout and revoke refresh token on backend
   */
  logout: async (): Promise<void> => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore network errors on logout
    } finally {
      clearAuthSession();
    }
  },

  /**
   * Update preferred language on backend and locally
   */
  changeLanguage: async (lang: Language): Promise<void> => {
    await setLanguage(lang);
    try {
      await api.patch('/users/me/language', { language: lang });
    } catch {
      // Offline/unauthenticated fallback handled gracefully
    }
  },
};

export default authService;
