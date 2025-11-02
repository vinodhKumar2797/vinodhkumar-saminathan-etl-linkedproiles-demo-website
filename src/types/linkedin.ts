export interface LinkedInProfile {
  id: string;
  linkedin_id: string;
  full_name: string;
  headline: string;
  location: string;
  summary: string;
  experience: ExperienceItem[];
  education: EducationItem[];
  skills: string[];
  connections_count: number;
  profile_url: string;
  data_hash: string;
  validation_status: 'pending' | 'valid' | 'invalid';
  validation_errors: ValidationError[];
  created_at: string;
  updated_at: string;
  last_validated_at?: string;
}

export interface ExperienceItem {
  company: string;
  title: string;
  start_date: string;
  end_date?: string;
  description?: string;
  location?: string;
}

export interface EducationItem {
  school: string;
  degree?: string;
  field_of_study?: string;
  start_year?: number;
  end_year?: number;
}

export interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ProfileImage {
  id: string;
  profile_id: string;
  image_type: 'profile_photo' | 'banner';
  image_url: string;
  image_hash: string;
  storage_path?: string;
  width: number;
  height: number;
  file_size: number;
  is_current: boolean;
  created_at: string;
}

export interface ETLRun {
  id: string;
  run_type: 'full' | 'incremental';
  status: 'running' | 'completed' | 'failed';
  started_at: string;
  completed_at?: string;
  profiles_processed: number;
  profiles_added: number;
  profiles_updated: number;
  profiles_unchanged: number;
  images_processed: number;
  validation_failures: number;
  error_message?: string;
  metadata: Record<string, unknown>;
}

export interface ProfileChange {
  id: string;
  profile_id: string;
  etl_run_id: string;
  field_name: string;
  old_value?: string;
  new_value?: string;
  changed_at: string;
}

export interface RawLinkedInProfile {
  linkedin_id: string;
  full_name: string;
  headline?: string;
  location?: string;
  summary?: string;
  experience?: ExperienceItem[];
  education?: EducationItem[];
  skills?: string[];
  connections_count?: number;
  profile_url: string;
  profile_image_url?: string;
  banner_image_url?: string;
}
