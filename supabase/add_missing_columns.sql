-- This migration adds the missing columns for the steel-catalog integration and project settings

-- Add missing columns to the stock table
ALTER TABLE stock ADD COLUMN IF NOT EXISTS profile_id TEXT;
ALTER TABLE stock ADD COLUMN IF NOT EXISTS price_per_meter NUMERIC(10, 2) DEFAULT 0;

-- Add missing columns to the projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS settings_json JSONB;
