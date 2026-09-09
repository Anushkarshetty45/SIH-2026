// API Client Configuration

export interface ApiConfig {
  baseURL: string;
  timeout: number;
  headers: Record<string, string>;
  is2GMode: boolean;
}

export const API_CONFIG: ApiConfig = {
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3000/api/v1',
  timeout: 10000, // 10s default timeout (2G-aware)
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'X-Client-Platform': 'mobile',
  },
  is2GMode: false,
};

export function setBaseURL(url: string): void {
  API_CONFIG.baseURL = url;
}

export function set2GMode(enabled: boolean): void {
  API_CONFIG.is2GMode = enabled;
  if (enabled) {
    API_CONFIG.headers['X-Low-Bandwidth'] = 'true';
    API_CONFIG.timeout = 20000; // Extend timeout for weak connectivity
  } else {
    delete API_CONFIG.headers['X-Low-Bandwidth'];
    API_CONFIG.timeout = 10000;
  }
}
