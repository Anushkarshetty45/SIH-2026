// Structured Error Mapping for CareGrid API

import { AxiosError } from 'axios';
import { ApiErrorResponse } from '../types';

export interface StandardApiError {
  statusCode: number;
  message: string;
  isConflict: boolean;
  isUnauthorized: boolean;
  isForbidden: boolean;
  isNetworkError: boolean;
  isTimeout: boolean;
  rawResponse?: ApiErrorResponse;
}

export function parseApiError(error: unknown): StandardApiError {
  if (!error) {
    return {
      statusCode: 500,
      message: 'errors.general',
      isConflict: false,
      isUnauthorized: false,
      isForbidden: false,
      isNetworkError: false,
      isTimeout: false,
    };
  }

  const axiosErr = error as AxiosError<ApiErrorResponse>;

  if (axiosErr.response) {
    const status = axiosErr.response.status;
    const data = axiosErr.response.data;
    const msg = data?.message
      ? Array.isArray(data.message)
        ? data.message.join(', ')
        : data.message
      : axiosErr.message;

    return {
      statusCode: status,
      message: msg,
      isConflict: status === 409,
      isUnauthorized: status === 401,
      isForbidden: status === 403,
      isNetworkError: false,
      isTimeout: false,
      rawResponse: data,
    };
  }

  if (axiosErr.code === 'ECONNABORTED' || axiosErr.message?.includes('timeout')) {
    return {
      statusCode: 408,
      message: 'errors.network',
      isConflict: false,
      isUnauthorized: false,
      isForbidden: false,
      isNetworkError: true,
      isTimeout: true,
    };
  }

  // Network offline / unreachable
  return {
    statusCode: 0,
    message: 'errors.network',
    isConflict: false,
    isUnauthorized: false,
    isForbidden: false,
    isNetworkError: true,
    isTimeout: false,
  };
}
