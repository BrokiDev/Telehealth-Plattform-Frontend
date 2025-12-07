'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/context/AuthContext';
import { apiService } from '@/services/api';
import { Visit } from '@/types/medical';
import { toast } from 'sonner';
import { 
  Calendar, 
  Video, 
  Phone, 
  Clock, 
  User, 
  FileText, 
  ArrowLeft,
  MapPin,
  Mail,
  Building,
  CheckCircle2,
  XCircle,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';

export default function VisitDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const visitId = params?.visitId as string;
  
  const [visit, setVisit] = useState<Visit | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVisitDetails = async () => {
      if (!visitId) return;
      
      try {
        const visitData = await apiService.getVisitById(visitId);
        setVisit(visitData);
      } catch (error: any) {
        toast.error('Failed to load visit details');
        console.error('Error fetching visit details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchVisitDetails();
  }, [visitId]);

  const formatDateTime = (dateTimeString?: string) => {
    if (!dateTimeString) return 'N/A';
    const date = new Date(dateTimeString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'no_show':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Clock className="h-4 w-4" />;
      case 'in_progress':
        return <Video className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4" />;
      case 'no_show':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const canJoinCall = (visit: Visit) => {
    if (visit.status !== 'scheduled' && visit.status !== 'in_progress') {
      return false;
    }
    
    const now = new Date();
    const scheduledStart = new Date(visit.scheduled_start);
    const scheduledEnd = new Date(visit.scheduled_end);
    const joinWindowStart = new Date(scheduledStart.getTime() - 15 * 60000); // 15 min early
    const joinWindowEnd = new Date(scheduledEnd.getTime() + 2 * 60 * 60000); // 2 hours after
    
    return now >= joinWindowStart && now <= joinWindowEnd;
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!visit) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-lg font-semibold text-gray-900">Visit not found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  The visit you're looking for doesn't exist or you don't have permission to view it.
                </p>
                <div className="mt-6">
                  <Button asChild>
                    <Link href="/visits">
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back to Visits
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Button variant="ghost" asChild className="mb-2">
              <Link href="/visits">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Visits
              </Link>
            </Button>
            <h1 className="text-3xl font-bold text-gray-900">Visit Details</h1>
          </div>
          <div className="flex items-center space-x-2">
            <Badge className={getStatusColor(visit.status)}>
              <span className="mr-1">{getStatusIcon(visit.status)}</span>
              {visit.status.replace('_', ' ').toUpperCase()}
            </Badge>
          </div>
        </div>

        {/* Action Buttons */}
        {canJoinCall(visit) && (
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-blue-900">Ready to join</h3>
                  <p className="text-sm text-blue-700">
                    Your video consultation is ready. Click below to join the call.
                  </p>
                </div>
                <Button asChild size="lg">
                  <Link href={`/video?visitId=${visit.visit_id}`}>
                    <Phone className="mr-2 h-5 w-5" />
                    Join Call
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Visit Information */}
        <Card>
          <CardHeader>
            <CardTitle>Visit Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Visit Type</label>
                <p className="mt-1 text-sm text-gray-900 capitalize">
                  {visit.visit_type?.replace('_', ' ')}
                </p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Visit ID</label>
                <p className="mt-1 text-xs text-gray-900 font-mono">
                  {visit.visit_id}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Scheduled Start</label>
                <p className="mt-1 text-sm text-gray-900">
                  <Calendar className="inline h-4 w-4 mr-1 text-gray-400" />
                  {formatDateTime(visit.scheduled_start)}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Scheduled End</label>
                <p className="mt-1 text-sm text-gray-900">
                  <Clock className="inline h-4 w-4 mr-1 text-gray-400" />
                  {formatDateTime(visit.scheduled_end)}
                </p>
              </div>

              {visit.actual_start && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Actual Start</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {formatDateTime(visit.actual_start)}
                  </p>
                </div>
              )}

              {visit.actual_end && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Actual End</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {formatDateTime(visit.actual_end)}
                  </p>
                </div>
              )}
            </div>

            {visit.chief_complaint && (
              <>
                <Separator />
                <div>
                  <label className="text-sm font-medium text-gray-500">Chief Complaint</label>
                  <p className="mt-1 text-sm text-gray-900">{visit.chief_complaint}</p>
                </div>
              </>
            )}

            {visit.notes && (
              <>
                <Separator />
                <div>
                  <label className="text-sm font-medium text-gray-500">Visit Notes</label>
                  <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{visit.notes}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Provider Information */}
        {visit.provider && (visit.provider.first_name || visit.provider.last_name) && (
          <Card>
            <CardHeader>
              <CardTitle>Provider Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <User className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {visit.provider.first_name && visit.provider.last_name 
                      ? `Dr. ${visit.provider.first_name} ${visit.provider.last_name}`
                      : 'Healthcare Provider'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {visit.provider.specialization || 'Healthcare Provider'}
                  </p>
                </div>
              </div>
              
              {visit.provider.email && (
                <div className="flex items-center text-sm text-gray-600">
                  <Mail className="h-4 w-4 mr-2 text-gray-400" />
                  {visit.provider.email}
                </div>
              )}
              
              {visit.provider.phone && (
                <div className="flex items-center text-sm text-gray-600">
                  <Phone className="h-4 w-4 mr-2 text-gray-400" />
                  {visit.provider.phone}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Patient Information */}
        {visit.patient && (
          <Card>
            <CardHeader>
              <CardTitle>Patient Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                  <User className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {visit.patient.first_name} {visit.patient.last_name}
                  </p>
                  {visit.patient.date_of_birth_encrypted && (
                    <p className="text-sm text-gray-500">
                      MRN: {visit.patient.mrn}
                    </p>
                  )}
                </div>
              </div>
              
              {visit.patient.email && (
                <div className="flex items-center text-sm text-gray-600">
                  <Mail className="h-4 w-4 mr-2 text-gray-400" />
                  {visit.patient.email}
                </div>
              )}
              
              {visit.patient.phone && (
                <div className="flex items-center text-sm text-gray-600">
                  <Phone className="h-4 w-4 mr-2 text-gray-400" />
                  {visit.patient.phone}
                </div>
              )}

              {visit.patient.address && (
                <div className="flex items-start text-sm text-gray-600">
                  <MapPin className="h-4 w-4 mr-2 mt-0.5 text-gray-400" />
                  <span>{visit.patient.address}</span>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {user?.role_name === 'provider' && visit.status === 'scheduled' && (
              <Button className="w-full" variant="outline">
                <Video className="mr-2 h-4 w-4" />
                Start Visit
              </Button>
            )}
            
            {user?.role_name === 'provider' && visit.status === 'in_progress' && (
              <Button className="w-full" variant="outline">
                <FileText className="mr-2 h-4 w-4" />
                Complete Visit & Add Notes
              </Button>
            )}

            {visit.status === 'scheduled' && (
              <Button className="w-full" variant="destructive">
                <XCircle className="mr-2 h-4 w-4" />
                Cancel Visit
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
