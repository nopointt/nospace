-- Harkly Database Schema for Supabase
-- Phase 1: Database Setup

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PROFILES TABLE (extends auth.users)
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Trigger for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name');
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ============================================
-- PROJECTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS projects (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    source_type TEXT CHECK (source_type IN ('otzovik', 'irecomend', 'other')),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted')),
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_status ON projects(status);

-- Enable RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own projects" ON projects
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create projects" ON projects
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects" ON projects
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects" ON projects
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- SCRAPING JOBS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS scraping_jobs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
    url TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
    max_pages INTEGER DEFAULT 50,
    proxy_settings JSONB DEFAULT NULL,
    
    -- Progress tracking
    progress JSONB DEFAULT '{"current": 0, "total": 0, "percentage": 0}'::jsonb,
    
    -- Statistics
    total_reviews INTEGER DEFAULT 0,
    parsed_reviews INTEGER DEFAULT 0,
    
    -- Error handling
    error_message TEXT,
    error_details JSONB,
    
    -- Timing
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Metadata
    metadata JSONB DEFAULT '{}'
);

-- Indexes
CREATE INDEX idx_jobs_project_id ON scraping_jobs(project_id);
CREATE INDEX idx_jobs_status ON scraping_jobs(status);
CREATE INDEX idx_jobs_created_at ON scraping_jobs(created_at DESC);

-- Enable RLS
ALTER TABLE scraping_jobs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view jobs in own projects" ON scraping_jobs
    FOR SELECT USING (
        auth.uid() IN (
            SELECT user_id FROM projects WHERE id = scraping_jobs.project_id
        )
    );

CREATE POLICY "Users can create jobs in own projects" ON scraping_jobs
    FOR INSERT WITH CHECK (
        auth.uid() IN (
            SELECT user_id FROM projects WHERE id = scraping_jobs.project_id
        )
    );

CREATE POLICY "Users can update jobs in own projects" ON scraping_jobs
    FOR UPDATE USING (
        auth.uid() IN (
            SELECT user_id FROM projects WHERE id = scraping_jobs.project_id
        )
    );

CREATE POLICY "Users can delete jobs in own projects" ON scraping_jobs
    FOR DELETE USING (
        auth.uid() IN (
            SELECT user_id FROM projects WHERE id = scraping_jobs.project_id
        )
    );

-- ============================================
-- REVIEWS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS reviews (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    job_id UUID REFERENCES scraping_jobs(id) ON DELETE CASCADE NOT NULL,
    
    -- Source info
    source TEXT NOT NULL CHECK (source IN ('otzovik', 'irecomend', 'other')),
    external_id TEXT,
    source_url TEXT,
    
    -- Review content
    title TEXT,
    text TEXT NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    
    -- Author info
    author TEXT,
    author_id TEXT,
    
    -- Dates
    review_date TIMESTAMPTZ,
    scraped_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    -- Processing status
    processed BOOLEAN DEFAULT FALSE,
    processed_at TIMESTAMPTZ,
    
    -- Search vector for full-text search
    search_vector TSVECTOR
);

-- Indexes
CREATE INDEX idx_reviews_job_id ON reviews(job_id);
CREATE INDEX idx_reviews_source ON reviews(source);
CREATE INDEX idx_reviews_rating ON reviews(rating);
CREATE INDEX idx_reviews_search ON reviews USING GIN(search_vector);
CREATE INDEX idx_reviews_scraped_at ON reviews(scraped_at DESC);

-- Enable RLS
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view reviews in own projects" ON reviews
    FOR SELECT USING (
        auth.uid() IN (
            SELECT p.user_id 
            FROM projects p
            JOIN scraping_jobs j ON p.id = j.project_id
            WHERE j.id = reviews.job_id
        )
    );

-- Function to generate search vector
CREATE OR REPLACE FUNCTION update_review_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := 
        setweight(to_tsvector('russian', COALESCE(NEW.title, '')), 'A') ||
        setweight(to_tsvector('russian', COALESCE(NEW.text, '')), 'B') ||
        setweight(to_tsvector('russian', COALESCE(NEW.author, '')), 'C');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for search vector
DROP TRIGGER IF EXISTS update_review_search ON reviews;
CREATE TRIGGER update_review_search
    BEFORE INSERT OR UPDATE ON reviews
    FOR EACH ROW EXECUTE FUNCTION update_review_search_vector();

-- ============================================
-- PROXY SETTINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS proxy_settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    proxy_type TEXT DEFAULT 'http' CHECK (proxy_type IN ('http', 'https', 'socks4', 'socks5')),
    host TEXT NOT NULL,
    port INTEGER NOT NULL,
    username TEXT,
    password TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    last_used_at TIMESTAMPTZ,
    success_count INTEGER DEFAULT 0,
    fail_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_proxies_user_id ON proxy_settings(user_id);
CREATE INDEX idx_proxies_active ON proxy_settings(is_active);

-- Enable RLS
ALTER TABLE proxy_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage own proxies" ON proxy_settings
    FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON scraping_jobs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_proxies_updated_at BEFORE UPDATE ON proxy_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update job statistics
CREATE OR REPLACE FUNCTION update_job_stats()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE scraping_jobs
    SET 
        parsed_reviews = (
            SELECT COUNT(*) FROM reviews WHERE job_id = NEW.job_id
        ),
        updated_at = NOW()
    WHERE id = NEW.job_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_job_stats_after_insert
    AFTER INSERT ON reviews
    FOR EACH ROW EXECUTE FUNCTION update_job_stats();

-- ============================================
-- VIEWS
-- ============================================

-- View for job statistics
CREATE OR REPLACE VIEW job_stats AS
SELECT 
    j.id as job_id,
    j.project_id,
    j.status,
    j.url,
    j.max_pages,
    j.total_reviews,
    j.parsed_reviews,
    j.created_at,
    j.started_at,
    j.completed_at,
    CASE 
        WHEN j.completed_at IS NOT NULL AND j.started_at IS NOT NULL 
        THEN EXTRACT(EPOCH FROM (j.completed_at - j.started_at))
        ELSE NULL 
    END as duration_seconds,
    COUNT(r.id) as actual_reviews_count
FROM scraping_jobs j
LEFT JOIN reviews r ON j.id = r.job_id
GROUP BY j.id;

-- ============================================
-- SAMPLE DATA (for testing)
-- ============================================

-- Note: Uncomment to insert test data
-- INSERT INTO projects (user_id, name, description, source_type)
-- VALUES (
--     'YOUR_USER_ID_HERE',
--     'Test Project',
--     'Project for testing scraping',
--     'otzovik'
-- );

-- Enable Realtime
ALTER TABLE scraping_jobs REPLICA IDENTITY FULL;
ALTER TABLE reviews REPLICA IDENTITY FULL;

-- Comment explaining schema
COMMENT ON TABLE projects IS 'User projects for organizing scraping jobs';
COMMENT ON TABLE scraping_jobs IS 'Scraping tasks with progress tracking';
COMMENT ON TABLE reviews IS 'Parsed reviews from various sources';
COMMENT ON TABLE proxy_settings IS 'User proxy configurations for scraping';
