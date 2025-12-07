'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/AuthContext';
import { apiService } from '@/services/api';
import { Patient } from '@/types/medical';
import {
  Calendar,
  Edit,
  Eye,
  FileText,
  Filter,
  Mail,
  MapPin,
  MoreVertical,
  Phone,
  Search,
  User,
  UserPlus
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export default function PatientsPage() {
  const { user } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const patientsData = await apiService.getPatients();
        setPatients(patientsData);
        setFilteredPatients(patientsData);
      } catch (error: any) {
        toast.error('Failed to load patients: ' + (error.response?.data?.error || error.message));
      } finally {
        setLoading(false);
      }
    };

    fetchPatients();
  }, [user]);

  // Filter patients based on search term
  useEffect(() => {
    const filtered = patients.filter(patient =>
      `${patient.first_name} ${patient.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.mrn?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.phone?.includes(searchTerm)
    );
    setFilteredPatients(filtered);
  }, [searchTerm, patients]);

  const calculateAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';
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

  // Check if user has permission to view patients
  if (user?.role_name === 'patient') {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Access Restricted
          </h3>
          <p className="text-gray-600">
            You don't have permission to view patient records.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Patients</h1>
            <p className="text-gray-600 mt-2">
              Manage patient records and information
            </p>
          </div>
          {(user?.role_name === 'admin' || user?.role_name === 'provider') && (
            <Button asChild>
              <Link href="/patients/new">
                <UserPlus className="mr-2 h-4 w-4" />
                Add Patient
              </Link>
            </Button>
          )}
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search patients by name, email, MRN, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline">
                <Filter className="mr-2 h-4 w-4" />
                Filter
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Patients List */}
        {filteredPatients.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {searchTerm ? 'No patients found' : 'No patients registered'}
              </h3>
              <p className="text-gray-600 mb-4">
                {searchTerm 
                  ? 'Try adjusting your search terms to find what you\'re looking for.'
                  : 'Get started by adding your first patient to the system.'
                }
              </p>
              {!searchTerm && (user?.role_name === 'admin' || user?.role_name === 'provider') && (
                <Button asChild>
                  <Link href="/patients/new">Add Your First Patient</Link>
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {filteredPatients.map((patient) => (
              <Card key={patient.patient_id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="bg-blue-100 p-2 rounded-lg">
                        <User className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">
                          {patient.first_name} {patient.last_name}
                        </CardTitle>
                        <CardDescription>
                          MRN: {patient.mrn} • Age: {calculateAge(patient.date_of_birth_encrypted)} • {patient.gender}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor(patient.is_active ?? false)}>
                        {patient.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem asChild>
                            <Link href={`/patients/${patient.patient_id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          {(user?.role_name === 'admin' || user?.role_name === 'provider') && (
                            <>
                              <DropdownMenuItem asChild>
                                <Link href={`/patients/${patient.patient_id}/edit`}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit Patient
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem asChild>
                                <Link href={`/visits/new?patientId=${patient.patient_id}`}>
                                  <Calendar className="mr-2 h-4 w-4" />
                                  Schedule Visit
                                </Link>
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {patient.email && (
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium">Email</p>
                          <p className="text-xs text-gray-600 truncate">
                            {patient.email}
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {patient.phone && (
                      <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium">Phone</p>
                          <p className="text-xs text-gray-600">
                            {patient.phone}
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium">Date of Birth</p>
                        <p className="text-xs text-gray-600">
                          {new Date(patient.date_of_birth_encrypted).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {(patient.city && patient.state) && (
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium">Location</p>
                          <p className="text-xs text-gray-600">
                            {patient.city}, {patient.state}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {patient.insurance_provider && (
                    <div className="mt-4 pt-4 border-t">
                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium">Insurance</p>
                          <p className="text-xs text-gray-600">
                            {patient.insurance_provider} - Policy: {patient.insurance_policy_number}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Results Summary */}
        {searchTerm && (
          <div className="text-center text-sm text-gray-600">
            Showing {filteredPatients.length} of {patients.length} patients
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}