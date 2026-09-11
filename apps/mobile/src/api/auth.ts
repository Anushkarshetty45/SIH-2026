// Auth Token & Session Manager

import { AuthUser, UserSession } from '../types';

let inMemoryAccessToken: string | null = null;
let inMemoryRefreshToken: string | null = null;
let inMemoryUser: AuthUser | null = null;

let onAuthFailureCallback: (() => void) | null = null;

export function setAuthTokens(accessToken: string, refreshToken: string, user?: AuthUser): void {
  inMemoryAccessToken = accessToken;
  inMemoryRefreshToken = refreshToken;
  if (user) {
    inMemoryUser = user;
  }
}

export function getAccessToken(): string | null {
  return inMemoryAccessToken;
}

export function getRefreshToken(): string | null {
  return inMemoryRefreshToken;
}

export function getCurrentUser(): AuthUser | null {
  return inMemoryUser;
}

export function clearAuthSession(): void {
  inMemoryAccessToken = null;
  inMemoryRefreshToken = null;
  inMemoryUser = null;
}

export function isAuthenticated(): boolean {
  return inMemoryAccessToken !== null;
}

export function registerAuthFailureHandler(callback: () => void): void {
  onAuthFailureCallback = callback;
}

export function triggerAuthFailure(): void {
  clearAuthSession();
  if (onAuthFailureCallback) {
    onAuthFailureCallback();
  }
}
