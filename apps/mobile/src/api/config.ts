// API Client Configuration — React Native & Android Aware
import { Platform } from 'react-native';

declare const process: { env: Record<string, string | undefined> };

export interface ApiConfig {
  baseURL: string;
  timeout: number;
  headers: Record<string, string>;
  is2GMode: boolean;
}

/**
 * Android emulator routes host machine loopback to 10.0.2.2
 * For physical Android devices on Wi-Fi, update via setBaseURL('http://<YOUR_PC_IP>:3000/api/v1')
 */
const getDefaultBaseURL = (): string => {
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3000/api/v1';
  }
  return 'http://localhost:3000/api/v1';
};

export const API_CONFIG: ApiConfig = {
  baseURL: getDefaultBaseURL(),
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
