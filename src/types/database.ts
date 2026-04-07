export type Gender = 'MALE' | 'FEMALE' | 'OTHER';
export type GenderPref = 'SAME_GENDER' | 'ANY_GENDER';
export type UserStatus = 'ACTIVE' | 'COMPLETED' | 'EXPIRED' | 'HIDDEN' | 'SUSPENDED';
export type MessageStatus = 'PENDING' | 'SENT' | 'DELIVERED' | 'READ';
export type ReportStatus = 'PENDING' | 'REVIEWED' | 'ACTIONED' | 'DISMISSED';

export interface UserProfile {
  id: string; // uuid
  auth_id: string; // references auth.users(id)
  full_name: string;
  email: string;
  phone_number?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
  gender: Gender;
  gender_pref: GenderPref;
  course?: string | null;
  level?: 100 | 200 | 300 | 400 | 500 | 600 | null;
  has_paid: boolean;
  payment_date?: string | null;
  status: UserStatus;
  created_at: string;
  last_active: string;
  fcm_token?: string | null;
  is_student_verified: boolean;
  payment_reference?: string | null;
  is_pioneer: boolean;
  university_id?: string | null;
  student_email?: string | null;
}

export interface MatchRecord {
  id: string;
  user_a_id: string; // references public.users(id)
  user_b_id: string; 
  match_percentage: number;
  raw_score?: number | null;
  cross_category_flags?: any; 
  consistency_modifier?: number | null;
  calculated_at?: string;
  user_a_viewed?: boolean;
  user_b_viewed?: boolean;
  category_scores?: any; 
}

export interface Message {
  id: string;
  sender_id: string; // references public.users(id)
  receiver_id: string;
  content: string;
  created_at: string;
  status: MessageStatus;
}
