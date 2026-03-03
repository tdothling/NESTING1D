-- Migration: price_per_meter → price_per_kg
-- Run this in the Supabase SQL Editor

ALTER TABLE stock ADD COLUMN IF NOT EXISTS price_per_kg NUMERIC(10, 2) DEFAULT 0;
ALTER TABLE stock DROP COLUMN IF EXISTS price_per_meter;
