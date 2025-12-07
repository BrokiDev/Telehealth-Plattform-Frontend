'use client';

import { use, useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { VideoCall } from '@/components/video/VideoCall';
import { NoStrictMode } from '@/components/video/NoStrictMode';
import { apiService } from '@/services/api';
import { GuestVisit } from '@/types/medical';
import { VideoToken } from '@/types/video';
import { toast } from 'sonner';
import { 
  Loader2,
  AlertCircle,
  Video,
  UserX,
  Clock
} from 'lucide-react';

interface PageProps {
  params: Promise<{ token: string }>;
}

export default function GuestVideoPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const token = resolvedParams.token;
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [visit, setVisit] = useState<GuestVisit | null>(null);
  const [videoToken, setVideoToken] = useState<VideoToken | null>(null);
  const [error, setError] = useState<string>('');
  const [isVideoStarted, setIsVideoStarted] = useState(false);
  const isDisconnectingRef = useRef(false);

  useEffect(() => {
    loadVisitAndToken();
  }, [token]);

  const loadVisitAndToken = async () => {
    try {
      setLoading(true);
      
      // Validate the visit first
      const validationResult = await apiService.validateGuestVisit(token);
      
      if (!validationResult.isValid || validationResult.isExpired) {
        setError(validationResult.isExpired ? 'This visit link has expired' : 'Invalid visit link');
        return;
      }

      if (!validationResult.visit) {
        setError('Visit not found');
        return;
      }

      const visitData = validationResult.visit;
      setVisit(visitData);

      // Check if guest is registered
      if (!visitData.is_guest_registered) {
        toast.error('Please register first');
        router.push(`/guest/${token}`);
        return;
      }

      // Check if visit is scheduled for today or in the future
      const scheduledStart = new Date(visitData.scheduled_start);
      const now = new Date();
      const timeUntilStart = scheduledStart.getTime() - now.getTime();
      const hoursUntilStart = timeUntilStart / (1000 * 60 * 60);

      // Allow joining 30 minutes before scheduled start
      if (hoursUntilStart > 0.5) {
        setError(`This consultation is scheduled for ${scheduledStart.toLocaleString()}. Please come back closer to the appointment time.`);
        return;
      }

      // Get video token
      const tokenData = await apiService.getGuestVideoToken(token);
      setVideoToken(tokenData);
      
    } catch (err: any) {
      console.error('Error loading visit:', err);
      setError(err.response?.data?.error || 'Failed to load visit information');
      toast.error('Failed to load visit');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = () => {
    if (isDisconnectingRef.current) {
      return;
    }
    
    isDisconnectingRef.current = true;
    
    // Use toast ID to prevent duplicates
    toast.success('You have left the consultation', {
      id: 'guest-disconnect',
      duration: 3000
    });
    
    router.push(`/guest/${token}/feedback`);
  };

  const handleStartVideo = () => {
    setIsVideoStarted(true);
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-gray-800 border-gray-700">
          <CardContent className="p-8 text-center">
            <Loader2 className="h-12 w-12 text-blue-400 animate-spin mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">
              Preparing Video Room
            </h3>
            <p className="text-gray-400">Please wait...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error || !visit || !videoToken) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-gray-800 border-red-600">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-2">
              Cannot Join Video
            </h3>
            <p className="text-gray-300 mb-6">
              {error || 'Unable to access the video consultation'}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button 
                onClick={() => router.push(`/guest/${token}`)}
                variant="outline"
                className="bg-gray-700 hover:bg-gray-600 text-white border-gray-600"
              >
                Back to Visit Details
              </Button>
              <Button 
                onClick={loadVisitAndToken}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Waiting room (before starting video)
  if (!isVideoStarted) {
    return (
      <div className="min-h-screen bg-linear-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl bg-gray-800 border-blue-500">
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-600 rounded-full mb-4">
                <Video className="h-10 w-10 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Ready to Join?
              </h1>
              <p className="text-gray-300 text-lg">
                Welcome, <strong>{visit.guest_name}</strong>
              </p>
            </div>

            {/* Visit Info */}
            <div className="bg-gray-700 rounded-lg p-6 mb-6 space-y-3">
              <div className="flex items-center text-gray-300">
                <Clock className="h-5 w-5 mr-3 text-blue-400" />
                <div>
                  <p className="text-sm text-gray-400">Scheduled Time</p>
                  <p className="font-medium text-white">
                    {new Date(visit.scheduled_start).toLocaleString()}
                  </p>
                </div>
              </div>
              
              {visit.chief_complaint && (
                <div className="pt-3 border-t border-gray-600">
                  <p className="text-sm text-gray-400 mb-1">Topic</p>
                  <p className="text-white">{visit.chief_complaint}</p>
                </div>
              )}
            </div>

            {/* Instructions */}
            <div className="bg-yellow-900/30 border border-yellow-600 rounded-lg p-4 mb-6">
              <h4 className="font-semibold text-yellow-400 mb-2">
                Before you join:
              </h4>
              <ul className="space-y-1 text-sm text-yellow-100">
                <li>• Make sure you&apos;re in a quiet place</li>
                <li>• Check your camera and microphone work</li>
                <li>• Your provider will join shortly</li>
                <li>• The call will be recorded for quality purposes</li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={() => router.push(`/guest/${token}`)}
                variant="outline"
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white border-gray-600"
              >
                <UserX className="mr-2 h-4 w-4" />
                Not Ready
              </Button>
              <Button
                onClick={handleStartVideo}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-lg py-6"
              >
                <Video className="mr-2 h-5 w-5" />
                Join Video Consultation
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Video call
  return (
    <div className="h-screen w-screen bg-gray-900">
      <NoStrictMode>
        <VideoCall
          visitId={visit.visit_id}
          token={videoToken.token}
          roomName={videoToken.room_name}
          identity={videoToken.identity}
          displayName={visit.guest_name || 'Guest'}
          isGuest={true}
          onDisconnect={handleDisconnect}
        />
      </NoStrictMode>
    </div>
  );
}
