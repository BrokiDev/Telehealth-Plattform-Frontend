'use client';

import { useAuth } from '@/context/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Calendar, Video, Activity, Building } from 'lucide-react';
import { useEffect, useState } from 'react';
import { apiService } from '@/services/api';
import { Organization } from '@/types/medical';

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalPatients: 0,
    totalVisits: 0,
    activeVisits: 0,
    completedVisits: 0,
  });
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch organization data for providers
        if (user?.organization_id && (user.role_name === 'provider' || user.role_name === 'admin')) {
          try {
            const orgData = await apiService.getOrganization(user.organization_id);
            setOrganization(orgData);
          } catch (error) {
            console.error('Failed to fetch organization data:', error);
          }
        }

        // This would be replaced with actual dashboard API calls
        // For now, we'll simulate some data
        setStats({
          totalPatients: 25,
          totalVisits: 45,
          activeVisits: 3,
          completedVisits: 42,
        });
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.first_name}!
          </h1>
          <p className="text-gray-600 mt-2">
            Here's what's happening with your telehealth practice today.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? '...' : stats.totalPatients}</div>
              <p className="text-xs text-muted-foreground">
                +2 from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Visits</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? '...' : stats.totalVisits}</div>
              <p className="text-xs text-muted-foreground">
                +5 from last week
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Visits</CardTitle>
              <Video className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? '...' : stats.activeVisits}</div>
              <p className="text-xs text-muted-foreground">
                Currently in progress
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? '...' : `${Math.round((stats.completedVisits / stats.totalVisits) * 100)}%`}
              </div>
              <p className="text-xs text-muted-foreground">
                +2% from last week
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Organization Info for Providers */}
        {organization && (user?.role_name === 'provider' || user?.role_name === 'admin') && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Building className="h-5 w-5 text-blue-600" />
                <span>Organization</span>
              </CardTitle>
              <CardDescription>Your healthcare organization details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">Name</label>
                  <p className="text-base font-semibold text-gray-900">{organization.name}</p>
                </div>
                
                {organization.type && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Type</label>
                    <p className="text-sm text-gray-900 capitalize">{organization.type}</p>
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {organization.phone && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Phone</label>
                      <p className="text-sm text-gray-900">{organization.phone}</p>
                    </div>
                  )}
                  
                  {organization.email && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Email</label>
                      <p className="text-sm text-gray-900">{organization.email}</p>
                    </div>
                  )}
                </div>
                
                {(organization.address_line1 || organization.city) && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Address</label>
                    <p className="text-sm text-gray-900">
                      {organization.address_line1}
                      {organization.address_line2 && `, ${organization.address_line2}`}
                      {organization.city && (
                        <>
                          <br />
                          {organization.city}
                          {organization.state && `, ${organization.state}`}
                          {organization.zip_code && ` ${organization.zip_code}`}
                        </>
                      )}
                    </p>
                  </div>
                )}
                
                {organization.website && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Website</label>
                    <a 
                      href={organization.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      {organization.website}
                    </a>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Visits</CardTitle>
              <CardDescription>
                Your latest patient consultations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3].map((_, index) => (
                  <div key={index} className="flex items-center space-x-4">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Patient {index + 1}</p>
                      <p className="text-xs text-gray-500">Completed 2 hours ago</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Upcoming Appointments</CardTitle>
              <CardDescription>
                Your scheduled video consultations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3].map((_, index) => (
                  <div key={index} className="flex items-center space-x-4">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Patient {index + 4}</p>
                      <p className="text-xs text-gray-500">Scheduled for {2 + index}:00 PM</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}