-- Migration: fix_slugs (v2 — uses unaccent extension)
-- unaccent is available in Supabase by default and handles all Czech diacritics.
-- Run in Supabase SQL Editor.

CREATE EXTENSION IF NOT EXISTS unaccent;

-- Helper: generate clean slug from any text
CREATE OR REPLACE FUNCTION _tmp_to_slug(text) RETURNS text AS $$
    SELECT regexp_replace(
        lower(unaccent($1)),
        '[^a-z0-9]+', '-', 'g'
    );
$$ LANGUAGE SQL IMMUTABLE;

-- ─── 1. Municipality slugs ───────────────────────────────────────────────────
UPDATE municipalities
SET slug = _tmp_to_slug(name)
    || CASE
        WHEN postal_code IS NOT NULL AND postal_code != ''
        THEN '-' || replace(postal_code, ' ', '')
        ELSE ''
    END;

-- ─── 2. Project slugs — row-by-row to avoid unique constraint violations ─────
DO $$
DECLARE
    r RECORD;
    base_slug TEXT;
    candidate TEXT;
    counter INT;
BEGIN
    FOR r IN
        SELECT id, municipality_id, title
        FROM projects
        ORDER BY created_at ASC
    LOOP
        base_slug := regexp_replace(lower(unaccent(r.title)), '[^a-z0-9]+', '-', 'g');
        base_slug := trim(both '-' from base_slug);

        candidate := base_slug;
        counter := 2;

        WHILE EXISTS (
            SELECT 1 FROM projects
            WHERE municipality_id = r.municipality_id
              AND slug = candidate
              AND id != r.id
        ) LOOP
            candidate := base_slug || '-' || counter;
            counter := counter + 1;
        END LOOP;

        UPDATE projects SET slug = candidate WHERE id = r.id;
    END LOOP;
END $$;

-- Cleanup temp function
DROP FUNCTION IF EXISTS _tmp_to_slug(text);
