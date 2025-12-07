'use client';

import { useEffect, useState, useRef } from 'react';
import { apiService } from '@/services/api';
import { cn } from '@/lib/utils';

interface Transcription {
  transcription_id: string;
  speaker_name: string | null;
  speaker_type: 'provider' | 'patient' | null;
  text: string;
  timestamp: string;
  confidence: number | null;
  is_final: boolean;
}

interface TranscriptionPanelProps {
  visitId: string;
  isEnabled: boolean;
}

export function TranscriptionPanel({ visitId, isEnabled }: TranscriptionPanelProps) {
  const [transcriptions, setTranscriptions] = useState<Transcription[]>([]);
  const [latestTranscription, setLatestTranscription] = useState<Transcription | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Poll for recent transcriptions when enabled
  useEffect(() => {
    if (!isEnabled) {
      setTranscriptions([]);
      setLatestTranscription(null);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      return;
    }

    const fetchRecentTranscriptions = async () => {
      try {
        const recent = await apiService.getRecentTranscriptions(visitId, 10); // Last 10 seconds
        
        if (recent.length > 0) {
          const newest = recent[recent.length - 1];
          
          // Only update if it's a different transcription
          if (!latestTranscription || newest.transcription_id !== latestTranscription.transcription_id) {
            setLatestTranscription(newest);
            
            // Auto-hide after 5 seconds
            if (timeoutRef.current) {
              clearTimeout(timeoutRef.current);
            }
            timeoutRef.current = setTimeout(() => {
              setLatestTranscription(null);
            }, 5000);
          }
        }
      } catch (error) {
        console.error('Error fetching transcriptions:', error);
      }
    };

    // Initial fetch
    fetchRecentTranscriptions();

    // Poll every 1 second for new transcriptions
    intervalRef.current = setInterval(fetchRecentTranscriptions, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [visitId, isEnabled, latestTranscription]);

  if (!isEnabled || !latestTranscription) {
    return null;
  }

  return (
    <div className="flex justify-center items-center pointer-events-none">
      <div 
        className="bg-black/80 backdrop-blur-sm rounded-lg px-4 py-2 max-w-2xl shadow-lg animate-fade-in"
      >
        <p className="text-white text-base font-medium text-center leading-relaxed">
          {latestTranscription.text}
        </p>
      </div>
    </div>
  );
}
