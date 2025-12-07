// Organization types
export interface Organization {
  organization_id: string;
  name: string;
  type?: string;
  tax_id?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  phone?: string;
  email?: string;
  website?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

// Patient types
export interface Patient {
  patient_id: string;
  organization_id: string;
  assigned_provider_id?: string;
  user_id?: string;
  email?: string;
  phone?: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
  date_of_birth_encrypted: string;
  gender?: string;
  mrn: string;
  address_line1?: string;
  address_line2?: string;
  address?: string; // Full address string
  city?: string;
  state?: string;
  zip_code?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
  insurance_provider?: string;
  insurance_policy_number?: string;
  insurance_group_number?: string;
  preferred_language?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CreatePatientRequest {
  organization_id: string;
  email?: string;
  password?: string; // Temporary password for patient account
  first_name: string;
  last_name: string;
  middle_name?: string;
  date_of_birth: string;
  gender?: string;
  mrn?: string; // Optional, can be auto-generated
  phone?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
  insurance_provider?: string;
  insurance_policy_number?: string;
  insurance_group_number?: string;
  preferred_language?: string;
}

// Provider types
export interface Provider {
  provider_id: string;
  organization_id: string;
  user_id: string;
  npi_number: string;
  specialty?: string;
  specialization?: string; // Alias for specialty
  license_number?: string;
  license_state?: string;
  phone?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

// Visit types
export interface Visit {
  visit_id: string;
  organization_id: string;
  provider_id: string;
  patient_id: string;
  visit_type: string;
  visit_status: string;
  status: string; // Alias for visit_status to maintain compatibility
  scheduled_start: string;
  scheduled_end: string;
  actual_start?: string;
  actual_end?: string;
  chief_complaint?: string;
  visit_notes?: string;
  notes?: string; // Alias for visit_notes
  twilio_room_sid?: string;
  twilio_room_name?: string;
  created_at?: string;
  updated_at?: string;
  // Related data
  patient?: Patient;
  provider?: Provider;
}

export interface CreateVisitRequest {
  organization_id: string;
  provider_id: string;
  patient_id: string;
  visit_type: string;
  scheduled_start: string;
  scheduled_end: string;
  chief_complaint?: string;
  visit_notes?: string;
}

// Guest Visit types
export interface GuestVisit {
  visit_id: string;
  organization_id: string;
  provider_id: string;
  visit_type: string;
  visit_status: string;
  scheduled_start: string;
  scheduled_end: string;
  chief_complaint?: string;
  visit_notes?: string;
  guest_token: string;
  guest_token_expires_at: string;
  guest_email?: string;
  guest_name?: string;
  guest_joined_at?: string;
  is_guest_registered: boolean;
  created_at: string;
  updated_at: string;
  shareable_link?: string;
  // Related data
  provider?: Provider;
}

export interface CreateGuestVisitRequest {
  visit_type: string;
  scheduled_start: string;
  scheduled_end: string;
  chief_complaint?: string;
  visit_notes?: string;
  guest_email?: string;
  send_email?: boolean;
}

export interface RegisterGuestRequest {
  guest_name: string;
  guest_email?: string;
}