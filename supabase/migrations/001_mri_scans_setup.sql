-- =====================================================
-- MRI Scans System - Database Setup
-- =====================================================
-- This migration creates tables for storing MRI metadata,
-- analysis results, and chat session associations.
-- Storage is handled by Vercel Blob (external to Supabase).
-- =====================================================

-- =====================================================
-- 1. CORE TABLES (assuming patients + doctors exist)
-- =====================================================

-- Create doctors table if it doesn't exist (demo purposes)
CREATE TABLE IF NOT EXISTS doctors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    specialization TEXT,
    license_number TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create patients table if it doesn't exist (demo purposes)
CREATE TABLE IF NOT EXISTS patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT,
    full_name TEXT NOT NULL,
    date_of_birth DATE,
    sex TEXT CHECK (sex IN ('Male', 'Female', 'Other')) DEFAULT 'Male',
    medical_record_number TEXT UNIQUE,
    primary_doctor_id UUID REFERENCES doctors(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add sex column if table already exists (migration safety)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'patients' AND column_name = 'sex'
    ) THEN
        ALTER TABLE patients ADD COLUMN sex TEXT CHECK (sex IN ('Male', 'Female', 'Other')) DEFAULT 'Male';
    END IF;
END $$;

-- =====================================================
-- 2. MRI SCANS TABLE (main metadata storage)
-- =====================================================
CREATE TABLE IF NOT EXISTS mri_scans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Foreign keys
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    uploaded_by UUID REFERENCES doctors(id) ON DELETE SET NULL,

    -- Optional chat session linkage for context
    session_id TEXT,  -- e.g., chat thread ID from your chatbot

    -- File metadata
    original_filename TEXT NOT NULL,
    storage_path TEXT NOT NULL,  -- Vercel Blob URL (e.g., https://xxx.public.blob.vercel-storage.com/...)
    file_size_bytes BIGINT,
    mime_type TEXT,

    -- Processing status
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),

    -- AI Analysis results (JSONB for flexibility)
    analysis JSONB,
    -- Example structure:
    -- {
    --   "model": "mri_analysis_v1",
    --   "findings": ["...", "..."],
    --   "regions": {
    --     "hippocampus": {"volume": 4200, "score": 0.87},
    --     "prefrontalCortex": {"volume": 12000, "score": 0.92}
    --   },
    --   "severity": "mild|moderate|severe",
    --   "summary": "AI-generated clinical summary..."
    -- }

    -- Error tracking
    error_message TEXT,
    retry_count INT DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ
);

-- =====================================================
-- 3. DOCTOR RECORDS (clinical notes referencing MRIs)
-- =====================================================
CREATE TABLE IF NOT EXISTS doctor_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES doctors(id) ON DELETE SET NULL,

    -- Reference to MRI scan (optional)
    mri_scan_id UUID REFERENCES mri_scans(id) ON DELETE SET NULL,

    -- Record type (manual note, AI summary, etc.)
    record_type TEXT NOT NULL CHECK (record_type IN ('manual_note', 'mri_summary', 'chat_summary', 'diagnosis')),

    -- Actual content
    content TEXT NOT NULL,
    metadata JSONB,  -- Additional structured data

    -- Optional session linkage
    session_id TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 4. CHAT SESSIONS (optional - track chat threads)
-- =====================================================
-- Stores chat session metadata for linking MRIs to conversations
CREATE TABLE IF NOT EXISTS chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT UNIQUE NOT NULL,  -- Frontend-generated or backend UUID

    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES doctors(id) ON DELETE SET NULL,

    -- Session metadata
    title TEXT,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    last_message_at TIMESTAMPTZ DEFAULT NOW(),
    message_count INT DEFAULT 0,

    -- Linked resources
    mri_scan_ids UUID[] DEFAULT '{}',  -- Array of linked MRI scan IDs

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 5. INDEXES FOR PERFORMANCE
-- =====================================================

-- MRI scans indexes
CREATE INDEX IF NOT EXISTS idx_mri_scans_patient_id ON mri_scans(patient_id);
CREATE INDEX IF NOT EXISTS idx_mri_scans_uploaded_by ON mri_scans(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_mri_scans_status ON mri_scans(status);
CREATE INDEX IF NOT EXISTS idx_mri_scans_session_id ON mri_scans(session_id) WHERE session_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_mri_scans_created_at ON mri_scans(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mri_scans_status_created ON mri_scans(status, created_at DESC);

-- Doctor records indexes
CREATE INDEX IF NOT EXISTS idx_doctor_records_patient_id ON doctor_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_doctor_records_mri_scan_id ON doctor_records(mri_scan_id) WHERE mri_scan_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_doctor_records_session_id ON doctor_records(session_id) WHERE session_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_doctor_records_created_at ON doctor_records(created_at DESC);

-- Chat sessions indexes
CREATE INDEX IF NOT EXISTS idx_chat_sessions_patient_id ON chat_sessions(patient_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_session_id ON chat_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_last_message ON chat_sessions(last_message_at DESC);

-- GIN index for JSONB analysis field (fast lookups in analysis data)
CREATE INDEX IF NOT EXISTS idx_mri_scans_analysis_gin ON mri_scans USING GIN (analysis);

-- =====================================================
-- 6. UPDATED_AT TRIGGERS (auto-update timestamps)
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

DROP TRIGGER IF EXISTS update_doctor_records_updated_at ON doctor_records;
CREATE TRIGGER update_doctor_records_updated_at
    BEFORE UPDATE ON doctor_records
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_chat_sessions_updated_at ON chat_sessions;
CREATE TRIGGER update_chat_sessions_updated_at
    BEFORE UPDATE ON chat_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_patients_updated_at ON patients;
CREATE TRIGGER update_patients_updated_at
    BEFORE UPDATE ON patients
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_doctors_updated_at ON doctors;
CREATE TRIGGER update_doctors_updated_at
    BEFORE UPDATE ON doctors
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 7. ROW LEVEL SECURITY (RLS) - Optional but recommended
-- =====================================================
-- For production, enable RLS and create policies based on your auth setup
-- Commented out for now - enable when you have auth:

-- ALTER TABLE mri_scans ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE doctor_records ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;

-- Example policy (doctors can see their own patients' data):
-- CREATE POLICY "Doctors see own patients" ON mri_scans
--   FOR SELECT
--   USING (
--     uploaded_by = auth.uid()
--     OR patient_id IN (
--       SELECT id FROM patients WHERE primary_doctor_id = auth.uid()
--     )
--   );

-- =====================================================
-- 8. SEED DEMO DOCTOR (for MVP testing)
-- =====================================================
-- This creates a demo doctor if MRI_DEMO_DOCTOR_ID is not set

INSERT INTO doctors (id, email, full_name, specialization, license_number)
VALUES (
    'a0000000-0000-0000-0000-000000000001'::UUID,
    'demo.doctor@mindmade.ai',
    'Dr. Demo Radiologist',
    'Radiology & Neurology',
    'DEMO-RAD-001'
)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 9. HELPER VIEWS (optional - convenient queries)
-- =====================================================

-- View: Recent MRI scans with patient info
CREATE OR REPLACE VIEW recent_mri_scans AS
SELECT
    ms.id,
    ms.patient_id,
    p.full_name AS patient_name,
    p.medical_record_number,
    ms.uploaded_by,
    d.full_name AS doctor_name,
    ms.original_filename,
    ms.status,
    ms.created_at,
    ms.processed_at,
    ms.session_id,
    (ms.analysis->>'summary') AS analysis_summary
FROM mri_scans ms
LEFT JOIN patients p ON ms.patient_id = p.id
LEFT JOIN doctors d ON ms.uploaded_by = d.id
ORDER BY ms.created_at DESC;

-- View: Pending scans for processing
CREATE OR REPLACE VIEW pending_mri_scans AS
SELECT
    ms.id,
    ms.patient_id,
    ms.storage_path,
    ms.original_filename,
    ms.created_at,
    ms.retry_count
FROM mri_scans ms
WHERE ms.status = 'pending'
ORDER BY ms.created_at ASC;

-- =====================================================
-- END OF MIGRATION
-- =====================================================

-- Quick verification query (run manually to check setup):
-- SELECT
--   tablename,
--   schemaname
-- FROM pg_tables
-- WHERE tablename IN ('mri_scans', 'doctor_records', 'chat_sessions', 'patients', 'doctors')
-- ORDER BY tablename;
