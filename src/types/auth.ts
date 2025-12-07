// Authentication and User types - matches backend AuthenticatedUser interface
export interface User {
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  role_name: string;
  permissions: Record<string, any>;
  organization_id?: string;
  provider_id?: string;
  patient_id?: string;
  is_active: boolean;
  email_verified: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
}

export interface AuthContext {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  isAuthenticated: boolean;
}

export type UserRole = 'admin' | 'provider' | 'patient';

export interface Permission {
  resource: string;
  actions: string[];
}