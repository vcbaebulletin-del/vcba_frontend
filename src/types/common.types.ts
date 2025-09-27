// Common types used across the application
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: {
    message: string;
    details?: any;
  };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface FormFieldError {
  field: string;
  message: string;
}

export interface ValidationErrors {
  [key: string]: string;
}

export type UserRole = 'admin' | 'student';

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export interface RouteConfig {
  path: string;
  component: React.ComponentType;
  exact?: boolean;
  protected?: boolean;
  roles?: UserRole[];
  redirect?: string;
}
