'use client';

import { useEffect, useRef, useState } from 'react';
import { RemoteParticipant } from 'twilio-video';
import { useVideoCall } from '@/hooks/useVideoCall';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { ParticipantAvatar } from '@/components/video/ParticipantAvatar';
import { TranscriptionPanel } from '@/components/video/TranscriptionPanel';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { apiService } from '@/services/api';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Monitor,
  MonitorOff,
  Phone,
  PhoneOff,
  Users,
  Settings,
  MessageSquare,
  MessageSquareOff,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// Helper function to extract display name from Twilio identity
// Identity format: "userType-userId-visitId::DisplayName"
// Example: "provider-abc123-visit456::Dr. Jane Smith"
function getDisplayName(identity: string): string {
  // Check if identity contains display name (after ::)
  if (identity.includes('::')) {
    const parts = identity.split('::');
    if (parts.length === 2 && parts[1]) {
      return parts[1];
    }
  }
  
  // Fallback: Parse the identity to extract user type
  const parts = identity.split('-');
  if (parts.length >= 1) {
    const userType = parts[0];
    if (userType === 'provider') {
      return 'Provider';
    } else if (userType === 'patient') {
      return 'Patient';
    }
  }
  return identity;
}

// Helper component to monitor remote participant video track state
function VideoTrackMonitor({ participant }: { participant: RemoteParticipant }) {
  const [hasVideoTrack, setHasVideoTrack] = useState(false);

  useEffect(() => {
    const checkVideoTracks = () => {
      let hasEnabledVideo = false;
      participant.videoTracks.forEach((publication) => {
        if (publication.isSubscribed && publication.track && publication.track.isEnabled) {
          hasEnabledVideo = true;
        }
      });
      setHasVideoTrack(hasEnabledVideo);
    };

    checkVideoTracks();

    participant.on('trackSubscribed', checkVideoTracks);
    participant.on('trackUnsubscribed', checkVideoTracks);
    participant.on('trackEnabled', checkVideoTracks);
    participant.on('trackDisabled', checkVideoTracks);

    return () => {
      participant.removeAllListeners('trackSubscribed');
      participant.removeAllListeners('trackUnsubscribed');
      participant.removeAllListeners('trackEnabled');
      participant.removeAllListeners('trackDisabled');
    };
  }, [participant]);

  if (hasVideoTrack) return null;

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-gray-800 rounded-lg">
      <ParticipantAvatar identity={participant.identity} size="lg" />
    </div>
  );
}

// Helper component for thumbnail video track monitoring
function VideoTrackMonitorThumbnail({ participant }: { participant: RemoteParticipant }) {
  const [hasVideoTrack, setHasVideoTrack] = useState(false);

  useEffect(() => {
    const checkVideoTracks = () => {
      let hasEnabledVideo = false;
      participant.videoTracks.forEach((publication) => {
        if (publication.isSubscribed && publication.track && publication.track.isEnabled) {
          hasEnabledVideo = true;
        }
      });
      setHasVideoTrack(hasEnabledVideo);
    };

    checkVideoTracks();

    participant.on('trackSubscribed', checkVideoTracks);
    participant.on('trackUnsubscribed', checkVideoTracks);
    participant.on('trackEnabled', checkVideoTracks);
    participant.on('trackDisabled', checkVideoTracks);

    return () => {
      participant.removeAllListeners('trackSubscribed');
      participant.removeAllListeners('trackUnsubscribed');
      participant.removeAllListeners('trackEnabled');
      participant.removeAllListeners('trackDisabled');
    };
  }, [participant]);

  if (hasVideoTrack) return null;

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
      <ParticipantAvatar identity={participant.identity} size="sm" />
    </div>
  );
}

interface VideoCallProps {
  visitId: string;
  token: string;
  roomName: string;
  identity: string;
  onDisconnect: () => void;
  displayName?: string; // Optional display name for local user
  isGuest?: boolean; // Whether this is a guest user (no auth)
}

export function VideoCall({ visitId, token, roomName, identity, onDisconnect, displayName, isGuest = false }: VideoCallProps) {

  // Transcription state
  const [isTranscriptionEnabled, setIsTranscriptionEnabled] = useState(false);
  const [isTogglingTranscription, setIsTogglingTranscription] = useState(false);

  // Extract speaker info from identity
  // Identity format: "userType-userId-visitId::DisplayName"
  const identityParts = identity.split('::');
  const speakerName = identityParts.length === 2 ? identityParts[1] : (displayName || 'User');
  const userTypePart = identityParts[0].split('-')[0] as 'provider' | 'patient';

  // Initialize speech recognition for this user
  const { isSupported: isSpeechSupported, isListening } = useSpeechRecognition({
    visitId,
    speakerName,
    speakerType: userTypePart,
    isEnabled: isTranscriptionEnabled
  });

  // Handle room connection and send room_sid to backend
  const handleRoomConnected = async (roomSid: string) => {
    
    // Guests don't need to call startVisit - only providers do
    if (isGuest) {
      return;
    }
    
    try {
      await apiService.startVisit(visitId, { 
        room_sid: roomSid 
      });
    } catch (error: any) {
      // Don't fail the video call if this fails
    }
  };

  // Handle transcription toggle
  const handleToggleTranscription = async () => {
    if (isTogglingTranscription) return;

    // Check if browser supports speech recognition
    if (!isSpeechSupported) {
      toast.error('Speech recognition not supported in this browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    setIsTogglingTranscription(true);
    try {
      if (isTranscriptionEnabled) {
        // Disable transcription
        await apiService.disableTranscription(visitId);
        setIsTranscriptionEnabled(false);
        toast.success('Transcription disabled');
      } else {
        // Enable transcription
        await apiService.enableTranscription(visitId);
        setIsTranscriptionEnabled(true);
        toast.success('Transcription enabled - Your audio will be transcribed');
      }
    } catch (error: any) {
      toast.error('Failed to toggle transcription: ' + (error.response?.data?.error || error.message));
    } finally {
      setIsTogglingTranscription(false);
    }
  };

  const {
    room,
    participants,
    isConnecting,
    isConnected,
    error,
    localVideoRef,
    videoControls,
    disconnect,
  } = useVideoCall({
    token,
    roomName,
    visitId,
    onDisconnect,
    onRoomConnected: handleRoomConnected,
  });



  const remoteVideoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());
  const remoteAudioRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const [showSettings, setShowSettings] = useState(false);
  const [participantNames, setParticipantNames] = useState<Map<string, string>>(new Map());

  // Helper to get participant display name
  const getParticipantName = (participant: RemoteParticipant): string => {
    const cachedName = participantNames.get(participant.sid);
    if (cachedName) return cachedName;
    return getDisplayName(participant.identity);
  };



  // Debug: Monitor local video ref
  useEffect(() => {

    
    // Force play if paused
    if (localVideoRef.current && localVideoRef.current.paused) {
      localVideoRef.current.play().catch(e => console.warn('Local video play:', e.message));
    }
  }, [localVideoRef.current, videoControls.isVideoEnabled]);

  // Track which tracks have been attached (using trackSid as key)
  const attachedTracksRef = useRef<Set<string>>(new Set());

  // Attach remote participant tracks - simple approach without moving
  useEffect(() => {
    
    participants.forEach((participant) => {
      const videoElement = remoteVideoRefs.current.get(participant.sid);
      const audioContainer = remoteAudioRefs.current.get(participant.sid);

      if (!videoElement || !audioContainer) {
        return;
      }


      // Attach existing video tracks
      participant.videoTracks.forEach((publication) => {
        if (publication.track && publication.isSubscribed) {
          const trackId = publication.trackSid;
          
          // Skip if already attached
          if (attachedTracksRef.current.has(trackId)) {
            return;
          }
          
          publication.track.attach(videoElement);
          attachedTracksRef.current.add(trackId);
        }
      });

      // Attach existing audio tracks
      participant.audioTracks.forEach((publication) => {
        if (publication.track && publication.isSubscribed) {
          const trackId = publication.trackSid;
          
          // Skip if already attached
          if (attachedTracksRef.current.has(trackId)) {
            return;
          }
          
          const audioEl = publication.track.attach();
          audioContainer.appendChild(audioEl);
          attachedTracksRef.current.add(trackId);
        }
      });

      // Listen for future track subscriptions
      const handleTrackSubscribed = (track: any) => {
        const videoEl = remoteVideoRefs.current.get(participant.sid);
        const audioEl = remoteAudioRefs.current.get(participant.sid);
        
        if (track.kind === 'video' && videoEl) {
          track.attach(videoEl);
        } else if (track.kind === 'audio' && audioEl) {
          const audioElement = track.attach();
          audioEl.appendChild(audioElement);
        }
      };

      const handleTrackUnsubscribed = (track: any) => {
        track.detach();
        // Clean up from tracking
        participant.videoTracks.forEach((pub) => {
          if (pub.trackSid) attachedTracksRef.current.delete(pub.trackSid);
        });
        participant.audioTracks.forEach((pub) => {
          if (pub.trackSid) attachedTracksRef.current.delete(pub.trackSid);
        });
      };

      participant.on('trackSubscribed', handleTrackSubscribed);
      participant.on('trackUnsubscribed', handleTrackUnsubscribed);
    });

    return () => {
      participants.forEach((participant) => {
        participant.removeAllListeners('trackSubscribed');
        participant.removeAllListeners('trackUnsubscribed');
      });
    };
  }, [participants]);

  const handleDisconnect = () => {
    disconnect();
    onDisconnect();
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <div className="text-red-600 mb-4">
              <PhoneOff className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Connection Failed
            </h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => {
              if (typeof window !== 'undefined' && typeof window.location !== 'undefined') {
                window.location.reload();
              }
            }}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isConnecting) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Connecting to Video Call
            </h3>
            <p className="text-gray-600">Please wait while we connect you...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-900 relative">
      {/* Recording Indicator Banner - Non-invasive, always visible when connected */}
      {isConnected && (
        <div className="absolute top-4 left-4 z-50 bg-red-600 text-white px-4 py-2 rounded-full shadow-lg flex items-center space-x-2">
          <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
          <span className="text-sm font-medium">Recording</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-gray-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-white" />
            <span className="text-white font-medium">
              {participants.length + 1} participant{participants.length !== 0 ? 's' : ''}
            </span>
          </div>
          <div className="text-gray-300 text-sm">
            Room: {roomName}
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowSettings(!showSettings)}
          className="text-white hover:bg-gray-700"
        >
          <Settings className="h-4 w-4" />
        </Button>
      </div>

      {/* Video Grid - Google Meet Style with max container size */}
      <div className="flex-1 p-4 flex items-center justify-center relative">
        <div className="relative w-full max-w-7xl h-full max-h-[calc(100vh-200px)] bg-gray-900 rounded-lg overflow-hidden">
          
          {/* Main area - Remote participant video */}
          {participants.length === 0 ? (
            // No participants - Show waiting message
            <div className="relative h-full flex items-center justify-center">
              <div className="text-center">
                <Users className="h-16 w-16 text-gray-500 mx-auto mb-4" />
                <p className="text-white text-lg font-medium">Waiting for participants...</p>
                <p className="text-gray-400 text-sm mt-2">You'll see them here once they join</p>
              </div>
            </div>
          ) : (
            // Remote video in main area
            <div className="relative w-full h-full flex items-center justify-center bg-gray-900">
              <video
                ref={(el) => {
                  if (el) {
                    remoteVideoRefs.current.set(participants[0].sid, el);
                  }
                }}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
          
              {/* Audio container for remote */}
              <div
                ref={(el) => {
                  if (el) {
                    remoteAudioRefs.current.set(participants[0].sid, el);
                  }
                }}
                className="hidden"
              />
              
              {/* Remote participant name */}
              <div className="absolute bottom-4 left-4 bg-black bg-opacity-70 text-white px-3 py-2 rounded-lg text-sm font-medium">
                {getParticipantName(participants[0])}
              </div>

              {/* Avatar overlay when video is off */}
              <VideoTrackMonitor participant={participants[0]} />
            </div>
          )}

          {/* Local video thumbnail - Bottom right corner */}
          <div className="absolute bottom-4 right-4 w-64 h-48 bg-gray-800 rounded-lg overflow-hidden shadow-2xl border-2 border-gray-700">
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
            />
            {!videoControls.isVideoEnabled && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                <ParticipantAvatar identity={identity} size="sm" />
              </div>
            )}
            
            <div className="absolute bottom-2 left-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs font-medium">
              {displayName || 'You'}
            </div>
          </div>

          {/* Additional participants if any (stacked above local) */}
          {participants.slice(1).map((participant, index) => (
            <div
              key={participant.sid}
              className="absolute right-4 w-48 h-36 bg-gray-800 rounded-lg overflow-hidden shadow-2xl border-2 border-gray-700"
              style={{ bottom: `${(index + 1) * 160 + 16}px` }}
            >
              <video
                ref={(el) => {
                  if (el) {
                    remoteVideoRefs.current.set(participant.sid, el);
                  }
                }}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
              
              {/* Audio container */}
              <div
                ref={(el) => {
                  if (el) {
                    remoteAudioRefs.current.set(participant.sid, el);
                  }
                }}
                className="hidden"
              />
              
              <div className="absolute top-2 left-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs font-medium truncate max-w-[180px]">
                {getParticipantName(participant)}
              </div>

              <VideoTrackMonitorThumbnail participant={participant} />
            </div>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="bg-gray-800 px-4 py-4">
        <div className="flex items-center justify-center space-x-4">
          <Button
            variant={videoControls.isAudioEnabled ? "default" : "destructive"}
            size="lg"
            onClick={videoControls.toggleAudio}
            className="rounded-full h-12 w-12 p-0"
          >
            {videoControls.isAudioEnabled ? (
              <Mic className="h-5 w-5" />
            ) : (
              <MicOff className="h-5 w-5" />
            )}
          </Button>

          <Button
            variant={videoControls.isVideoEnabled ? "default" : "destructive"}
            size="lg"
            onClick={videoControls.toggleVideo}
            className="rounded-full h-12 w-12 p-0"
          >
            {videoControls.isVideoEnabled ? (
              <Video className="h-5 w-5" />
            ) : (
              <VideoOff className="h-5 w-5" />
            )}
          </Button>

          <Button
            variant={videoControls.isScreenShared ? "default" : "outline"}
            size="lg"
            onClick={videoControls.toggleScreenShare}
            className="rounded-full h-12 w-12 p-0"
          >
            {videoControls.isScreenShared ? (
              <MonitorOff className="h-5 w-5" />
            ) : (
              <Monitor className="h-5 w-5" />
            )}
          </Button>

          <Button
            variant={isTranscriptionEnabled ? "default" : "outline"}
            size="lg"
            onClick={handleToggleTranscription}
            disabled={isTogglingTranscription || !isConnected}
            className="rounded-full h-12 w-12 p-0"
            title={isTranscriptionEnabled ? "Disable Transcription" : "Enable Transcription"}
          >
            {isTranscriptionEnabled ? (
              <MessageSquare className="h-5 w-5" />
            ) : (
              <MessageSquareOff className="h-5 w-5" />
            )}
          </Button>

          <Button
            variant="destructive"
            size="lg"
            onClick={handleDisconnect}
            className="rounded-full h-12 w-12 p-0"
          >
            <PhoneOff className="h-5 w-5" />
          </Button>
        </div>

        {/* Connection status */}
        <div className="flex items-center justify-center mt-3">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className={cn(
                'w-2 h-2 rounded-full',
                isConnected ? 'bg-green-500' : 'bg-red-500'
              )}></div>
              <span className="text-white text-sm">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            
            {isTranscriptionEnabled && (
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                <span className="text-blue-400 text-sm">
                  Transcribing
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Transcription Banner - Subtitle style overlay */}
      {isTranscriptionEnabled && (
        <div className="absolute bottom-28 left-0 right-0 z-20 px-4">
          <TranscriptionPanel 
            visitId={visitId} 
            isEnabled={isTranscriptionEnabled} 
          />
        </div>
      )}
    </div>
  );
}