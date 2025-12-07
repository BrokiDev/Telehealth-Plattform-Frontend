'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { VideoCall } from '@/components/video/VideoCall';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useVideoToken } from '@/hooks/useVideoToken';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { Video, Phone } from 'lucide-react';

function VideoPageContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const visitId = searchParams.get('visitId');
  const { getTokenForVisit, isLoading } = useVideoToken();

  const [videoToken, setVideoToken] = useState<string | null>(null);
  const [roomName, setRoomName] = useState<string | null>(null);
  const [identity, setIdentity] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [manualVisitId, setManualVisitId] = useState('');
  const [inCall, setInCall] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    if (visitId && !isJoining && !inCall) {
      handleJoinCall(visitId);
    }
  }, [visitId]);

  const handleJoinCall = async (id: string) => {
    // Prevent multiple simultaneous join attempts
    if (isJoining) {
      return;
    }
    
    setIsJoining(true);
    
    try {
      const tokenData = await getTokenForVisit(id);
      
      if (tokenData && tokenData.token && tokenData.room_name && tokenData.identity) {
        setVideoToken(tokenData.token);
        setRoomName(tokenData.room_name);
        setIdentity(tokenData.identity);
        setDisplayName(tokenData.participantInfo?.name || null);
        setInCall(true);
        toast.success('Joining video call...');
      } else {
        toast.error('Failed to get video call information');
      }
    } catch (error) {
      toast.error('Failed to join video call');
    } finally {
      setIsJoining(false);
    }
  };

  const handleManualJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualVisitId.trim()) {
      handleJoinCall(manualVisitId.trim());
    }
  };

  const handleDisconnect = () => {
    setInCall(false);
    setVideoToken(null);
    setRoomName(null);
    setDisplayName(null);
    router.push('/visits');
    toast.info('Video call ended');
  };


  if (inCall && videoToken && roomName && identity) {
    return (
      <div className="h-screen">
        <VideoCall
          visitId={visitId || manualVisitId}
          token={videoToken}
          roomName={roomName}
          identity={identity}
          displayName={displayName || undefined}
          onDisconnect={handleDisconnect}
        />
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center">
          <div className="bg-blue-600 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <Video className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Video Consultation</h1>
          <p className="text-gray-600">
            Join a secure video call with your patient or healthcare provider
          </p>
        </div>

        {visitId ? (
          <Card>
            <CardHeader>
              <CardTitle>Join Video Call</CardTitle>
              <CardDescription>
                Visit ID: {visitId}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-4">
                <p className="text-gray-600">
                  Click the button below to join your scheduled video consultation.
                </p>
                <Button
                  onClick={() => handleJoinCall(visitId)}
                  disabled={isLoading}
                  size="lg"
                  className="w-full"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Phone className="mr-2 h-4 w-4" />
                      Join Video Call
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Enter Visit ID</CardTitle>
              <CardDescription>
                Enter the visit ID provided by your healthcare provider
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleManualJoin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="visitId">Visit ID</Label>
                  <Input
                    id="visitId"
                    type="text"
                    placeholder="Enter visit ID (e.g., 123e4567-e89b-12d3-a456-426614174000)"
                    value={manualVisitId}
                    onChange={(e) => setManualVisitId(e.target.value)}
                    required
                  />
                </div>
                <Button
                  type="submit"
                  disabled={isLoading || !manualVisitId.trim()}
                  size="lg"
                  className="w-full"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Phone className="mr-2 h-4 w-4" />
                      Join Video Call
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Before You Join</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-start space-x-2">
                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2"></div>
                <p>Make sure your camera and microphone are working properly</p>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2"></div>
                <p>Find a quiet, well-lit space for your consultation</p>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2"></div>
                <p>Ensure you have a stable internet connection</p>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2"></div>
                <p>Have your medical information and questions ready</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

export default function VideoPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    }>
      <VideoPageContent />
    </Suspense>
  );
}