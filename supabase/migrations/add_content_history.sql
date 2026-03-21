-- Migration: add_content_history
-- Run this in the Supabase SQL Editor once.

CREATE TABLE IF NOT EXISTS content_history (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id  uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    content     jsonb NOT NULL,
    changed_path text,
    created_at  timestamptz NOT NULL DEFAULT now()
);

-- Index for fast lookup of a project's history
CREATE INDEX IF NOT EXISTS idx_content_history_project_id
    ON content_history (project_id, created_at DESC);

-- Optional: auto-purge keeping only last 50 snapshots per project
-- (uncomment to enable, otherwise you manage retention manually)
-- CREATE OR REPLACE FUNCTION prune_content_history() RETURNS trigger AS $$
-- BEGIN
--   DELETE FROM content_history
--   WHERE project_id = NEW.project_id
--     AND id NOT IN (
--       SELECT id FROM content_history
--       WHERE project_id = NEW.project_id
--       ORDER BY created_at DESC
--       LIMIT 50
--     );
--   RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql;

-- CREATE TRIGGER trg_prune_content_history
--   AFTER INSERT ON content_history
--   FOR EACH ROW EXECUTE FUNCTION prune_content_history();
