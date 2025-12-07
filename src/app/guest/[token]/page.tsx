'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiService } from '@/services/api';
import { GuestVisit, RegisterGuestRequest } from '@/types/medical';
import { toast } from 'sonner';
import { 
  Calendar,
  Clock,
  UserPlus,
  Video,
  AlertCircle,
  CheckCircle,
  Loader2,
  Mail
} from 'lucide-react';
import { formatDateTime, formatTime } from '@/utils/timezone';

interface PageProps {
  params: Promise<{ token: string }>;
}

export default function GuestVisitPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const token = resolvedParams.token;
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [visit, setVisit] = useState<GuestVisit | null>(null);
  const [isValid, setIsValid] = useState(false);
  const [isExpired, setIsExpired] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  const [guestData, setGuestData] = useState<RegisterGuestRequest>({
    guest_name: '',
    guest_email: '',
  });

  useEffect(() => {
    validateVisit();
  }, [token]);

  const validateVisit = async () => {
    try {
      setLoading(true);
      const result = await apiService.validateGuestVisit(token);
      
      setIsValid(result.isValid);
      setIsExpired(result.isExpired);
      
      if (result.visit) {
        setVisit(result.visit);
        
        // If already registered, redirect to video
        if (result.visit.is_guest_registered) {
          toast.success('Welcome back! Redirecting to video room...');
          setTimeout(() => {
            router.push(`/guest/${token}/video`);
          }, 1500);
        }
      } else {
        setErrorMessage(result.message || 'Invalid visit link');
      }
    } catch (error: any) {
      console.error('Error validating visit:', error);
      setErrorMessage(error.response?.data?.error || 'Failed to validate visit link');
      setIsValid(false);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!visit) return;
    
    setRegistering(true);
    try {
      await apiService.registerGuest(visit.visit_id, guestData);
      toast.success('Registration successful! Redirecting to video room...');
      
      setTimeout(() => {
        router.push(`/guest/${token}/video`);
      }, 1500);
    } catch (error: any) {
      console.error('Error registering guest:', error);
      toast.error(error.response?.data?.error || 'Failed to register');
    } finally {
      setRegistering(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <Loader2 className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Validating Visit Link
            </h3>
            <p className="text-gray-600">Please wait...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Invalid or expired link
  if (!isValid || isExpired || !visit) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-red-200">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-16 w-16 text-red-600 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              {isExpired ? 'Link Expired' : 'Invalid Link'}
            </h3>
            <p className="text-gray-600 mb-6">
              {isExpired 
                ? 'This visit link has expired. Please contact your provider for a new link.'
                : errorMessage || 'This visit link is invalid or has been revoked.'
              }
            </p>
            <Button 
              onClick={() => window.location.href = 'https://dailytelehealth.com'}
              variant="outline"
            >
              Go to Homepage
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Valid link - show registration form
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        {/* Success Badge */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            You&apos;re Invited!
          </h1>
          <p className="text-gray-600 text-lg">
            Join a video consultation
          </p>
        </div>

        {/* Visit Details Card */}
        <Card className="border-blue-200">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardTitle className="flex items-center text-blue-900">
              <Calendar className="mr-2 h-6 w-6" />
              Visit Details
            </CardTitle>
            <CardDescription className="text-blue-700">
              Here&apos;s what you need to know about this consultation
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center text-blue-700 mb-2">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span className="text-sm font-medium">Date & Time</span>
                </div>
                <p className="font-semibold text-gray-900">
                  {formatDateTime(visit.scheduled_start)}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  Duration: {Math.round(
                    (new Date(visit.scheduled_end).getTime() - 
                     new Date(visit.scheduled_start).getTime()) / 60000
                  )} minutes
                </p>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="flex items-center text-purple-700 mb-2">
                  <Video className="h-4 w-4 mr-2" />
                  <span className="text-sm font-medium">Visit Type</span>
                </div>
                <p className="font-semibold text-gray-900 capitalize">
                  {visit.visit_type?.replace('_', ' ') || 'Consultation'}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  Status: <span className="capitalize">{visit.visit_status || 'scheduled'}</span>
                </p>
              </div>
            </div>

            {visit.chief_complaint && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <Label className="text-sm text-gray-600">Topic</Label>
                <p className="font-medium text-gray-900 mt-1">
                  {visit.chief_complaint}
                </p>
              </div>
            )}

            {visit.visit_notes && (
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <Label className="text-sm text-yellow-800 font-medium">
                  Important Notes
                </Label>
                <p className="text-gray-900 mt-1">
                  {visit.visit_notes}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Registration Form Card */}
        <Card className="border-green-200">
          <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
            <CardTitle className="flex items-center text-green-900">
              <UserPlus className="mr-2 h-6 w-6" />
              Join the Consultation
            </CardTitle>
            <CardDescription className="text-green-700">
              Enter your information to continue
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <Label htmlFor="guest_name" className="text-base">
                  Your Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="guest_name"
                  value={guestData.guest_name}
                  onChange={(e) => setGuestData(prev => ({ ...prev, guest_name: e.target.value }))}
                  placeholder="e.g., Juan Pérez"
                  required
                  className="mt-1 text-lg p-6"
                />
                <p className="text-sm text-gray-500 mt-1">
                  This name will be visible to your provider during the call
                </p>
              </div>

              <div>
                <Label htmlFor="guest_email" className="text-base flex items-center">
                  <Mail className="h-4 w-4 mr-1" />
                  Your Email (Optional)
                </Label>
                <Input
                  id="guest_email"
                  type="email"
                  value={guestData.guest_email}
                  onChange={(e) => setGuestData(prev => ({ ...prev, guest_email: e.target.value }))}
                  placeholder="juan.perez@example.com"
                  className="mt-1 text-lg p-6"
                />
                <p className="text-sm text-gray-500 mt-1">
                  We&apos;ll use this to send you visit reminders and follow-ups
                </p>
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2 flex items-center">
                  <Clock className="h-4 w-4 mr-2" />
                  What happens next?
                </h4>
                <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
                  <li>Click &quot;Join Video Consultation&quot; below</li>
                  <li>Allow camera and microphone access</li>
                  <li>Wait for your provider to join the call</li>
                  <li>Start your consultation!</li>
                </ol>
              </div>

              <Button 
                type="submit" 
                disabled={registering || !guestData.guest_name}
                className="w-full text-lg py-6"
                size="lg"
              >
                {registering ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Joining...
                  </>
                ) : (
                  <>
                    <Video className="mr-2 h-5 w-5" />
                    Join Video Consultation
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-sm text-gray-600">
          By joining, you agree to share your audio and video with the provider.
          <br />
          Your information is protected and HIPAA compliant.
        </p>
      </div>
    </div>
  );
}
