// Visit and Video Conference types
export interface Visit {
  visit_id: string;
  organization_id: string;
  provider_id: string;
  patient_id: string;
  scheduled_start: string;
  scheduled_end: string;
  actual_start?: string;
  actual_end?: string;
  status: VisitStatus;
  visit_type: string;
  chief_complaint?: string;
  session_id?: string;
  room_name?: string;
  recording_enabled?: boolean;
  visit_notes?: string;
  cancellation_reason?: string;
  cancelled_at?: string;
  created_at?: string;
  updated_at?: string;
}

export type VisitStatus = 
  | 'scheduled' 
  | 'in_progress' 
  | 'completed' 
  | 'cancelled' 
  | 'no_show';

export interface CreateVisitRequest {
  patient_id: string;
  provider_id: string;
  scheduled_start: string;
  scheduled_end: string;
  visit_type: string;
  chief_complaint?: string;
  recording_enabled?: boolean;
}

export interface VideoToken {
  token: string;
  room_name: string;
  room_sid?: string; // Will be set once room is created by Twilio
  identity: string;
  scheduledStart: string;
  scheduledEnd: string;
  visitId: string;
  tokenExpiresAt: string;
  tokenExpiresInSeconds: number;
  participantInfo: {
    userType: string;
    userId: string;
    name: string;
  };
}

export interface VideoCallProps {
  visitId: string;
  token: string;
  roomName: string;
  identity: string;
  onDisconnect: () => void;
}

// Twilio Video SDK types
export interface TwilioParticipant {
  sid: string;
  identity: string;
  state: 'connected' | 'disconnected' | 'reconnecting';
  tracks: Map<string, any>;
  audioTracks: Map<string, any>;
  videoTracks: Map<string, any>;
}

export interface TwilioRoom {
  sid: string;
  name: string;
  state: 'connected' | 'disconnected' | 'reconnecting';
  participants: Map<string, TwilioParticipant>;
  localParticipant: TwilioParticipant;
}

export interface VideoControls {
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  isScreenShared: boolean;
  toggleVideo: () => void;
  toggleAudio: () => void;
  toggleScreenShare: () => void;
  disconnect: () => void;
}