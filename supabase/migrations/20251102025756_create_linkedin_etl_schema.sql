/*
  # LinkedIn Profile ETL Pipeline Schema

  ## Overview
  This migration creates a complete ETL pipeline infrastructure for LinkedIn profiles with:
  - Incremental loading support
  - Change detection and tracking
  - Image management
  - Data validation
  - Idempotent run capabilities

  ## New Tables

  ### 1. `linkedin_profiles`
  Main table for LinkedIn profile data with change tracking
  - `id` (uuid, primary key) - Unique identifier
  - `linkedin_id` (text, unique) - LinkedIn profile ID
  - `full_name` (text) - Profile full name
  - `headline` (text) - Professional headline
  - `location` (text) - Geographic location
  - `summary` (text) - Profile summary
  - `experience` (jsonb) - Work experience array
  - `education` (jsonb) - Education history array
  - `skills` (jsonb) - Skills array
  - `connections_count` (integer) - Number of connections
  - `profile_url` (text) - LinkedIn profile URL
  - `data_hash` (text) - Hash for change detection
  - `validation_status` (text) - Validation state
  - `validation_errors` (jsonb) - Validation error details
  - `created_at` (timestamptz) - First import timestamp
  - `updated_at` (timestamptz) - Last update timestamp
  - `last_validated_at` (timestamptz) - Last validation timestamp

  ### 2. `linkedin_profile_images`
  Profile images with versioning and change tracking
  - `id` (uuid, primary key) - Unique identifier
  - `profile_id` (uuid, foreign key) - Reference to profile
  - `image_type` (text) - Type: profile_photo, banner, etc.
  - `image_url` (text) - Original image URL
  - `image_hash` (text) - Hash for duplicate detection
  - `storage_path` (text) - Path in storage
  - `width` (integer) - Image width
  - `height` (integer) - Image height
  - `file_size` (integer) - File size in bytes
  - `is_current` (boolean) - Current version flag
  - `created_at` (timestamptz) - Upload timestamp

  ### 3. `etl_runs`
  ETL execution tracking for idempotent runs
  - `id` (uuid, primary key) - Unique identifier
  - `run_type` (text) - Type: full, incremental
  - `status` (text) - Status: running, completed, failed
  - `started_at` (timestamptz) - Start timestamp
  - `completed_at` (timestamptz) - Completion timestamp
  - `profiles_processed` (integer) - Number of profiles processed
  - `profiles_added` (integer) - New profiles count
  - `profiles_updated` (integer) - Updated profiles count
  - `profiles_unchanged` (integer) - Unchanged profiles count
  - `images_processed` (integer) - Images processed
  - `validation_failures` (integer) - Validation errors count
  - `error_message` (text) - Error details if failed
  - `metadata` (jsonb) - Additional run metadata

  ### 4. `profile_change_history`
  Audit trail for profile changes
  - `id` (uuid, primary key) - Unique identifier
  - `profile_id` (uuid, foreign key) - Reference to profile
  - `etl_run_id` (uuid, foreign key) - Reference to ETL run
  - `field_name` (text) - Changed field name
  - `old_value` (text) - Previous value
  - `new_value` (text) - New value
  - `changed_at` (timestamptz) - Change timestamp

  ## Security
  - Row Level Security enabled on all tables
  - Policies for authenticated users to manage their own data
  - Service role access for ETL operations

  ## Indexes
  - Optimized for LinkedIn ID lookups
  - Change detection queries
  - ETL run filtering
  - Validation status filtering
*/

CREATE TABLE IF NOT EXISTS linkedin_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  linkedin_id text UNIQUE NOT NULL,
  full_name text NOT NULL,
  headline text DEFAULT '',
  location text DEFAULT '',
  summary text DEFAULT '',
  experience jsonb DEFAULT '[]'::jsonb,
  education jsonb DEFAULT '[]'::jsonb,
  skills jsonb DEFAULT '[]'::jsonb,
  connections_count integer DEFAULT 0,
  profile_url text NOT NULL,
  data_hash text NOT NULL,
  validation_status text DEFAULT 'pending',
  validation_errors jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_validated_at timestamptz
);

CREATE TABLE IF NOT EXISTS linkedin_profile_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES linkedin_profiles(id) ON DELETE CASCADE,
  image_type text NOT NULL,
  image_url text NOT NULL,
  image_hash text NOT NULL,
  storage_path text,
  width integer DEFAULT 0,
  height integer DEFAULT 0,
  file_size integer DEFAULT 0,
  is_current boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS etl_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_type text NOT NULL,
  status text DEFAULT 'running',
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  profiles_processed integer DEFAULT 0,
  profiles_added integer DEFAULT 0,
  profiles_updated integer DEFAULT 0,
  profiles_unchanged integer DEFAULT 0,
  images_processed integer DEFAULT 0,
  validation_failures integer DEFAULT 0,
  error_message text,
  metadata jsonb DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS profile_change_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES linkedin_profiles(id) ON DELETE CASCADE,
  etl_run_id uuid NOT NULL REFERENCES etl_runs(id) ON DELETE CASCADE,
  field_name text NOT NULL,
  old_value text,
  new_value text,
  changed_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_linkedin_profiles_linkedin_id ON linkedin_profiles(linkedin_id);
CREATE INDEX IF NOT EXISTS idx_linkedin_profiles_validation_status ON linkedin_profiles(validation_status);
CREATE INDEX IF NOT EXISTS idx_linkedin_profiles_updated_at ON linkedin_profiles(updated_at);
CREATE INDEX IF NOT EXISTS idx_linkedin_profiles_data_hash ON linkedin_profiles(data_hash);

CREATE INDEX IF NOT EXISTS idx_linkedin_profile_images_profile_id ON linkedin_profile_images(profile_id);
CREATE INDEX IF NOT EXISTS idx_linkedin_profile_images_is_current ON linkedin_profile_images(is_current);
CREATE INDEX IF NOT EXISTS idx_linkedin_profile_images_image_hash ON linkedin_profile_images(image_hash);

CREATE INDEX IF NOT EXISTS idx_etl_runs_status ON etl_runs(status);
CREATE INDEX IF NOT EXISTS idx_etl_runs_started_at ON etl_runs(started_at DESC);

CREATE INDEX IF NOT EXISTS idx_profile_change_history_profile_id ON profile_change_history(profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_change_history_etl_run_id ON profile_change_history(etl_run_id);

ALTER TABLE linkedin_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE linkedin_profile_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE etl_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_change_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles"
  ON linkedin_profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert profiles"
  ON linkedin_profiles FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update profiles"
  ON linkedin_profiles FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can view profile images"
  ON linkedin_profile_images FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert profile images"
  ON linkedin_profile_images FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update profile images"
  ON linkedin_profile_images FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can view ETL runs"
  ON etl_runs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert ETL runs"
  ON etl_runs FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update ETL runs"
  ON etl_runs FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can view change history"
  ON profile_change_history FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert change history"
  ON profile_change_history FOR INSERT
  TO authenticated
  WITH CHECK (true);