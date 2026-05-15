-- =====================================================
-- HARDENING & INTEGRITY MIGRATION
-- =====================================================

-- 1. SEARCH PERFORMANCE (GIN INDEXES)
-- Setup full-text search columns and indexes for lightning fast search
ALTER TABLE articles ADD COLUMN IF NOT EXISTS search_vector tsvector GENERATED ALWAYS AS (
  to_tsvector('english', coalesce(title, '') || ' ' || coalesce(excerpt, ''))
) STORED;
CREATE INDEX IF NOT EXISTS idx_articles_search ON articles USING GIN(search_vector);

ALTER TABLE modules ADD COLUMN IF NOT EXISTS search_vector tsvector GENERATED ALWAYS AS (
  to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, ''))
) STORED;
CREATE INDEX IF NOT EXISTS idx_modules_search ON modules USING GIN(search_vector);

ALTER TABLE video_series ADD COLUMN IF NOT EXISTS search_vector tsvector GENERATED ALWAYS AS (
  to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, ''))
) STORED;
CREATE INDEX IF NOT EXISTS idx_video_series_search ON video_series USING GIN(search_vector);

-- Update search_content RPC to use the indexes (replaces plainto_tsquery with indexed @@ match)
CREATE OR REPLACE FUNCTION search_content(p_query TEXT, p_limit INTEGER DEFAULT 12)
RETURNS TABLE (
  id UUID,
  title TEXT,
  category TEXT,
  image TEXT,
  tags JSONB,
  link TEXT,
  read_time TEXT,
  views INTEGER,
  search_rank REAL
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_query tsquery;
BEGIN
  -- Format query for partial matches (e.g. "inv" matches "investing")
  v_query := websearch_to_tsquery('english', p_query);
  
  RETURN QUERY
  WITH search_results AS (
    SELECT 
      a.id, a.title, a.category, a.image, a.tags,
      CASE WHEN a.category = 'Newsletter' THEN '/newsletter/' || a.id ELSE '/post/' || a.id END as link,
      a.read_time, a.views,
      ts_rank(a.search_vector, v_query) as rank
    FROM articles a
    WHERE a.is_published = true AND (a.scheduled_for IS NULL OR a.scheduled_for <= NOW())
      AND a.search_vector @@ v_query
    
    UNION ALL
    
    SELECT 
      m.id, m.title, 'Modules' as category, m.image, jsonb_build_array(m.tag) as tags,
      '/modules/' || m.id as link,
      m.total_read_time as read_time, m.views,
      ts_rank(m.search_vector, v_query) as rank
    FROM modules m
    WHERE m.is_published = true AND (m.scheduled_for IS NULL OR m.scheduled_for <= NOW())
      AND m.search_vector @@ v_query
    
    UNION ALL
    
    SELECT 
      v.id, v.title, 'Videos' as category, v.thumbnail as image, jsonb_build_array(v.tag) as tags,
      '/videos/' || v.id as link,
      v.total_duration as read_time, v.views,
      ts_rank(v.search_vector, v_query) as rank
    FROM video_series v
    WHERE v.is_published = true AND (v.scheduled_for IS NULL OR v.scheduled_for <= NOW())
      AND v.search_vector @@ v_query
  )
  SELECT sr.id, sr.title, sr.category, sr.image, sr.tags, sr.link, sr.read_time, sr.views, sr.rank::REAL as search_rank
  FROM search_results sr
  ORDER BY sr.rank DESC, sr.views DESC
  LIMIT p_limit;
END;
$$;

-- 2. SYSTEM SETTINGS SECURITY
-- Explicit whitelist for public settings
DROP POLICY IF EXISTS "Public can read non-sensitive settings" ON system_settings;
CREATE POLICY "Public can read only non-sensitive settings" ON system_settings
  FOR SELECT USING (key IN ('system_banner'));

-- 3. CROSS-DEVICE PROGRESS TRACKING
CREATE TABLE IF NOT EXISTS user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content_id UUID NOT NULL,
  progress_percent INTEGER DEFAULT 0,
  is_read BOOLEAN DEFAULT false,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, content_id)
);

-- Enable RLS
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own progress" ON user_progress
  FOR ALL USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_user_progress_updated_at BEFORE UPDATE ON user_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
