-- Create custom types if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'application_status') THEN
        CREATE TYPE application_status AS ENUM (
            'saved',
            'applied',
            'interviewing',
            'offered',
            'rejected',
            'accepted',
            'declined'
        );
    END IF;
END $$;

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
  application_date text NOT NULL,
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
  profile_title text NOT NULL,
  resume_description text,
  resume_url text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE resumes ENABLE ROW LEVEL SECURITY;

-- Create policies
DO $$ 
BEGIN
    -- Users policies
    DROP POLICY IF EXISTS "Users can view own profile" ON users;
    DROP POLICY IF EXISTS "Users can update own profile" ON users;
    
    -- Job Applications policies
    DROP POLICY IF EXISTS "Users can view own job applications" ON job_applications;
    DROP POLICY IF EXISTS "Users can create own job applications" ON job_applications;
    DROP POLICY IF EXISTS "Users can update own job applications" ON job_applications;
    DROP POLICY IF EXISTS "Users can delete own job applications" ON job_applications;
    
    -- Resumes policies
    DROP POLICY IF EXISTS "Users can view own resumes" ON resumes;
    DROP POLICY IF EXISTS "Users can create own resumes" ON resumes;
    DROP POLICY IF EXISTS "Users can update own resumes" ON resumes;
    DROP POLICY IF EXISTS "Users can delete own resumes" ON resumes;
END $$;

-- Create new policies
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

-- Job Applications Policies
CREATE POLICY "Users can view own job applications"
    ON job_applications FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Users can create own job applications"
    ON job_applications FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own job applications"
    ON job_applications FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Users can delete own job applications"
    ON job_applications FOR DELETE
    TO authenticated
    USING (user_id = auth.uid());

-- Resume Policies
CREATE POLICY "Users can view own resumes"
    ON resumes FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Users can create own resumes"
    ON resumes FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own resumes"
    ON resumes FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Users can delete own resumes"
    ON resumes FOR DELETE
    TO authenticated
    USING (user_id = auth.uid());

-- Create indexes
DROP INDEX IF EXISTS job_applications_user_id_idx;
DROP INDEX IF EXISTS job_applications_status_idx;
DROP INDEX IF EXISTS resumes_user_id_idx;

CREATE INDEX job_applications_user_id_idx ON job_applications(user_id);
CREATE INDEX job_applications_status_idx ON job_applications(status);
CREATE INDEX resumes_user_id_idx ON resumes(user_id);

-- Create function to set updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_job_applications_updated_at ON job_applications;
DROP TRIGGER IF EXISTS update_resumes_updated_at ON resumes;

CREATE TRIGGER update_job_applications_updated_at
    BEFORE UPDATE ON job_applications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_resumes_updated_at
    BEFORE UPDATE ON resumes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();