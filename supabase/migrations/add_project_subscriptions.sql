-- Migration: add_project_subscriptions
-- Run this in the Supabase SQL Editor.

CREATE TABLE IF NOT EXISTS project_subscriptions (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id  uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    email       text NOT NULL,
    confirmed   boolean NOT NULL DEFAULT false,
    created_at  timestamptz NOT NULL DEFAULT now(),
    UNIQUE (project_id, email)
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_project_id
    ON project_subscriptions (project_id);
