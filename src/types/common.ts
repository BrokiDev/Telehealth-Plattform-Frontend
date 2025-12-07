// API Response types (matches backend StandardResponse format)
export interface ApiResponse<T = any> {
  statusCode: number;
  status: 'success' | 'error';
  message: string;
  data?: T;
  error?: string;
  timestamp: string;
  requestId?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Common utility types
export interface SelectOption {
  value: string;
  label: string;
}

export interface TableColumn<T = any> {
  key: keyof T | string;
  title: string;
  render?: (value: any, record: T) => React.ReactNode;
  sortable?: boolean;
}

// Form types
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'select' | 'textarea' | 'date' | 'tel';
  required?: boolean;
  placeholder?: string;
  options?: SelectOption[];
  validation?: {
    pattern?: RegExp;
    message?: string;
  };
}

// Layout types
export interface MenuItem {
  key: string;
  label: string;
  icon?: React.ReactNode;
  href: string;
  roles?: string[];
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
}