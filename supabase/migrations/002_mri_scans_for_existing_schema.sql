-- =====================================================
-- MRI Scans System - FOR EXISTING SCHEMA
-- =====================================================
-- This migration adds MRI upload support to your existing
-- patients/doctors/doctor_records tables.
-- Does NOT modify existing tables (safe to run).
-- =====================================================

-- =====================================================
-- 1. ADD MISSING COLUMNS TO EXISTING TABLES
-- =====================================================

-- Add mri_scan_id to doctor_records (for linking MRI summaries)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'doctor_records' AND column_name = 'mri_scan_id'
    ) THEN
        ALTER TABLE doctor_records ADD COLUMN mri_scan_id UUID;
    END IF;
END $$;

-- Add content column to doctor_records (for structured text)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'doctor_records' AND column_name = 'content'
    ) THEN
        ALTER TABLE doctor_records ADD COLUMN content TEXT;
    END IF;
END $$;

-- Add metadata column to doctor_records (for JSON data)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'doctor_records' AND column_name = 'metadata'
    ) THEN
        ALTER TABLE doctor_records ADD COLUMN metadata JSONB;
    END IF;
END $$;

-- =====================================================
-- 2. MRI SCANS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS mri_scans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Foreign keys to your existing tables
    patient_id UUID NOT NULL REFERENCES patients(patient_id) ON DELETE CASCADE,
    uploaded_by UUID REFERENCES doctors(doctor_id) ON DELETE SET NULL,

    -- Optional session linkage
    session_id UUID REFERENCES sessions(session_id) ON DELETE SET NULL,

    -- File metadata
    original_filename TEXT NOT NULL,
    storage_path TEXT NOT NULL,  -- Vercel Blob URL
    file_size_bytes BIGINT,
    mime_type TEXT,

    -- Processing status
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),

    -- AI Analysis results (AssemblyNet output)
    analysis JSONB,
    -- Expected structure:
    -- {
    --   "job_id": "ec2-job-123",
    --   "model": "AssemblyNet-1.0.0",
    --   "patient_age": 50,
    --   "patient_sex": "Male",
    --   "volumetric_data": {
    --     "hippocampus": {"volume_mm3": 7200, "normalized": 0.0048},
    --     "ventricles": {"volume_mm3": 54000, "normalized": 0.036}
    --   },
    --   "findings": ["Finding 1", "Finding 2"],
    --   "pdf_report_url": "http://...",
    --   "csv_report_url": "http://..."
    -- }

    -- Error tracking
    error_message TEXT,
    retry_count INT DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ
);

-- Add foreign key constraint for mri_scan_id in doctor_records
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'doctor_records_mri_scan_id_fkey'
    ) THEN
        ALTER TABLE doctor_records
        ADD CONSTRAINT doctor_records_mri_scan_id_fkey
        FOREIGN KEY (mri_scan_id) REFERENCES mri_scans(id) ON DELETE SET NULL;
    END IF;
END $$;

-- =====================================================
-- 3. INDEXES FOR PERFORMANCE
-- =====================================================

-- MRI scans indexes
CREATE INDEX IF NOT EXISTS idx_mri_scans_patient_id ON mri_scans(patient_id);
CREATE INDEX IF NOT EXISTS idx_mri_scans_uploaded_by ON mri_scans(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_mri_scans_status ON mri_scans(status);
CREATE INDEX IF NOT EXISTS idx_mri_scans_session_id ON mri_scans(session_id) WHERE session_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_mri_scans_created_at ON mri_scans(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mri_scans_status_created ON mri_scans(status, created_at DESC);

-- GIN index for JSONB analysis field
CREATE INDEX IF NOT EXISTS idx_mri_scans_analysis_gin ON mri_scans USING GIN (analysis);

-- Doctor records index for MRI scans
CREATE INDEX IF NOT EXISTS idx_doctor_records_mri_scan_id ON doctor_records(mri_scan_id) WHERE mri_scan_id IS NOT NULL;

-- =====================================================
-- 4. UPDATED_AT TRIGGER FOR MRI_SCANS
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_mri_scans_updated_at ON mri_scans;
CREATE TRIGGER update_mri_scans_updated_at
    BEFORE UPDATE ON mri_scans
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 5. HELPER VIEWS
-- =====================================================

-- View: Recent MRI scans with patient info
CREATE OR REPLACE VIEW recent_mri_scans AS
SELECT
    ms.id,
    ms.patient_id,
    p.name AS patient_name,
    p.dob AS patient_dob,
    ms.uploaded_by,
    d.name AS doctor_name,
    ms.original_filename,
    ms.status,
    ms.created_at,
    ms.processed_at,
    ms.session_id,
    (ms.analysis->>'job_id') AS job_id,
    (ms.analysis->'volumetric_data') AS volumetric_data
FROM mri_scans ms
LEFT JOIN patients p ON ms.patient_id = p.patient_id
LEFT JOIN doctors d ON ms.uploaded_by = d.doctor_id
ORDER BY ms.created_at DESC;

-- View: Pending scans for processing
CREATE OR REPLACE VIEW pending_mri_scans AS
SELECT
    ms.id,
    ms.patient_id,
    ms.storage_path,
    ms.original_filename,
    ms.created_at,
    ms.retry_count,
    p.name AS patient_name,
    p.dob,
    p.sex
FROM mri_scans ms
LEFT JOIN patients p ON ms.patient_id = p.patient_id
WHERE ms.status = 'pending'
ORDER BY ms.created_at ASC;

-- =====================================================
-- 6. SEED DEMO DOCTOR (if needed)
-- =====================================================

-- Insert demo doctor only if no doctors exist
INSERT INTO doctors (doctor_id, name, email, specialization)
SELECT
    'a0000000-0000-0000-0000-000000000001'::UUID,
    'Dr. Demo Radiologist',
    'demo.doctor@mindmade.ai',
    'Radiology & Neurology'
WHERE NOT EXISTS (SELECT 1 FROM doctors LIMIT 1);

-- =====================================================
-- 7. VERIFICATION QUERY (run manually)
-- =====================================================

-- Check that everything was created:
-- SELECT
--   tablename,
--   schemaname
-- FROM pg_tables
-- WHERE tablename IN ('mri_scans', 'doctor_records', 'patients', 'doctors')
-- ORDER BY tablename;
--
-- SELECT column_name, data_type
-- FROM information_schema.columns
-- WHERE table_name = 'doctor_records'
-- ORDER BY ordinal_position;

-- =====================================================
-- END OF MIGRATION
-- =====================================================
