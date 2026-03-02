-- Enable pgcrypto for UUID generation
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Create Projects Table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  requests_json JSONB,
  result_json JSONB,
  settings_json JSONB
);

-- 2. Create Stock Table
CREATE TABLE IF NOT EXISTS stock (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  material TEXT NOT NULL,
  profile_id TEXT,
  length INTEGER NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  weight_kg_m NUMERIC(10, 2) DEFAULT 0,
  price_per_meter NUMERIC(10, 2) DEFAULT 0,
  is_scrap BOOLEAN DEFAULT false,
  origin_project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Note: We are using JSONB in the 'projects' table to store the complex array of 'requests' 
-- and the deeply nested 'OptimizationResult' object to speed up this initial migration. 

-- 3. Fix Row-Level Security (RLS) if you accidentally enabled it and blocked yourself:
-- We will disable it for now so your app can save records normally.
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE stock DISABLE ROW LEVEL SECURITY;