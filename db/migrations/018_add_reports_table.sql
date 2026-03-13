-- Migration: Add reports table for saved financial report snapshots
-- Purpose: Store generated financial reports as immutable snapshots
-- Note: Uses JSONB for flexible snapshot storage

-- Create the reports table
CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    report_type TEXT NOT NULL DEFAULT 'financial_summary',
    status TEXT NOT NULL DEFAULT 'pending',
    period_type TEXT NOT NULL DEFAULT 'month',
    date_from DATE NOT NULL,
    date_to DATE NOT NULL,
    filters_json JSONB DEFAULT '{}',
    summary_json JSONB NOT NULL DEFAULT '{}',
    snapshot_json JSONB NOT NULL DEFAULT '{}',
    insights_json JSONB DEFAULT '[]',
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_exported_at TIMESTAMP WITH TIME ZONE,
    export_count INTEGER DEFAULT 0,
    
    -- Constraints
    CONSTRAINT valid_report_type CHECK (report_type IN ('financial_summary')),
    CONSTRAINT valid_status CHECK (status IN ('pending', 'completed', 'failed')),
    CONSTRAINT valid_period_type CHECK (period_type IN ('month', 'quarter', 'year', 'custom'))
);

-- Indexes for efficient querying
CREATE INDEX idx_reports_user_id ON reports(user_id);
CREATE INDEX idx_reports_user_created ON reports(user_id, created_at DESC);
CREATE INDEX idx_reports_user_status ON reports(user_id, status);
CREATE INDEX idx_reports_user_type ON reports(user_id, report_type);

-- Enable RLS
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own reports" 
    ON reports 
    FOR SELECT 
    USING (user_id = auth.uid()::text);

CREATE POLICY "Users can insert own reports" 
    ON reports 
    FOR INSERT 
    WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Users can update own reports" 
    ON reports 
    FOR UPDATE 
    USING (user_id = auth.uid()::text)
    WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Users can delete own reports" 
    ON reports 
    FOR DELETE 
    USING (user_id = auth.uid()::text);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS tr_update_reports_updated_at ON reports;
CREATE TRIGGER tr_update_reports_updated_at
    BEFORE UPDATE ON reports
    FOR EACH ROW
    EXECUTE FUNCTION update_reports_updated_at();

-- Grant permissions
GRANT ALL ON reports TO anon, authenticated;

-- Comments
COMMENT ON TABLE reports IS 'Stores saved financial report snapshots per user. user_id must be TEXT for Clerk compatibility.';
COMMENT ON COLUMN reports.snapshot_json IS 'Full rendered report data as immutable snapshot';
COMMENT ON COLUMN reports.summary_json IS 'Top-level KPIs for quick access';
COMMENT ON COLUMN reports.filters_json IS 'Selected filters (period, accounts, etc.) used to generate report';
COMMENT ON COLUMN reports.insights_json IS 'Generated plain-English insights';

-- Verify setup
SELECT 
    'Reports table created successfully' as status,
    (SELECT data_type FROM information_schema.columns WHERE table_name = 'reports' AND column_name = 'user_id') as user_id_type,
    (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'reports') as policy_count;
