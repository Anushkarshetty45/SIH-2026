import { setAuthTokens, getAccessToken, getRefreshToken, clearAuthSession, isAuthenticated } from '../src/api/auth';
import { parseApiError } from '../src/api/error-handler';
import { authService } from '../src/services/auth.service';
import { api } from '../src/api/client';
import { AuthUser, LoginResponse, UserProfile } from '../src/types';

jest.mock('../src/api/client', () => ({
  api: {
    post: jest.fn(),
    get: jest.fn(),
    patch: jest.fn(),
  },
  apiClient: {
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
  },
}));

describe('Auth & Session Management', () => {
  beforeEach(() => {
    clearAuthSession();
    jest.clearAllMocks();
  });

  it('should store and retrieve tokens correctly', () => {
    expect(isAuthenticated()).toBe(false);

    setAuthTokens('mock-access-token', 'mock-refresh-token');
    expect(isAuthenticated()).toBe(true);
    expect(getAccessToken()).toBe('mock-access-token');
    expect(getRefreshToken()).toBe('mock-refresh-token');

    clearAuthSession();
    expect(isAuthenticated()).toBe(false);
    expect(getAccessToken()).toBeNull();
  });

  it('should perform login and set session', async () => {
    const mockUser: AuthUser = {
      id: 'user-123',
      email: 'asha@caregrid.org',
      name: 'Radha Shinde',
      role: 'ASHA_WORKER',
      preferredLanguage: 'MARATHI',
    };

    const mockResponse: LoginResponse = {
      accessToken: 'access-jwt-123',
      refreshToken: 'refresh-jwt-123',
      user: mockUser,
    };

    (api.post as jest.Mock).mockResolvedValue(mockResponse);

    const result = await authService.login({
      email: 'asha@caregrid.org',
      password: 'password123',
    });

    expect(api.post).toHaveBeenCalledWith('/auth/login', {
      email: 'asha@caregrid.org',
      password: 'password123',
    });
    expect(result.accessToken).toBe('access-jwt-123');
    expect(getAccessToken()).toBe('access-jwt-123');
    expect(getRefreshToken()).toBe('refresh-jwt-123');
  });

  it('should restore session from /users/me when tokens exist', async () => {
    setAuthTokens('existing-access-token', 'existing-refresh-token');

    const mockProfile: UserProfile = {
      id: 'user-doc-1',
      email: 'doctor@caregrid.org',
      name: 'Dr. Deshmukh',
      role: 'DOCTOR',
      preferredLanguage: 'MARATHI',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    (api.get as jest.Mock).mockResolvedValue(mockProfile);

    const user = await authService.restoreSession();
    expect(api.get).toHaveBeenCalledWith('/users/me');
    expect(user).not.toBeNull();
    expect(user?.role).toBe('DOCTOR');
    expect(user?.name).toBe('Dr. Deshmukh');
  });

  it('should clear session if session restoration fails', async () => {
    setAuthTokens('invalid-token', 'invalid-refresh');
    (api.get as jest.Mock).mockRejectedValue(new Error('Unauthorized'));

    const user = await authService.restoreSession();
    expect(user).toBeNull();
    expect(getAccessToken()).toBeNull();
  });

  it('should parse 401, 403, and 409 errors appropriately', () => {
    const error401 = { response: { status: 401, data: { message: 'Unauthorized' } } };
    const parsed401 = parseApiError(error401);
    expect(parsed401.isUnauthorized).toBe(true);
    expect(parsed401.statusCode).toBe(401);

    const error403 = { response: { status: 403, data: { message: 'Forbidden' } } };
    const parsed403 = parseApiError(error403);
    expect(parsed403.isForbidden).toBe(true);
    expect(parsed403.statusCode).toBe(403);

    const error409 = { response: { status: 409, data: { message: 'Slot already booked' } } };
    const parsed409 = parseApiError(error409);
    expect(parsed409.isConflict).toBe(true);
    expect(parsed409.statusCode).toBe(409);
  });
});
