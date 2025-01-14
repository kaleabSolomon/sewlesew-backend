export class ApiResponse<T> {
  status: 'success' | 'error';
  message: string;
  timestamp: string;
  data: T | null;
  metadata?: Metadata;

  constructor(
    status: 'success' | 'error',
    message: string,
    data: T | null = null,
    metadata?: Metadata,
  ) {
    this.status = status;
    this.message = message;
    this.timestamp = new Date().toISOString(); // Default timestamp
    this.data = data;
    this.metadata = metadata;
  }
}

export interface Metadata {
  totalItems?: number;
  currentPage?: number;
  totalPages?: number;
  pageSize?: number;
  [key: string]: any;
}
