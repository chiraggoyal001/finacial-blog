-- =====================================================
-- SCHEDULED PUBLISHING UPDATES
-- =====================================================

-- Add scheduled_for column to all content tables
ALTER TABLE articles ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMP WITH TIME ZONE;
ALTER TABLE modules ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMP WITH TIME ZONE;
ALTER TABLE video_series ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMP WITH TIME ZONE;
ALTER TABLE events ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMP WITH TIME ZONE;
ALTER TABLE junior_modules ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMP WITH TIME ZONE;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_articles_scheduled_for ON articles(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_modules_scheduled_for ON modules(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_video_series_scheduled_for ON video_series(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_events_scheduled_for ON events(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_junior_modules_scheduled_for ON junior_modules(scheduled_for);

-- Comment for documentation
COMMENT ON COLUMN articles.scheduled_for IS 'Optional date/time for the content to automatically go live.';

-- =====================================================
-- PERSONALIZED RECOMMENDATIONS RPC
-- =====================================================

CREATE OR REPLACE FUNCTION get_personalized_recommendations(
  p_user_interests TEXT[],
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  excerpt TEXT,
  category TEXT,
  image TEXT,
  tags JSONB,
  views INTEGER,
  likes INTEGER,
  created_at TIMESTAMP WITH TIME ZONE,
  content_type TEXT,
  relevance_score INTEGER
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH all_content AS (
    -- Articles
    SELECT 
      a.id, a.title, a.excerpt, a.category, a.image, 
      (SELECT jsonb_agg(t) FROM jsonb_array_elements(a.tags) t) as tags,
      a.views, a.likes, a.created_at, 'article' as content_type,
      (SELECT COUNT(*) FROM jsonb_array_elements(a.tags) t WHERE t->>'name' = ANY(p_user_interests))::INTEGER as match_count
    FROM articles a
    WHERE a.is_published = true AND (a.scheduled_for IS NULL OR a.scheduled_for <= NOW())
    
    UNION ALL
    
    -- Modules
    SELECT 
      m.id, m.title, m.description as excerpt, 'Modules' as category, m.image, 
      jsonb_build_array(m.tag) as tags,
      m.views, m.likes, m.created_at, 'module' as content_type,
      (CASE WHEN m.tag->>'name' = ANY(p_user_interests) THEN 1 ELSE 0 END)::INTEGER as match_count
    FROM modules m
    WHERE m.is_published = true AND (m.scheduled_for IS NULL OR m.scheduled_for <= NOW())
  )
  SELECT 
    ac.id, ac.title, ac.excerpt, ac.category, ac.image, ac.tags, 
    ac.views, ac.likes, ac.created_at, ac.content_type,
    (ac.match_count * 100 + (ac.views / 100) + ac.likes)::INTEGER as relevance_score
  FROM all_content ac
  WHERE ac.match_count > 0 OR p_user_interests IS NULL OR array_length(p_user_interests, 1) = 0
  ORDER BY relevance_score DESC, ac.created_at DESC
  LIMIT p_limit;
END;
$$;
