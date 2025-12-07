'use client';

import { useEffect, useRef, useState } from 'react';
import { apiService } from '@/services/api';

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: Event) => void) | null;
  onend: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

interface UseSpeechRecognitionProps {
  visitId: string;
  speakerName: string;
  speakerType: 'provider' | 'patient';
  isEnabled: boolean;
}

export function useSpeechRecognition({ 
  visitId, 
  speakerName, 
  speakerType, 
  isEnabled 
}: UseSpeechRecognitionProps) {
  const [isSupported, setIsSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    // Check if browser supports Speech Recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setIsSupported(!!SpeechRecognition);

    if (!SpeechRecognition) {
      console.warn('❌ Speech Recognition not supported in this browser');
      return;
    }

    // Initialize Speech Recognition
    const recognition = new SpeechRecognition();
    recognition.continuous = true; // Keep listening
    recognition.interimResults = true; // Get interim results
    recognition.lang = 'es-DO'; // Spanish (Dominican Republic)

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = async (event: SpeechRecognitionEvent) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript;
        const confidence = result[0].confidence;
        const isFinal = result.isFinal;



        // Only save final transcriptions to reduce database writes
        if (!isFinal) {
          continue;
        }

        // Save transcription to backend
        try {
          await apiService.saveTranscription(visitId, {
            speaker_name: speakerName,
            speaker_type: speakerType,
            text: transcript,
            confidence: confidence || 0.5,
            is_final: isFinal,
            language: 'es-DO',
            timestamp: new Date().toISOString()
          });
        } catch (error) {
          console.error('❌ Error saving transcription:', error);
        }
      }
    };

    recognition.onerror = (event: any) => {
      console.error('❌ Speech recognition error:', {
        error: event.error,
        message: event.message
      });
      
      // Handle specific errors
      if (event.error === 'not-allowed') {
        console.error('Microphone permission denied');
      } else if (event.error === 'no-speech') {
        // Don't stop listening on no-speech
        return;
      } else if (event.error === 'aborted') {
      } else if (event.error === 'network') {
        console.error('Network error in speech recognition');
      }
      
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      
      // Restart if still enabled (after a short delay to avoid rapid restarts)
      if (isEnabled && recognitionRef.current) {
        setTimeout(() => {
          if (isEnabled && recognitionRef.current) {
            try {
              recognitionRef.current.start();
              setIsListening(true);
            } catch (error: any) {
              if (error.message && !error.message.includes('already started')) {
                console.error('❌ Error restarting speech recognition:', error);
              }
            }
          }
        }, 500); // Wait 500ms before restarting
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (error) {
          // Ignore errors when stopping
        }
      }
    };
  }, [visitId, speakerName, speakerType]);

  // Start/stop recognition based on isEnabled
  useEffect(() => {
    if (!isSupported || !recognitionRef.current) return;

    if (isEnabled && !isListening) {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (error: any) {
        if (error.message && error.message.includes('already started')) {
          console.warn('⚠️ Speech recognition already started');
          setIsListening(true);
        } else {
          console.error('❌ Error starting speech recognition:', error);
        }
      }
    } else if (!isEnabled && isListening) {
      try {
        recognitionRef.current.stop();
        setIsListening(false);
      } catch (error) {
        console.error('❌ Error stopping speech recognition:', error);
      }
    }
  }, [isEnabled, isSupported, isListening, speakerName]);

  return {
    isSupported,
    isListening
  };
}
