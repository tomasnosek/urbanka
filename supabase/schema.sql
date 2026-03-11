-- =============================================
-- URBANKA — Database Schema (Supabase / PostgreSQL)
-- =============================================

-- 1. Municipalities (relational metadata)
CREATE TABLE municipalities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  emblem_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Projects (relational metadata + JSONB content)
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  municipality_id UUID REFERENCES municipalities(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  status TEXT CHECK (status IN ('draft', 'published', 'archived')) DEFAULT 'draft',
  is_featured BOOLEAN DEFAULT false,
  total_cost BIGINT DEFAULT 0,
  content JSONB NOT NULL DEFAULT '{}',
  source_pdf_url TEXT,
  ai_confidence BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  published_at TIMESTAMPTZ,
  UNIQUE(municipality_id, slug)
);

-- 3. Feedback
CREATE TABLE feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  name TEXT,
  email TEXT,
  message TEXT NOT NULL,
  category TEXT CHECK (category IN ('question', 'error', 'spam', 'toxic')),
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for fast routing queries
CREATE INDEX idx_municipalities_slug ON municipalities(slug);
CREATE INDEX idx_projects_municipality ON projects(municipality_id);
CREATE INDEX idx_projects_slug ON projects(municipality_id, slug);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_feedback_project ON feedback(project_id);

-- Row Level Security
ALTER TABLE municipalities ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Public read access for published content
CREATE POLICY "Public read municipalities"
  ON municipalities FOR SELECT
  USING (true);

CREATE POLICY "Public read published projects"
  ON projects FOR SELECT
  USING (status = 'published');

-- Admin full access (authenticated users)
CREATE POLICY "Admin all municipalities"
  ON municipalities FOR ALL
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admin all projects"
  ON projects FOR ALL
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admin read feedback"
  ON feedback FOR SELECT
  USING (auth.role() = 'authenticated');

-- Public can insert feedback
CREATE POLICY "Public insert feedback"
  ON feedback FOR INSERT
  WITH CHECK (true);

-- Auto-update updated_at on projects
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- RPC function for patching JSONB content at a specific path
CREATE OR REPLACE FUNCTION update_project_content(
  p_project_id UUID,
  p_path TEXT[],
  p_value JSONB
)
RETURNS VOID AS $$
BEGIN
  UPDATE projects
  SET content = jsonb_set(content, p_path, p_value, true)
  WHERE id = p_project_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
