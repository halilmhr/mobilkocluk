-- Fix Books Table Hierarchy - add JSONB chapters column
-- Run this in Supabase SQL Editor

ALTER TABLE books ADD COLUMN IF NOT EXISTS chapters JSONB DEFAULT '[]';

-- Optional: Comment on columns for better documentation
COMMENT ON COLUMN books.chapters IS 'Hierarchical chapter and topic structure [{title: string, topics: string[]}]';
