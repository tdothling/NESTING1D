-- Enable pgcrypto for UUID generation
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Create Projects Table
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  requests_json JSONB,
  result_json JSONB
);

-- 2. Create Stock Table
CREATE TABLE stock (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  material TEXT NOT NULL,
  length INTEGER NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  weight_kg_m NUMERIC(10, 2) DEFAULT 0,
  is_scrap BOOLEAN DEFAULT false,
  origin_project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Note: We are using JSONB in the 'projects' table to store the complex array of 'requests' 
-- and the deeply nested 'OptimizationResult' object to speed up this initial migration. 
-- In a highly structured scalable app, these would be normalized into relational tables, 
-- but JSONB in PostgreSQL provides excellent querying flexibility and performance for document-style data.

-- Note: We can add RLS (Row Level Security) policies here later when we add user Authentication.
-- For now, allow public access if you haven't enabled RLS on these tables, or keep them private and let API keys bypass.
