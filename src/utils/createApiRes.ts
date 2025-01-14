import { ApiResponse, Metadata } from 'src/common/types';

export const createApiResponse = <T>({
  status,
  message,
  data = null,
  metadata,
  timestamp = new Date().toISOString(),
}: {
  status: 'success' | 'error';
  message: string;
  data?: T | null;
  metadata?: Metadata;
  timestamp?: string;
}): ApiResponse<T> => ({
  status,
  message,
  timestamp,
  data,
  metadata,
});
