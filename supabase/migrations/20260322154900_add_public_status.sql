-- Migration to add public_status to projects

ALTER TABLE "public"."projects" 
ADD COLUMN IF NOT EXISTS "public_status" text NOT NULL DEFAULT 'Plánovaný';

-- Ensure all existing projects have 'Plánovaný' by default as handled by DEFAULT above.
-- Check constraint to ensure valid values
ALTER TABLE "public"."projects"
ADD CONSTRAINT "projects_public_status_check" 
CHECK ("public_status" IN ('Plánovaný', 'Staví se', 'Dokončený'));

-- Zajistíme automatickou aktualizaci sloupce updated_at při každém UPDATE
CREATE EXTENSION IF NOT EXISTS moddatetime SCHEMA extensions;

DROP TRIGGER IF EXISTS handle_projects_updated_at ON "public"."projects";
CREATE TRIGGER handle_projects_updated_at
BEFORE UPDATE ON "public"."projects"
FOR EACH ROW
EXECUTE PROCEDURE moddatetime (updated_at);
