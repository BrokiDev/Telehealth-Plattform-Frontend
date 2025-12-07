'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/AuthContext';
import { apiService } from '@/services/api';
import { CreateGuestVisitRequest, GuestVisit } from '@/types/medical';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  Save, 
  Calendar, 
  Clock, 
  FileText, 
  Mail,
  Link as LinkIcon,
  Copy,
  Check,
  Send,
  UserPlus
} from 'lucide-react';
import Link from 'next/link';
import { 
  datetimeLocalToISO, 
  getTodayDateString,
  getCurrentTimeString,
  calculateEndTime,
  formatTime,
  formatDateTime
} from '@/utils/timezone';

export default function NewGuestVisitPage() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [createdVisit, setCreatedVisit] = useState<GuestVisit | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  
  const [formData, setFormData] = useState<CreateGuestVisitRequest>({
    visit_type: 'consultation',
    scheduled_start: '',
    scheduled_end: '',
    chief_complaint: '',
    visit_notes: '',
    guest_email: '',
    send_email: false,
  });

  // Check permissions
  if (user?.role_name === 'patient') {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <UserPlus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Access Restricted
          </h3>
          <p className="text-gray-600">
            Only providers can create guest visit links.
          </p>
          <Button asChild className="mt-4">
            <Link href="/visits">Back to Visits</Link>
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  // Set default time when component loads
  useEffect(() => {
    // Set default time
    const today = getTodayDateString();
    const currentTime = getCurrentTimeString();
    const defaultStart = `${today}T${currentTime}`;
    
    setFormData((prev) => ({
      ...prev,
      scheduled_start: defaultStart,
      scheduled_end: calculateEndTime(defaultStart, 30)
    }));
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const scheduledStartISO = datetimeLocalToISO(formData.scheduled_start);
      const scheduledEndISO = datetimeLocalToISO(formData.scheduled_end);

      const submitData: CreateGuestVisitRequest = {
        ...formData,
        scheduled_start: scheduledStartISO,
        scheduled_end: scheduledEndISO,
      };


      const visit = await apiService.createGuestVisit(submitData);
      
      setCreatedVisit(visit);
      
      if (formData.send_email && formData.guest_email) {
        toast.success('Guest visit created and invitation email sent!');
      } else {
        toast.success('Guest visit created! Share the link with your guest.');
      }
      
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message;
      toast.error('Failed to create guest visit: ' + errorMessage);
      console.error('❌ Error creating guest visit:', error.response?.data || error);
    } finally {
      setLoading(false);
    }
  };

  const copyLinkToClipboard = () => {
    if (createdVisit?.shareable_link) {
      navigator.clipboard.writeText(createdVisit.shareable_link);
      setLinkCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setLinkCopied(false), 3000);
    }
  };

  const handleCreateAnother = () => {
    setCreatedVisit(null);
    setLinkCopied(false);
    
    // Reset form with default times
    const today = getTodayDateString();
    const currentTime = getCurrentTimeString();
    const defaultStart = `${today}T${currentTime}`;
    
    setFormData({
      visit_type: 'consultation',
      scheduled_start: defaultStart,
      scheduled_end: calculateEndTime(defaultStart, 30),
      chief_complaint: '',
      visit_notes: '',
      guest_email: '',
      send_email: false,
    });
  };

  // If visit created, show success screen
  if (createdVisit) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Success Header */}
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Guest Visit Created Successfully!
            </h1>
            <p className="text-gray-600">
              Share the link below with your guest to join the video consultation
            </p>
          </div>

          {/* Visit Details Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="mr-2 h-5 w-5" />
                Visit Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-gray-600">Visit Type</Label>
                  <p className="font-medium capitalize">{createdVisit.visit_type.replace('_', ' ')}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Status</Label>
                  <p className="font-medium capitalize">{createdVisit.visit_status}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Scheduled Start</Label>
                  <p className="font-medium">
                    {formatDateTime(createdVisit.scheduled_start)}
                  </p>
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Scheduled End</Label>
                  <p className="font-medium">
                    {formatTime(createdVisit.scheduled_end)}
                  </p>
                </div>
              </div>
              
              {createdVisit.chief_complaint && (
                <div>
                  <Label className="text-sm text-gray-600">Chief Complaint</Label>
                  <p className="font-medium">{createdVisit.chief_complaint}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Shareable Link Card */}
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center text-blue-900">
                <LinkIcon className="mr-2 h-5 w-5" />
                Shareable Guest Link
              </CardTitle>
              <CardDescription className="text-blue-700">
                Send this link to your guest. It's valid until the visit expires.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Link Display */}
              <div className="flex items-center space-x-2">
                <Input
                  value={createdVisit.shareable_link || ''}
                  readOnly
                  className="bg-white font-mono text-sm"
                />
                <Button
                  onClick={copyLinkToClipboard}
                  variant={linkCopied ? "default" : "outline"}
                  className="shrink-0"
                >
                  {linkCopied ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </>
                  )}
                </Button>
              </div>

              {/* Email Sent Confirmation */}
              {createdVisit.guest_email && formData.send_email && (
                <div className="flex items-center space-x-2 text-green-700 bg-green-50 p-3 rounded-lg">
                  <Send className="h-4 w-4" />
                  <span className="text-sm">
                    Invitation email sent to <strong>{createdVisit.guest_email}</strong>
                  </span>
                </div>
              )}

              {/* Instructions */}
              <div className="bg-white p-4 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-gray-900 mb-2">How to share:</h4>
                <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
                  <li>Copy the link above</li>
                  <li>Send it to your guest via email, WhatsApp, SMS, etc.</li>
                  <li>Guest clicks the link and enters their name</li>
                  <li>Both join the video consultation at the scheduled time</li>
                </ol>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-between">
            <Button variant="outline" asChild>
              <Link href="/visits">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Visits
              </Link>
            </Button>
            <Button onClick={handleCreateAnother}>
              <UserPlus className="mr-2 h-4 w-4" />
              Create Another Guest Visit
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Creation form
  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/visits">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Visits
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Create Guest Visit</h1>
            <p className="text-gray-600 mt-2">
              Generate a shareable link for a guest to join a video consultation
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Visit Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="mr-2 h-5 w-5" />
                Visit Details
              </CardTitle>
              <CardDescription>
                Configure the consultation details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="visit_type">Visit Type *</Label>
                <select
                  id="visit_type"
                  name="visit_type"
                  value={formData.visit_type}
                  onChange={handleInputChange}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  required
                >
                  <option value="consultation">Consultation</option>
                  <option value="follow_up">Follow-up</option>
                  <option value="urgent">Urgent Care</option>
                  <option value="therapy">Therapy Session</option>
                  <option value="diagnosis">Diagnosis</option>
                </select>
              </div>

              <div>
                <Label htmlFor="chief_complaint">Chief Complaint</Label>
                <Input
                  id="chief_complaint"
                  name="chief_complaint"
                  value={formData.chief_complaint}
                  onChange={handleInputChange}
                  placeholder="Brief description of the consultation topic"
                />
              </div>
            </CardContent>
          </Card>

          {/* Schedule */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="mr-2 h-5 w-5" />
                Schedule
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="scheduled_start">Start Date & Time *</Label>
                  <Input
                    id="scheduled_start"
                    name="scheduled_start"
                    type="datetime-local"
                    value={formData.scheduled_start}
                    onChange={(e) => {
                      const startTime = e.target.value;
                      setFormData((prev) => ({
                        ...prev,
                        scheduled_start: startTime,
                        scheduled_end: calculateEndTime(startTime, 30)
                      }));
                    }}
                    min={`${getTodayDateString()}T${getCurrentTimeString()}`}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="scheduled_end">End Date & Time *</Label>
                  <Input
                    id="scheduled_end"
                    name="scheduled_end"
                    type="datetime-local"
                    value={formData.scheduled_end}
                    onChange={handleInputChange}
                    min={formData.scheduled_start}
                    required
                  />
                </div>
              </div>

              {/* Quick Duration */}
              <div className="space-y-2">
                <Label>Quick Duration</Label>
                <div className="flex flex-wrap gap-2">
                  {[15, 30, 45, 60, 90].map((minutes) => (
                    <Button
                      key={minutes}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (formData.scheduled_start) {
                          setFormData((prev) => ({
                            ...prev,
                            scheduled_end: calculateEndTime(formData.scheduled_start, minutes)
                          }));
                        }
                      }}
                      disabled={!formData.scheduled_start}
                    >
                      {minutes} min
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Guest Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Mail className="mr-2 h-5 w-5" />
                Guest Information (Optional)
              </CardTitle>
              <CardDescription>
                Send an email invitation or share the link manually
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="guest_email">Guest Email</Label>
                <Input
                  id="guest_email"
                  name="guest_email"
                  type="email"
                  value={formData.guest_email}
                  onChange={handleInputChange}
                  placeholder="guest@example.com"
                />
                <p className="text-sm text-gray-500 mt-1">
                  If provided, we can send an email with the join link
                </p>
              </div>

              {formData.guest_email && (
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="send_email"
                    name="send_email"
                    checked={formData.send_email}
                    onChange={handleInputChange}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="send_email" className="cursor-pointer">
                    Send email invitation to guest
                  </Label>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="mr-2 h-5 w-5" />
                Additional Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Label htmlFor="visit_notes">Preparation Notes</Label>
              <textarea
                id="visit_notes"
                name="visit_notes"
                value={formData.visit_notes}
                onChange={handleInputChange}
                placeholder="Any special instructions..."
                rows={4}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none"
              />
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline" asChild>
              <Link href="/visits">Cancel</Link>
            </Button>
            <Button 
              type="submit" 
              disabled={
                loading || 
                !formData.scheduled_start || 
                !formData.scheduled_end ||
                !user?.organization_id || 
                !user?.provider_id
              }
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Create Guest Visit
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
