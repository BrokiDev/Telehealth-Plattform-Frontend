import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { LoginCredentials, LoginResponse, User } from '@/types/auth';
import { 
  Patient, 
  Provider, 
  CreatePatientRequest, 
  Visit, 
  CreateVisitRequest, 
  Organization,
  GuestVisit,
  CreateGuestVisitRequest,
  RegisterGuestRequest
} from '@/types/medical';
import { VideoToken } from '@/types/video';
import { ApiResponse } from '@/types/common';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api',
      timeout: 30000,
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = this.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          this.removeToken();
          // Redirect to login if needed
          if (typeof window !== 'undefined' && typeof window.location !== 'undefined') {
            window.location.href = '/auth/login';
          }
        }
        return Promise.reject(error);
      }
    );
  }

  // Token management
  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('auth_token');
  }

  private setToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
    }
  }

  private removeToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
    }
  }

  // Authentication endpoints
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const response = await this.api.post('/auth/login', credentials);
    
    // Backend returns standardized format: { statusCode, status, message, data, timestamp }
    const { data } = response.data;
    const { tokens, user: backendUser } = data;
    
    // Map backend response to frontend User interface
    const mappedUser: User = {
      user_id: backendUser.id,
      email: backendUser.email,
      first_name: backendUser.firstName,
      last_name: backendUser.lastName,
      role_name: backendUser.role,
      permissions: backendUser.permissions,
      organization_id: backendUser.organizationId,
      provider_id: backendUser.providerId,
      patient_id: backendUser.patientId,
      is_active: true,
      email_verified: true,
    };
    
    const token = tokens.accessToken;
    this.setToken(token);
    
    return {
      user: mappedUser,
      token: token
    };
  }

  async logout(): Promise<void> {
    try {
      await this.api.post('/auth/logout');
    } finally {
      this.removeToken();
    }
  }

  async verifyToken(): Promise<LoginResponse> {
    const response = await this.api.get('/auth/me');
    
    // Backend returns standardized format
    const { data } = response.data;
    const backendUser = data.user;
    
    
    // Map backend response to frontend User interface
    const mappedUser: User = {
      user_id: backendUser.id,
      email: backendUser.email,
      first_name: backendUser.firstName,
      last_name: backendUser.lastName,
      role_name: backendUser.role,
      permissions: backendUser.permissions,
      organization_id: backendUser.organizationId || backendUser.organization_id,
      provider_id: backendUser.providerId || backendUser.provider_id,
      patient_id: backendUser.patientId || backendUser.patient_id,
      is_active: backendUser.status === 'active',
      email_verified: true,
    };
    
    
    return {
      user: mappedUser,
      token: this.getToken() || ''
    };
  }

  // Patient endpoints
  async getPatients(params?: { page?: number; limit?: number; search?: string }): Promise<Patient[]> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.search) queryParams.append('search', params.search);
      
      const url = `/patients${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await this.api.get(url);
      
      
      // Backend returns standardized format: { statusCode, status, message, data, timestamp }
      const { data } = response.data;
      return data.patients || [];
    } catch (error) {
      throw error;
    }
  }

  async getPatient(patientId: string): Promise<Patient> {
    const response = await this.api.get(`/patients/${patientId}`);
    // Backend returns: { statusCode, status, message, data: { patient }, timestamp }
    return response.data.data.patient;
  }

  async createPatient(patientData: CreatePatientRequest): Promise<Patient> {
    const response = await this.api.post('/patients', patientData);
    // Backend returns: { statusCode, status, message, data: { patient }, timestamp }
    return response.data.data.patient;
  }

  async updatePatient(patientId: string, patientData: Partial<CreatePatientRequest>): Promise<Patient> {
    const response = await this.api.put(`/patients/${patientId}`, patientData);
    // Backend returns: { statusCode, status, message, data: { patient }, timestamp }
    return response.data.data.patient;
  }

  async deletePatient(patientId: string): Promise<void> {
    await this.api.delete(`/patients/${patientId}`);
  }

  async searchPatients(query: string): Promise<Patient[]> {
    const response = await this.api.get(`/patients/search?query=${encodeURIComponent(query)}`);
    return response.data.data.patients || [];
  }

  // Provider endpoints
  async getProviders(params?: { page?: number; limit?: number; search?: string }): Promise<Provider[]> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.search) queryParams.append('search', params.search);
      
      const url = `/providers${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await this.api.get(url);
      
      // Backend returns: { statusCode, status, message, data: { providers, total, page, limit, totalPages }, timestamp }
      return response.data.data.providers || [];
    } catch (error) {
      console.error('Error fetching providers:', error);
      throw error;
    }
  }

  async getProvider(providerId: string): Promise<Provider> {
    const response = await this.api.get(`/providers/${providerId}`);
    // Backend returns: { statusCode, status, message, data: { provider }, timestamp }
    return response.data.data.provider;
  }

  async createProvider(providerData: any): Promise<Provider> {
    const response = await this.api.post('/providers', providerData);
    return response.data.data.provider;
  }

  async updateProvider(providerId: string, providerData: any): Promise<Provider> {
    const response = await this.api.put(`/providers/${providerId}`, providerData);
    return response.data.data.provider;
  }

  async deleteProvider(providerId: string): Promise<void> {
    await this.api.delete(`/providers/${providerId}`);
  }

  async searchProviders(query: string): Promise<Provider[]> {
    const response = await this.api.get(`/providers/search?query=${encodeURIComponent(query)}`);
    return response.data.data.providers || [];
  }

  // Visit endpoints  
  async getVisits(params?: { page?: number; limit?: number; status?: string }): Promise<Visit[]> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.status) queryParams.append('status', params.status);
      
      const url = `/visits${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await this.api.get(url);
      
      // Backend returns: { statusCode, status, message, data: { visits, total, page }, timestamp }
      return response.data.data.visits || [];
    } catch (error) {
      console.error('Error fetching visits:', error);
      return [];
    }
  }

  async getVisit(visitId: string): Promise<Visit> {
    const response = await this.api.get(`/visits/${visitId}`);
    // Backend returns: { statusCode, status, message, data: { visit }, timestamp }
    return response.data.data.visit;
  }

  async getVisitById(visitId: string): Promise<Visit> {
    return this.getVisit(visitId);
  }

  async createVisit(visitData: CreateVisitRequest): Promise<Visit> {
    const response = await this.api.post('/visits', visitData);
    // Backend returns: { statusCode, status, message, data: { visit }, timestamp }
    return response.data.data.visit;
  }

  async updateVisitStatus(visitId: string, status: string, notes?: string): Promise<Visit> {
    const response = await this.api.put(`/visits/${visitId}/status`, { 
      status,
      notes 
    });
    // Backend returns: { statusCode, status, message, data: { visit }, timestamp }
    return response.data.data.visit;
  }

  async updateVisit(visitId: string, visitData: Partial<CreateVisitRequest>): Promise<Visit> {
    // Use status update endpoint since PUT /visits/:id doesn't exist
    // Extract status from visitData or default to 'scheduled'
    const status = (visitData as any).status || 'scheduled';
    return this.updateVisitStatus(visitId, status);
  }

  async startVisit(visitId: string, roomInfo?: { room_name?: string; room_sid?: string }): Promise<Visit> {
    const response = await this.api.post(`/visits/${visitId}/start`, roomInfo || {});
    // Backend returns: { statusCode, status, message, data: { visit, roomSid, roomName }, timestamp }
    return response.data.data.visit;
  }

  async endVisit(visitId: string, notes?: string): Promise<Visit> {
    const response = await this.api.post(`/visits/${visitId}/end`, { 
      notes
    });
    // Backend returns: { statusCode, status, message, data: { visit }, timestamp }
    return response.data.data.visit;
  }

  async cancelVisit(visitId: string, reason?: string): Promise<Visit> {
    const response = await this.api.put(`/visits/${visitId}/cancel`, { 
      reason
    });
    // Backend returns: { statusCode, status, message, data: { visit }, timestamp }
    return response.data.data.visit;
  }

  async getVisitArtifacts(visitId: string): Promise<{
    recordings: Array<{
      recording_id: string;
      file_name: string;
      file_size: number;
      duration_seconds: number;
      format: string;
      status: string;
      created_at: string;
    }>;
    transcriptions: Array<{
      transcription_id: string;
      speaker_name: string;
      text: string;
      timestamp: string;
    }>;
    documents: Array<{
      document_id: string;
      file_name: string;
      file_type: string;
      file_size: number;
      created_at: string;
    }>;
  }> {
    const response = await this.api.get(`/visits/${visitId}/artifacts`);
    return response.data.data;
  }

  // Video endpoints
  async getVideoToken(visitId: string, userId: string, userType: 'provider' | 'patient'): Promise<VideoToken> {
    const response = await this.api.get(`/visits/${visitId}/token/${userId}/${userType}`);
    // Backend uses standardized response format: { statusCode, status, message, data }
    return response.data.data;
  }

  // Transcription endpoints
  async enableTranscription(visitId: string): Promise<{ message: string }> {
    const response = await this.api.post(`/visits/${visitId}/transcription/enable`);
    return response.data.data;
  }

  async disableTranscription(visitId: string): Promise<{ message: string }> {
    const response = await this.api.post(`/visits/${visitId}/transcription/disable`);
    return response.data.data;
  }

  async getTranscriptions(visitId: string): Promise<Array<{
    transcription_id: string;
    visit_id: string;
    speaker_name: string;
    speaker_type: 'provider' | 'patient';
    text: string;
    confidence: number;
    is_final: boolean;
    language: string;
    timestamp: string;
  }>> {
    const response = await this.api.get(`/visits/${visitId}/transcriptions`);
    // Backend returns: { statusCode, status, message, data: { transcriptions }, timestamp }
    return response.data.data.transcriptions || [];
  }

  async getRecentTranscriptions(visitId: string, seconds: number = 30): Promise<Array<{
    transcription_id: string;
    visit_id: string;
    speaker_name: string;
    speaker_type: 'provider' | 'patient';
    text: string;
    confidence: number;
    is_final: boolean;
    language: string;
    timestamp: string;
  }>> {
    const response = await this.api.get(`/visits/${visitId}/transcriptions/recent?seconds=${seconds}`);
    // Backend returns: { statusCode, status, message, data: { transcriptions }, timestamp }
    return response.data.data.transcriptions || [];
  }

  async saveTranscription(visitId: string, data: {
    speaker_name: string;
    speaker_type: 'provider' | 'patient';
    text: string;
    confidence: number;
    is_final: boolean;
    language: string;
    timestamp: string;
  }): Promise<void> {
    await this.api.post(`/visits/${visitId}/transcriptions`, data);
  }

  // Recording endpoints
  async startRecording(visitId: string, options: {
    format?: 'mp4' | 'webm';
    estimatedDurationMinutes?: number;
  }): Promise<{
    message: string;
    recordingId: string;
    uploadUrl: string;
    expiresIn: number;
  }> {
    const response = await this.api.post(`/visits/${visitId}/recording/start`, options);
    // Backend returns: { statusCode, status, message, data: { recordingId, uploadUrl, expiresIn }, timestamp }
    return response.data.data;
  }

  async stopRecording(visitId: string): Promise<{ message: string }> {
    const response = await this.api.post(`/visits/${visitId}/recording/stop`);
    return response.data.data;
  }

  async confirmRecordingUpload(recordingId: string, data: {
    fileSizeBytes: number;
    durationSeconds?: number;
  }): Promise<{ message: string }> {
    const response = await this.api.post(`/recordings/${recordingId}/confirm-upload`, data);
    return response.data.data;
  }

  async getRecording(visitId: string, recordingId: string): Promise<{
    recording_id: string;
    visit_id: string;
    file_name: string;
    file_size: number;
    duration_seconds: number;
    format: string;
    status: string;
    s3_key: string;
    created_at: string;
  }> {
    const response = await this.api.get(`/visits/${visitId}/recordings/${recordingId}`);
    // Backend returns: { statusCode, status, message, data: { recording }, timestamp }
    return response.data.data.recording;
  }

  async deleteRecording(visitId: string, recordingId: string, hard: boolean = false): Promise<{ message: string }> {
    const response = await this.api.delete(`/visits/${visitId}/recordings/${recordingId}${hard ? '?hard=true' : ''}`);
    return response.data.data;
  }

  // Organization endpoints
  async getOrganization(organizationId: string): Promise<Organization> {
    const response = await this.api.get(`/organizations/${organizationId}`);
    // Backend returns: { statusCode, status, message, data: { organization }, timestamp }
    return response.data.data.organization;
  }

  async getOrganizations(params?: { page?: number; limit?: number }): Promise<Organization[]> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      
      const url = `/organizations${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await this.api.get(url);
      
      // Backend returns: { statusCode, status, message, data: { organizations, total, page }, timestamp }
      return response.data.data.organizations || [];
    } catch (error) {
      console.error('Error fetching organizations:', error);
      throw error;
    }
  }

  async createOrganization(organizationData: any): Promise<Organization> {
    const response = await this.api.post('/organizations', organizationData);
    return response.data.data.organization;
  }

  async updateOrganization(organizationId: string, organizationData: any): Promise<Organization> {
    const response = await this.api.put(`/organizations/${organizationId}`, organizationData);
    return response.data.data.organization;
  }

  async deleteOrganization(organizationId: string): Promise<void> {
    await this.api.delete(`/organizations/${organizationId}`);
  }

  async searchOrganizations(query: string): Promise<Organization[]> {
    const response = await this.api.get(`/organizations/search?query=${encodeURIComponent(query)}`);
    return response.data.data.organizations || [];
  }

  // Guest Visit endpoints
  async createGuestVisit(visitData: CreateGuestVisitRequest): Promise<GuestVisit> {
    const response = await this.api.post('/guest-visits', visitData);
    // Backend returns: { statusCode, status, message, data: { visit, shareableLink }, timestamp }
    const { visit, shareableLink } = response.data.data;
    return {
      ...visit,
      shareable_link: shareableLink
    };
  }

  async validateGuestVisit(token: string): Promise<{
    isValid: boolean;
    isExpired: boolean;
    visit?: GuestVisit;
    message?: string;
  }> {
    const response = await this.api.get(`/guest-visits/validate/${token}`);
    // Backend returns: { statusCode, status, message, data: { isValid, isExpired, visit }, timestamp }
    return response.data.data;
  }

  async registerGuest(visitId: string, data: RegisterGuestRequest): Promise<GuestVisit> {
    const response = await this.api.post(`/guest-visits/${visitId}/join`, data);
    // Backend returns: { statusCode, status, message, data: { visit }, timestamp }
    return response.data.data.visit;
  }

  async getGuestVisitByToken(token: string): Promise<GuestVisit> {
    const response = await this.api.get(`/guest-visits/token/${token}`);
    // Backend returns: { statusCode, status, message, data: { visit }, timestamp }
    return response.data.data.visit;
  }

  async regenerateGuestLink(visitId: string): Promise<{
    visit: GuestVisit;
    shareableLink: string;
  }> {
    const response = await this.api.post(`/guest-visits/${visitId}/regenerate`);
    // Backend returns: { statusCode, status, message, data: { visit, shareableLink }, timestamp }
    return response.data.data;
  }

  async revokeGuestLink(visitId: string): Promise<{ message: string }> {
    const response = await this.api.post(`/guest-visits/${visitId}/revoke`);
    // Backend returns: { statusCode, status, message, data: { message }, timestamp }
    return response.data.data;
  }

  async getGuestVideoToken(token: string): Promise<VideoToken> {
    const response = await this.api.get(`/guest-visits/${token}/video-token`);
    // Backend returns: { statusCode, status, message, data: VideoToken, timestamp }
    return response.data.data;
  }

  // Users endpoints
  async getUsers(params?: { page?: number; limit?: number; role?: string }): Promise<User[]> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.role) queryParams.append('role', params.role);
      
      const url = `/users${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await this.api.get(url);
      
      return response.data.data.users || [];
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }

  async getUser(userId: string): Promise<User> {
    const response = await this.api.get(`/users/${userId}`);
    const backendUser = response.data.data.user;
    
    return {
      user_id: backendUser.id,
      email: backendUser.email,
      first_name: backendUser.firstName,
      last_name: backendUser.lastName,
      role_name: backendUser.role,
      permissions: backendUser.permissions,
      organization_id: backendUser.organizationId,
      provider_id: backendUser.providerId,
      patient_id: backendUser.patientId,
      is_active: backendUser.status === 'active',
      email_verified: backendUser.email_verified || false,
    };
  }

  async createUser(userData: any): Promise<User> {
    const response = await this.api.post('/users', userData);
    return response.data.data.user;
  }

  async updateUser(userId: string, userData: any): Promise<User> {
    const response = await this.api.put(`/users/${userId}`, userData);
    return response.data.data.user;
  }

  async deactivateUser(userId: string): Promise<void> {
    await this.api.put(`/users/${userId}/deactivate`);
  }
}

export const apiService = new ApiService();
export default apiService;