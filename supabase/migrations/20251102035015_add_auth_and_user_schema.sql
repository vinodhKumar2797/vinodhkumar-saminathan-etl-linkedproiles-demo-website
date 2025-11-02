/*
  # Add User Management and Data Access Control

  ## Overview
  Add user-scoped data access with organization support and permissions

  ## New Tables

  ### 1. `user_profiles`
  User profile information
  - `id` (uuid, primary key) - User ID from auth.users
  - `email` (text) - User email
  - `full_name` (text) - Full name
  - `organization` (text) - Organization name
  - `created_at` (timestamptz) - Account creation date

  ### 2. `user_imports`
  Track data imports per user
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key) - User who performed import
  - `import_type` (text) - csv, json, api
  - `file_name` (text) - Original file name
  - `total_records` (integer) - Total records imported
  - `successful_records` (integer) - Successfully processed
  - `failed_records` (integer) - Failed records
  - `created_at` (timestamptz)

  ### 3. `linkedin_profiles` - Updated
  Add user ownership to existing table
  - `user_id` (uuid, foreign key) - Owner of the profile

  ## Changes
  - Link all linkedin_profiles to their owning user
  - Enable RLS policies for user-scoped data
*/

CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY,
  email text UNIQUE NOT NULL,
  full_name text DEFAULT '',
  organization text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_imports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  import_type text NOT NULL,
  file_name text,
  total_records integer DEFAULT 0,
  successful_records integer DEFAULT 0,
  failed_records integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'linkedin_profiles' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE linkedin_profiles ADD COLUMN user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE;
    CREATE INDEX idx_linkedin_profiles_user_id ON linkedin_profiles(user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'etl_runs' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE etl_runs ADD COLUMN user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE;
    CREATE INDEX idx_etl_runs_user_id ON etl_runs(user_id);
  END IF;
END $$;

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_imports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view own imports"
  ON user_imports FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own imports"
  ON user_imports FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can view all profiles" ON linkedin_profiles;
DROP POLICY IF EXISTS "Users can insert profiles" ON linkedin_profiles;
DROP POLICY IF EXISTS "Users can update profiles" ON linkedin_profiles;

CREATE POLICY "Users can view own profiles"
  ON linkedin_profiles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own profiles"
  ON linkedin_profiles FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own profiles"
  ON linkedin_profiles FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can view ETL runs" ON etl_runs;
DROP POLICY IF EXISTS "Users can insert ETL runs" ON etl_runs;
DROP POLICY IF EXISTS "Users can update ETL runs" ON etl_runs;

CREATE POLICY "Users can view own ETL runs"
  ON etl_runs FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert ETL runs"
  ON etl_runs FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own ETL runs"
  ON etl_runs FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can view profile images" ON linkedin_profile_images;
DROP POLICY IF EXISTS "Users can insert profile images" ON linkedin_profile_images;
DROP POLICY IF EXISTS "Users can update profile images" ON linkedin_profile_images;

CREATE POLICY "Users can view profile images of own profiles"
  ON linkedin_profile_images FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM linkedin_profiles
      WHERE linkedin_profile_images.profile_id = linkedin_profiles.id
      AND linkedin_profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert profile images for own profiles"
  ON linkedin_profile_images FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM linkedin_profiles
      WHERE linkedin_profile_images.profile_id = linkedin_profiles.id
      AND linkedin_profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update profile images of own profiles"
  ON linkedin_profile_images FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM linkedin_profiles
      WHERE linkedin_profile_images.profile_id = linkedin_profiles.id
      AND linkedin_profiles.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM linkedin_profiles
      WHERE linkedin_profile_images.profile_id = linkedin_profiles.id
      AND linkedin_profiles.user_id = auth.uid()
    )
  );
