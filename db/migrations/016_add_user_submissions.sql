-- ============================================
-- MIGRATION: User Submissions (Issue Reports & Feature Requests)
-- Version: 016
-- Date: 2024-03-08
-- Purpose: Store user feedback, bug reports, and feature requests
-- ============================================

-- Create update_updated_at_column function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create requesting_user_id function if it doesn't exist
-- This function extracts the Clerk user ID from JWT
CREATE OR REPLACE FUNCTION requesting_user_id()
RETURNS TEXT AS $$
BEGIN
    RETURN NULLIF(
        current_setting('request.jwt.claims', true)::json->>'sub',
        ''
    )::TEXT;
EXCEPTION
    WHEN OTHERS THEN RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION requesting_user_id() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION update_updated_at_column() TO anon, authenticated;

-- Create user_submissions table
CREATE TABLE IF NOT EXISTS user_submissions (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('issue', 'feature_request')),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    route TEXT,
    severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    category TEXT,
    diagnostics_json JSONB,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    admin_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE user_submissions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Users can view own submissions" ON user_submissions;
DROP POLICY IF EXISTS "Users can create own submissions" ON user_submissions;
DROP POLICY IF EXISTS "Users can update own open submissions" ON user_submissions;

-- Create RLS policies
-- Users can view their own submissions
CREATE POLICY "Users can view own submissions" ON user_submissions
    FOR SELECT
    TO authenticated
    USING (requesting_user_id() = user_id);

-- Users can create their own submissions
CREATE POLICY "Users can create own submissions" ON user_submissions
    FOR INSERT
    TO authenticated
    WITH CHECK (requesting_user_id() = user_id);

-- Users can update their own submissions (only if still open)
CREATE POLICY "Users can update own open submissions" ON user_submissions
    FOR UPDATE
    TO authenticated
    USING (requesting_user_id() = user_id AND status = 'open');

-- Drop existing trigger if exists (for idempotency)
DROP TRIGGER IF EXISTS update_user_submissions_updated_at ON user_submissions;

-- Create updated_at trigger
CREATE TRIGGER update_user_submissions_updated_at
    BEFORE UPDATE ON user_submissions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_user_submissions_user_id ON user_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_submissions_type ON user_submissions(type);
CREATE INDEX IF NOT EXISTS idx_user_submissions_status ON user_submissions(status);
CREATE INDEX IF NOT EXISTS idx_user_submissions_created_at ON user_submissions(created_at DESC);

-- Grant permissions
GRANT ALL ON user_submissions TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE user_submissions_id_seq TO anon, authenticated;

-- Add comment for documentation
COMMENT ON TABLE user_submissions IS 'Stores user bug reports and feature requests';

-- ============================================
-- VERIFICATION
-- ============================================
DO $$
BEGIN
    RAISE NOTICE '✅ User submissions table created successfully';
END $$;
