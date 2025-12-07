'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/AuthContext';
import { apiService } from '@/services/api';
import { CreateVisitRequest, Patient } from '@/types/medical';
import { toast } from 'sonner';
import { ArrowLeft, Save, Calendar, User, Clock, FileText } from 'lucide-react';
import Link from 'next/link';
import { Suspense } from 'react';
import { 
  datetimeLocalToISO, 
  isoToDatetimeLocal, 
  formatTime, 
  formatDateTime,
  getTodayDateString,
  getCurrentTimeString,
  calculateEndTime as calculateEndTimeInTimezone
} from '@/utils/timezone';

function ScheduleVisitForm() {
  const router = useRouter();
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const preselectedPatientId = searchParams.get('patientId');
  
  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(true);
  
  const [formData, setFormData] = useState<CreateVisitRequest>({
    organization_id: '', // Will be set from user context
    provider_id: '',     // Will be set from user context
    patient_id: preselectedPatientId || '',
    visit_type: 'consultation',
    scheduled_start: '',
    scheduled_end: '',
    chief_complaint: '',
    visit_notes: '',
  });

  // Check if user has permission to schedule visits
  if (user?.role_name === 'patient') {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Access Restricted
          </h3>
          <p className="text-gray-600">
            You don't have permission to schedule visits.
          </p>
          <Button asChild className="mt-4">
            <Link href="/visits">Back to Visits</Link>
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const patientsData = await apiService.getPatients();
        setPatients(patientsData);
      } catch (error: any) {
        toast.error('Failed to load patients');
        console.error('Error fetching patients:', error);
      } finally {
        setLoadingPatients(false);
      }
    };

    fetchPatients();
  }, []);

  // Update form data when user context is loaded
  useEffect(() => {
    if (user && user.organization_id && user.provider_id) {
      
      setFormData((prev: CreateVisitRequest) => ({
        ...prev,
        organization_id: user.organization_id!,
        provider_id: user.provider_id!,
      }));
    }
  }, [user]);

  // Initialize with today's date and smart time if no preselected patient
  useEffect(() => {
    if (!preselectedPatientId && !formData.scheduled_start) {
      const today = getTodayDateString();
      const currentTime = getCurrentTimeString();
      const defaultStart = `${today}T${currentTime}`;
      
      setFormData((prev: CreateVisitRequest) => ({
        ...prev,
        scheduled_start: defaultStart,
        scheduled_end: calculateEndTimeInTimezone(defaultStart, 30)
      }));
    }
  }, [preselectedPatientId, formData.scheduled_start]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev: CreateVisitRequest) => ({
      ...prev,
      [name]: value
    }));
  };

  // Helper function to format datetime for display (12-hour format) - uses timezone utility
  const formatDateTimeDisplay = (dateTimeString: string) => {
    if (!dateTimeString) return '';
    
    return formatDateTime(dateTimeString, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  // Helper function to format time only (12-hour format) - uses timezone utility
  const formatTimeDisplay = (dateTimeString: string) => {
    if (!dateTimeString) return '';
    
    return formatTime(dateTimeString);
  };

  const handleStartTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const startTime = e.target.value;
    setFormData((prev: CreateVisitRequest) => ({
      ...prev,
      scheduled_start: startTime,
      scheduled_end: calculateEndTimeInTimezone(startTime, 30) // Default 30 minutes
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Convert datetime-local values to ISO strings with correct timezone (America/Santo_Domingo)
      const scheduledStartISO = datetimeLocalToISO(formData.scheduled_start);
      const scheduledEndISO = datetimeLocalToISO(formData.scheduled_end);

      // Use user context data directly for organization_id and provider_id
      const submitData = {
        ...formData,
        organization_id: user?.organization_id || formData.organization_id,
        provider_id: user?.provider_id || formData.provider_id,
        scheduled_start: scheduledStartISO,
        scheduled_end: scheduledEndISO,
      };

      // Validate required fields
      if (!submitData.organization_id || !submitData.provider_id) {
        toast.error('User authentication error. Please refresh the page or log out and log back in.');
        setLoading(false);
        return;
      }

      if (!submitData.patient_id) {
        toast.error('Please select a patient for this visit.');
        setLoading(false);
        return;
      }


      const visit = await apiService.createVisit(submitData);
      toast.success(`Visit scheduled successfully! Visit ID: ${visit.visit_id}`);
      // Redirect to visits list since individual visit pages don't exist yet
      router.push('/visits');
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message;
      toast.error('Failed to schedule visit: ' + errorMessage);
      console.error('❌ Error creating visit:', error.response?.data || error);
    } finally {
      setLoading(false);
    }
  };

  const selectedPatient = patients.find(p => p.patient_id === formData.patient_id);

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
            <h1 className="text-3xl font-bold text-gray-900">Schedule New Visit</h1>
            <p className="text-gray-600 mt-2">
              Create a new telehealth appointment
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Patient Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="mr-2 h-5 w-5" />
                Patient Information
              </CardTitle>
              <CardDescription>
                Select the patient for this visit
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="patient_id">Patient *</Label>
                {loadingPatients ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span className="text-sm text-gray-600">Loading patients...</span>
                  </div>
                ) : (
                  <select
                    id="patient_id"
                    name="patient_id"
                    value={formData.patient_id}
                    onChange={handleInputChange}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    required
                  >
                    <option value="">Select a patient</option>
                    {patients.map((patient) => (
                      <option key={patient.patient_id} value={patient.patient_id}>
                        {patient.first_name} {patient.last_name} - MRN: {patient.mrn}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {selectedPatient && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900">Selected Patient</h4>
                  <div className="grid grid-cols-2 gap-4 mt-2 text-sm text-blue-800">
                    <div>
                      <span className="font-medium">Name:</span> {selectedPatient.first_name} {selectedPatient.last_name}
                    </div>
                    <div>
                      <span className="font-medium">MRN:</span> {selectedPatient.mrn}
                    </div>
                    {selectedPatient.email && (
                      <div>
                        <span className="font-medium">Email:</span> {selectedPatient.email}
                      </div>
                    )}
                    {selectedPatient.phone && (
                      <div>
                        <span className="font-medium">Phone:</span> {selectedPatient.phone}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Visit Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="mr-2 h-5 w-5" />
                Visit Details
              </CardTitle>
              <CardDescription>
                Configure the appointment details
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="visit_type">Visit Type *</Label>
                <select
                  id="visit_type"
                  name="visit_type"
                  value={formData.visit_type}
                  onChange={handleInputChange}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  required
                >
                  <option value="consultation">Consultation</option>
                  <option value="follow_up">Follow-up</option>
                  <option value="urgent">Urgent Care</option>
                  <option value="therapy">Therapy Session</option>
                  <option value="diagnosis">Diagnosis</option>
                  <option value="prescription_review">Prescription Review</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="chief_complaint">Chief Complaint</Label>
                <Input
                  id="chief_complaint"
                  name="chief_complaint"
                  value={formData.chief_complaint}
                  onChange={handleInputChange}
                  placeholder="Brief description of the patient's main concern"
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
              <CardDescription>
                Set the appointment date and time
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Date Selection */}
              <div>
                <Label htmlFor="visit_date" className="text-base font-medium">Appointment Date *</Label>
                <div className="mt-2">
                  <Input
                    id="visit_date"
                    type="date"
                    value={formData.scheduled_start ? formData.scheduled_start.slice(0, 10) : ''}
                    onChange={(e) => {
                      const date = e.target.value;
                      if (date) {
                        // Maintain existing time or set to current time if no time set
                        const existingTime = formData.scheduled_start ? formData.scheduled_start.slice(11) : getCurrentTimeString();
                        const newStartDateTime = `${date}T${existingTime}`;
                        setFormData((prev: CreateVisitRequest) => ({
                          ...prev,
                          scheduled_start: newStartDateTime,
                          scheduled_end: calculateEndTimeInTimezone(newStartDateTime, 30)
                        }));
                      }
                    }}
                    min={getTodayDateString()}
                    className="w-full text-lg p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    required
                  />
                </div>
                {formData.scheduled_start && (
                  <p className="text-sm text-blue-600 mt-1 flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    {new Date(formData.scheduled_start).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                )}
              </div>

              {/* Time Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="start_time" className="text-base font-medium flex items-center">
                    <Clock className="w-4 h-4 mr-2 text-green-600" />
                    Start Time *
                  </Label>
                  <div className="relative">
                    <Input
                      id="start_time"
                      type="time"
                      value={formData.scheduled_start ? formData.scheduled_start.slice(11, 16) : ''}
                      onChange={(e) => {
                        const time = e.target.value;
                        const date = formData.scheduled_start ? formData.scheduled_start.slice(0, 10) : new Date().toISOString().slice(0, 10);
                        const newStartDateTime = `${date}T${time}`;
                        setFormData((prev: CreateVisitRequest) => ({
                          ...prev,
                          scheduled_start: newStartDateTime,
                          scheduled_end: calculateEndTimeInTimezone(newStartDateTime, 30)
                        }));
                      }}
                      className="w-full text-lg p-4 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 pr-12"
                      required
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                      <Clock className="w-5 h-5" />
                    </div>
                  </div>
                  {formData.scheduled_start && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <p className="text-sm font-medium text-green-800">Start Time</p>
                      <p className="text-lg font-semibold text-green-900">
                        {formatTimeDisplay(formData.scheduled_start)}
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <Label htmlFor="end_time" className="text-base font-medium flex items-center">
                    <Clock className="w-4 h-4 mr-2 text-red-600" />
                    End Time *
                  </Label>
                  <div className="relative">
                    <Input
                      id="end_time"
                      type="time"
                      value={formData.scheduled_end ? formData.scheduled_end.slice(11, 16) : ''}
                      onChange={(e) => {
                        const time = e.target.value;
                        const date = formData.scheduled_end ? formData.scheduled_end.slice(0, 10) : formData.scheduled_start?.slice(0, 10) || new Date().toISOString().slice(0, 10);
                        const newEndDateTime = `${date}T${time}`;
                        setFormData((prev: CreateVisitRequest) => ({
                          ...prev,
                          scheduled_end: newEndDateTime
                        }));
                      }}
                      min={formData.scheduled_start ? formData.scheduled_start.slice(11, 16) : undefined}
                      className="w-full text-lg p-4 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:ring-2 focus:ring-red-200 pr-12"
                      required
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                      <Clock className="w-5 h-5" />
                    </div>
                  </div>
                  {formData.scheduled_end && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-sm font-medium text-red-800">End Time</p>
                      <p className="text-lg font-semibold text-red-900">
                        {formatTimeDisplay(formData.scheduled_end)}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Duration Buttons */}
              <div className="space-y-3">
                <Label className="text-base font-medium">Quick Duration</Label>
                <div className="flex flex-wrap gap-2">
                  {[15, 30, 45, 60, 90].map((minutes) => (
                    <Button
                      key={minutes}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (formData.scheduled_start) {
                          const newEndTime = calculateEndTimeInTimezone(formData.scheduled_start, minutes);
                          setFormData((prev: CreateVisitRequest) => ({
                            ...prev,
                            scheduled_end: newEndTime
                          }));
                        }
                      }}
                      disabled={!formData.scheduled_start}
                      className="hover:bg-blue-50 hover:border-blue-300"
                    >
                      {minutes} min
                    </Button>
                  ))}
                </div>
              </div>

              {/* Appointment Summary */}
              {formData.scheduled_start && formData.scheduled_end && (
                <div className="bg-linear-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-6">
                  <h4 className="font-semibold text-blue-900 mb-4 flex items-center">
                    <Calendar className="w-5 h-5 mr-2" />
                    Appointment Summary
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-white rounded-lg border border-blue-100">
                      <div className="text-2xl font-bold text-green-600 mb-1">
                        {formatTimeDisplay(formData.scheduled_start)}
                      </div>
                      <div className="text-sm text-gray-600 font-medium">Start Time</div>
                    </div>
                    <div className="text-center p-4 bg-white rounded-lg border border-blue-100">
                      <div className="text-2xl font-bold text-red-600 mb-1">
                        {formatTimeDisplay(formData.scheduled_end)}
                      </div>
                      <div className="text-sm text-gray-600 font-medium">End Time</div>
                    </div>
                    <div className="text-center p-4 bg-white rounded-lg border border-blue-100">
                      <div className="text-2xl font-bold text-blue-600 mb-1">
                        {Math.round((new Date(formData.scheduled_end).getTime() - new Date(formData.scheduled_start).getTime()) / 60000)}
                      </div>
                      <div className="text-sm text-gray-600 font-medium">Minutes</div>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-white rounded-lg border border-blue-100">
                    <p className="text-center text-gray-700">
                      <span className="font-semibold">Full Date & Time:</span><br />
                      {formatDateTimeDisplay(formData.scheduled_start)} - {formatTimeDisplay(formData.scheduled_end)}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Additional Notes */}
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
                placeholder="Any special instructions or notes for this visit..."
                rows={4}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
              />
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline" asChild>
              <Link href="/visits">Cancel</Link>
            </Button>
            <Button 
              type="submit" 
              disabled={
                loading || 
                !formData.patient_id || 
                !formData.scheduled_start || 
                !formData.scheduled_end ||
                !user?.organization_id || 
                !user?.provider_id
              }
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Scheduling...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Schedule Visit
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}

export default function NewVisitPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ScheduleVisitForm />
    </Suspense>
  );
}