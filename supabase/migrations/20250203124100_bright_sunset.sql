/*
  # Initial Schema for Job Tracker Application

  1. New Tables
    - users
      - id (uuid, primary key)
      - email (text)
      - full_name (text)
      - created_at (timestamp)
      
    - job_applications
      - id (uuid, primary key)
      - user_id (uuid, foreign key)
      - company (text)
      - job_title (text)
      - status (enum)
      - application_date (date)
      - job_description (text)
      - job_url (text)
      - salary_min (numeric)
      - salary_max (numeric)
      - notes (text)
      - contact_name (text)
      - contact_email (text)
      - contact_phone (text)
      - created_at (timestamp)
      - updated_at (timestamp)
      
    - resumes
      - id (uuid, primary key)
      - user_id (uuid, foreign key)
      - title (text)
      - content (jsonb)
      - created_at (timestamp)
      - updated_at (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
*/

-- Create custom types
CREATE TYPE application_status AS ENUM (
  'saved',
  'applied',
  'interviewing',
  'offered',
  'rejected',
  'accepted',
  'declined'
);

-- Create tables
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT auth.uid(),
  email text UNIQUE NOT NULL,
  full_name text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS job_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  company text NOT NULL,
  job_title text NOT NULL,
  status application_status DEFAULT 'saved',
  application_date date,
  job_description text,
  job_url text,
  salary_min numeric,
  salary_max numeric,
  notes text,
  contact_name text,
  contact_email text,
  contact_phone text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS resumes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  content jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE resumes ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow insert for authenticated users"
ON users FOR INSERT
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can view own job applications"
  ON job_applications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own job applications"
  ON job_applications FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own job applications"
  ON job_applications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own job applications"
  ON job_applications FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own resumes"
  ON resumes FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own resumes"
  ON resumes FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes
CREATE INDEX job_applications_user_id_idx ON job_applications(user_id);
CREATE INDEX job_applications_status_idx ON job_applications(status);
CREATE INDEX resumes_user_id_idx ON resumes(user_id);