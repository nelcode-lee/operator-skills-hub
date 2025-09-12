/**
 * User and profile type definitions
 */

export interface UserProfile {
  id: number;
  user_id: number;
  first_name: string;
  last_name: string;
  phone?: string;
  qualifications?: string;
  bio?: string;
  profile_image_url?: string;
  created_at: string;
  updated_at?: string;
}

export interface User {
  id: number;
  email: string;
  role: string;
  cscs_card_number?: string;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at?: string;
  profile?: UserProfile;
}

export interface UserRegistration {
  email: string;
  password: string;
  role: string;
  cscs_card_number?: string;
  first_name: string;
  last_name: string;
  phone?: string;
  qualifications?: string;
}

export interface UserProfileUpdate {
  first_name?: string;
  last_name?: string;
  phone?: string;
  qualifications?: string;
  bio?: string;
}

export interface UserProfileCreate {
  first_name: string;
  last_name: string;
  phone?: string;
  qualifications?: string;
  bio?: string;
}



