'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { connect, Room, RemoteParticipant, LocalParticipant } from 'twilio-video';
import { VideoControls, TwilioRoom } from '@/types/video';
import { toast } from 'sonner';

interface UseVideoCallProps {
  token: string;
  roomName: string;
  visitId?: string;
  onDisconnect?: () => void;
  onRoomConnected?: (roomSid: string) => void;
}

export function useVideoCall({ token, roomName, visitId, onDisconnect, onRoomConnected }: UseVideoCallProps) {
  const [room, setRoom] = useState<Room | null>(null);
  const [participants, setParticipants] = useState<RemoteParticipant[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localVideoTrack, setLocalVideoTrack] = useState<any>(null);
  const [localAudioTrack, setLocalAudioTrack] = useState<any>(null);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isScreenShared, setIsScreenShared] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const screenShareTrackRef = useRef<any>(null);
  const isConnectingRef = useRef(false); // Prevent multiple simultaneous connections
  const connectionAttemptIdRef = useRef<string | null>(null); // Track connection attempts
  const lastConnectionAttemptRef = useRef<number>(0); // Timestamp of last connection attempt
  const isCleaningUpRef = useRef(false); // Prevent multiple cleanup executions
  const componentMountedRef = useRef(true); // Track component mount state
  const connectionInstanceRef = useRef<string | null>(null); // Unique instance identifier
  const onRoomConnectedRef = useRef(onRoomConnected); // Stable ref for callback
  const isDisconnectingRef = useRef(false); // Track if user initiated disconnect

  // Update callback ref when it changes
  useEffect(() => {
    onRoomConnectedRef.current = onRoomConnected;
  }, [onRoomConnected]);

  // Connect to room
  const connectToRoom = useCallback(async () => {
    const instanceId = Math.random().toString(36).substring(7);
    
    // If there's already an active connection instance, reject this one
    if (connectionInstanceRef.current && connectionInstanceRef.current !== instanceId) {
      return;
    }
    
    connectionInstanceRef.current = instanceId;
    
    if (!token || !roomName) {
      return;
    }

    if (isConnectingRef.current) {
      return;
    }

    if (room) {
      return;
    }

    // Prevent rapid successive connection attempts
    const now = Date.now();
    if (now - lastConnectionAttemptRef.current < 1000) {
      return;
    }
    lastConnectionAttemptRef.current = now;

    isConnectingRef.current = true;
    setIsConnecting(true);
    setError(null);

    try {
      
      const connectedRoom = await connect(token, {
        name: roomName,
        audio: true,
        video: { width: 640, height: 480 },
        dominantSpeaker: true,
        networkQuality: true,
      });
      

      // Call onRoomConnected callback with room SID
      if (onRoomConnectedRef.current) {
        onRoomConnectedRef.current(connectedRoom.sid);
      }

      setRoom(connectedRoom);
      setIsConnected(true);
      
      // Get initial participants
      const initialParticipants = Array.from(connectedRoom.participants.values());
      setParticipants(initialParticipants);

      
      // Attach local video track
      const localVideoTracks = Array.from(connectedRoom.localParticipant.videoTracks.values());
      
      if (localVideoTracks.length > 0) {
        const videoPublication = localVideoTracks[0];
        const videoTrack = videoPublication.track;

        
        if (videoTrack) {
          setLocalVideoTrack(videoTrack);
          setIsVideoEnabled(videoTrack.isEnabled);
          
          // Attach to video element if ref exists
          if (localVideoRef.current && videoTrack) {
            videoTrack.attach(localVideoRef.current);
          }
        }
      } else {
        console.warn('⚠️ No local video tracks found');
      }

      // Attach local audio track
      const localAudioTracks = Array.from(connectedRoom.localParticipant.audioTracks.values());
      
      if (localAudioTracks.length > 0) {
        const audioPublication = localAudioTracks[0];
        const audioTrack = audioPublication.track;

        
        if (audioTrack) {
          setLocalAudioTrack(audioTrack);
          setIsAudioEnabled(audioTrack.isEnabled);
        }
      } else {
      }

      // Room event listeners
      connectedRoom.on('participantConnected', (participant: RemoteParticipant) => {

        
        // Add participant immediately
        setParticipants(prev => {
          const newParticipants = [...prev, participant];
          return newParticipants;
        });
        
        // Log existing tracks
        participant.tracks.forEach((publication, trackSid) => {

        });
        
        toast.success(`${participant.identity} joined the call`);
      });

      connectedRoom.on('participantDisconnected', (participant: RemoteParticipant) => {

        setParticipants(prev => {
          const newParticipants = prev.filter(p => p !== participant);
          return newParticipants;
        });
        toast.info(`${participant.identity} left the call`);
      });

      // Listen for local track publications
      connectedRoom.localParticipant.on('trackPublished', (publication) => {

      });

      connectedRoom.localParticipant.on('trackPublicationFailed', (error, track) => {

      });

      connectedRoom.on('disconnected', (room, error) => {

        
        // Prevent multiple cleanup executions
        if (isCleaningUpRef.current) {
          return;
        }
        
        isCleaningUpRef.current = true;
        setRoom(null);
        setIsConnected(false);
        setParticipants([]);
        isConnectingRef.current = false;
        connectionInstanceRef.current = null; // Reset instance
        
        // Reset cleanup flag after a brief delay
        setTimeout(() => {
          isCleaningUpRef.current = false;
        }, 100);
        
        onDisconnect?.();
      });

      toast.success('Connected to video call');
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to connect to video call';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      isConnectingRef.current = false;
      setIsConnecting(false);
    }
  }, [token, roomName, onDisconnect]);

  // Disconnect from room
  const disconnect = useCallback(() => {
    
    if (!room) {
      return;
    }
    
    
    // Set disconnecting flag to prevent auto-reconnect
    isDisconnectingRef.current = true;
    
    try {
      // Stop and unpublish ALL local tracks
      const localParticipant = room.localParticipant;
      
      localParticipant.tracks.forEach((publication) => {
        
        if (publication.track) {
          // Stop the track (only for audio/video tracks, not data tracks)
          if (publication.track.kind === 'audio' || publication.track.kind === 'video') {
            publication.track.stop();
            
            // Detach from any DOM elements
            publication.track.detach().forEach((element: HTMLMediaElement) => {
              element.srcObject = null;
            });
          }
        }
        
        // Unpublish from room
        if (publication.track) {
          localParticipant.unpublishTrack(publication.track);
        }
      });
      
      // Disconnect from the room
      room.disconnect();
      
    } catch (error) {
    }
    
    // Clear all state
    setRoom(null);
    setIsConnected(false);
    setParticipants([]);
    setLocalVideoTrack(null);
    setLocalAudioTrack(null);
    isConnectingRef.current = false;
    connectionInstanceRef.current = null;
    
    if (screenShareTrackRef.current) {
      screenShareTrackRef.current.stop();
      screenShareTrackRef.current = null;
    }
    
  }, [room]);

  // Toggle video
  const toggleVideo = useCallback(async () => {
    if (!room) {
      return;
    }

    const localParticipant = room.localParticipant;
    


    try {
      if (isVideoEnabled) {
        // Disable video
        localParticipant.videoTracks.forEach(publication => {
          if (publication.track) {
            publication.track.disable();
          }
        });
        setIsVideoEnabled(false);
        toast.info('Camera turned off');
      } else {
        // Enable video
        localParticipant.videoTracks.forEach(publication => {
          if (publication.track) {
            publication.track.enable();
          }
        });
        setIsVideoEnabled(true);
        toast.success('Camera turned on');
      }
    } catch (error) {
      toast.error('Failed to toggle camera');
    }
  }, [room, isVideoEnabled]);

  // Toggle audio
  const toggleAudio = useCallback(async () => {
    if (!room) {
      return;
    }

    const localParticipant = room.localParticipant;
    

    
    if (isAudioEnabled) {
      // Mute audio
      localParticipant.audioTracks.forEach(publication => {
        publication.track.disable();
      });
      setIsAudioEnabled(false);
      toast.info('Microphone muted');
    } else {
      // Unmute audio
      localParticipant.audioTracks.forEach(publication => {
        publication.track.enable();
      });
      setIsAudioEnabled(true);
      toast.success('Microphone unmuted');
    }
  }, [room, isAudioEnabled]);

  // Toggle screen share
  const toggleScreenShare = useCallback(async () => {
    if (!room) return;

    try {
      if (isScreenShared) {
        // Stop screen share
        if (screenShareTrackRef.current) {
          room.localParticipant.unpublishTrack(screenShareTrackRef.current);
          screenShareTrackRef.current.stop();
          screenShareTrackRef.current = null;
        }
        setIsScreenShared(false);
        toast.info('Screen sharing stopped');
      } else {
        // Start screen share
        const screenTrack = await (navigator.mediaDevices as any).getDisplayMedia({
          video: true,
        });
        
        const videoTrack = screenTrack.getVideoTracks()[0];
        screenShareTrackRef.current = videoTrack;
        
        await room.localParticipant.publishTrack(videoTrack, { name: 'screen-share' });
        setIsScreenShared(true);
        toast.success('Screen sharing started');

        // Listen for screen share end
        videoTrack.addEventListener('ended', () => {
          setIsScreenShared(false);
          screenShareTrackRef.current = null;
        });
      }
    } catch (err: any) {
      toast.error('Screen sharing failed: ' + err.message);
    }
  }, [room, isScreenShared]);

  // Attach local video track to DOM element
  useEffect(() => {


    if (localVideoTrack && localVideoRef.current) {
      const element = localVideoRef.current;
      const attachedElements = localVideoTrack.attach(element);
    
      
      // Ensure video is playing
      element.play().catch(err => {
        console.warn('⚠️ Video autoplay warning (normal):', err.message);
      });

      return () => {
        localVideoTrack.detach(element);
      };
    } else {
    }
  }, [localVideoTrack]);

  // Auto-connect when token and room name are available
  useEffect(() => {
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    // Don't auto-connect if user initiated disconnect
    if (isDisconnectingRef.current) {
      return;
    }
    
    if (token && roomName && !room && !isConnecting) {
      connectToRoom();
    }

    // Cleanup on dependency change (when token/roomName changes)
    return () => {
      if (room && (token !== room.name) && !isDisconnectingRef.current) {
        room.disconnect();
        isConnectingRef.current = false;
        connectionInstanceRef.current = null;
      }
    };
  }, [token, roomName, room, isConnecting]); // Removed connectToRoom from dependencies

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (room && !isDisconnectingRef.current) {
        room.disconnect();
      }
      if (screenShareTrackRef.current) {
        screenShareTrackRef.current.stop();
      }
      isConnectingRef.current = false;
      connectionInstanceRef.current = null;
    };
  }, [room]);

  const videoControls: VideoControls = {
    isVideoEnabled,
    isAudioEnabled,
    isScreenShared,
    toggleVideo,
    toggleAudio,
    toggleScreenShare,
    disconnect,
  };

  return {
    room,
    participants,
    isConnecting,
    isConnected,
    error,
    localVideoRef,
    videoControls,
    connectToRoom,
    disconnect,
  };
}