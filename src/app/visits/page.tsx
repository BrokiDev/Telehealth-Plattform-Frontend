'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';
import { apiService } from '@/services/api';
import { Visit } from '@/types/medical';
import { toast } from 'sonner';
import { Calendar, Video, Phone, Clock, User, FileText, UserPlus } from 'lucide-react';
import Link from 'next/link';
import { formatDateTime } from '@/utils/timezone';

export default function VisitsPage() {
  const { user } = useAuth();
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);

  // Helper function to format datetime for display in America/Santo_Domingo timezone
  const formatDateTime12Hour = (dateTimeString: string) => {
    if (!dateTimeString) return { date: '', time: '' };
    
    return {
      date: formatDateTime(dateTimeString, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }),
      time: formatDateTime(dateTimeString, {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })
    };
  };

  useEffect(() => {
    const fetchVisits = async () => {
      try {
        const visitsData = await apiService.getVisits();
        setVisits(visitsData);
      } catch (error: any) {
        toast.error('Failed to load visits');
        console.error('Error fetching visits:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchVisits();
  }, []);

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
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const canJoinCall = (visit: Visit) => {
    return visit.status === 'scheduled' || visit.status === 'in_progress';
  };

  const handleStartVisit = async (visitId: string) => {
    try {
      await apiService.startVisit(visitId);
      toast.success('Visit started successfully');
      // Refresh visits
      const visitsData = await apiService.getVisits();
      setVisits(visitsData);
    } catch (error: any) {
      toast.error('Failed to start visit');
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Visits</h1>
            <p className="text-gray-600 mt-2">
              Manage your telehealth consultations and video calls
            </p>
          </div>
          {user?.role_name === 'provider' && (
            <div className="flex gap-3">
              <Button asChild variant="outline">
                <Link href="/visits/new-guest">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Create Guest Visit
                </Link>
              </Button>
              <Button asChild>
                <Link href="/visits/new">
                  <Calendar className="mr-2 h-4 w-4" />
                  Schedule Visit
                </Link>
              </Button>
            </div>
          )}
        </div>

        {visits.length === 0 ? (
          <div className="space-y-6">
            <Card>
              <CardContent className="text-center py-12">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No visits scheduled
                </h3>
                <p className="text-gray-600 mb-6">
                  {user?.role_name === 'provider' 
                    ? "You haven't scheduled any visits yet."
                    : "You don't have any upcoming visits."
                  }
                </p>
                {user?.role_name === 'provider' && (
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button asChild>
                      <Link href="/visits/new">
                        <Calendar className="mr-2 h-4 w-4" />
                        Schedule Visit
                      </Link>
                    </Button>
                    <Button asChild variant="outline">
                      <Link href="/visits/new-guest">
                        <UserPlus className="mr-2 h-4 w-4" />
                        Create Guest Link
                      </Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {user?.role_name === 'provider' && (
              <Card className="border-blue-200 bg-blue-50">
                <CardHeader>
                  <CardTitle className="flex items-center text-blue-900">
                    <UserPlus className="mr-2 h-5 w-5" />
                    New: Guest Visits
                  </CardTitle>
                  <CardDescription className="text-blue-700">
                    Share a link with anyone for instant video consultations
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-start space-x-2">
                      <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center shrink-0 text-xs font-bold">
                        1
                      </div>
                      <div>
                        <p className="font-medium text-blue-900">Create Link</p>
                        <p className="text-blue-700">Generate a shareable consultation link</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-2">
                      <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center shrink-0 text-xs font-bold">
                        2
                      </div>
                      <div>
                        <p className="font-medium text-blue-900">Share</p>
                        <p className="text-blue-700">Send via WhatsApp, email, or SMS</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-2">
                      <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center shrink-0 text-xs font-bold">
                        3
                      </div>
                      <div>
                        <p className="font-medium text-blue-900">Meet</p>
                        <p className="text-blue-700">Guest joins instantly - no account needed</p>
                      </div>
                    </div>
                  </div>
                  <Button asChild className="w-full sm:w-auto" size="sm">
                    <Link href="/visits/new-guest">
                      Try Guest Visits Now
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <div className="grid gap-6">
            {visits.map((visit) => (
              <Card key={visit.visit_id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="bg-blue-100 p-2 rounded-lg">
                        <Video className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">
                          {visit.visit_type} Consultation
                        </CardTitle>
                        <CardDescription>
                          Visit ID: {visit.visit_id}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge className={getStatusColor(visit.status)}>
                      {visit.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium">Scheduled</p>
                        <p className="text-xs text-gray-600">
                          {formatDateTime12Hour(visit.scheduled_start).date} at{' '}
                          {formatDateTime12Hour(visit.scheduled_start).time}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium">Duration</p>
                        <p className="text-xs text-gray-600">
                          {Math.round(
                            (new Date(visit.scheduled_end).getTime() - 
                             new Date(visit.scheduled_start).getTime()) / 60000
                          )} minutes
                        </p>
                      </div>
                    </div>

                    {visit.chief_complaint && (
                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium">Chief Complaint</p>
                          <p className="text-xs text-gray-600 truncate">
                            {visit.chief_complaint}
                          </p>
                        </div>
                      </div>
                    )}

                    {visit.status === 'completed' && visit.visit_notes && (
                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium">Notes</p>
                          <p className="text-xs text-gray-600 truncate">
                            {visit.visit_notes}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    {canJoinCall(visit) && (
                      <Button asChild size="sm">
                        <Link href={`/video?visitId=${visit.visit_id}`}>
                          <Phone className="mr-2 h-4 w-4" />
                          Join Call
                        </Link>
                      </Button>
                    )}
                    
                    {user?.role_name === 'provider' && visit.status === 'scheduled' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStartVisit(visit.visit_id)}
                      >
                        Start Visit
                      </Button>
                    )}
                    
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/visits/${visit.visit_id}`}>
                        View Details
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}