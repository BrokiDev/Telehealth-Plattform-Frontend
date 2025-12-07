'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { AuthContext, User, LoginCredentials } from '@/types/auth';
import { apiService } from '@/services/api';
import { toast } from 'sonner';

const authContext = createContext<AuthContext | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingAuth, setIsCheckingAuth] = useState(false);

  // Check for existing token on mount
  useEffect(() => {
    const checkAuth = async () => {
      // Prevent multiple simultaneous auth checks
      if (isCheckingAuth) {
        return;
      }
      
      setIsCheckingAuth(true);
      
      try {
        const savedToken = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
        
        if (savedToken) {
          setToken(savedToken);
          const response = await apiService.verifyToken();
          setUser(response.user);
        }
      } catch (error) {
        // Clear invalid token
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth_token');
        }
        setUser(null);
        setToken(null);
      } finally {
        setIsLoading(false);
        setIsCheckingAuth(false);
      }
    };

    checkAuth();
  }, []);

  // Function to refresh user profile data
  const refreshProfile = async () => {
    try {
      if (token) {
        const response = await apiService.verifyToken();
        setUser(response.user);
      }
    } catch (error) {
    }
  };

  const login = async (credentials: LoginCredentials) => {
    try {
      setIsLoading(true);
      const response = await apiService.login(credentials);
      
      setUser(response.user);
      setToken(response.token);
      
      toast.success(`Welcome back, ${response.user.first_name}!`);
    } catch (error: any) {
      const message = error.response?.data?.error || 'Login failed. Please try again.';
      toast.error(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await apiService.logout();
    } catch (error) {
    } finally {
      setUser(null);
      setToken(null);
      toast.success('Logged out successfully');
    }
  };

  const value: AuthContext = {
    user,
    token,
    isLoading,
    login,
    logout,
    refreshProfile,
    isAuthenticated: !!user && !!token,
  };

  return (
    <authContext.Provider value={value}>
      {children}
    </authContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(authContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export { authContext };