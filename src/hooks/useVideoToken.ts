'use client';

import { useState, useCallback } from 'react';
import { apiService } from '@/services/api';
import { VideoToken } from '@/types/video';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

export function useVideoToken() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getTokenForVisit = useCallback(async (visitId: string): Promise<VideoToken | null> => {
    
    if (!user) {
      toast.error('User not authenticated');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Determine user type based on role
      let userType: 'provider' | 'patient' = 'patient';
      
      if (user.role_name === 'provider' || user.role_name === 'admin') {
        userType = 'provider';
      }

      
      const tokenData = await apiService.getVideoToken(visitId, user.user_id, userType);
      


      if (!tokenData) {
        console.error('❌ API returned null/undefined token data');
        return null;
      }

      // Auto-start the visit when token is successfully obtained
      try {
        await apiService.startVisit(visitId, {
          room_name: tokenData.room_name,
          // Note: room_sid will be generated when the room is actually created by Twilio
        });
      } catch (startError: any) {
        // Don't fail the token request if start fails
      }

      return tokenData;
    } catch (error: any) {
      const message = error.response?.data?.error || error.message || 'Failed to get video token';
      setError(message);
      toast.error(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    getTokenForVisit,
    isLoading,
    error,
    clearError,
    currentUser: user,
  };
}