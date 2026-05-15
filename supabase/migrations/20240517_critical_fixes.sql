-- =====================================================
-- CRITICAL FIXES MIGRATION
-- =====================================================

-- 1. XP RACE CONDITION & INTEGRITY
-- Prevent duplicate submissions for the same quiz (users can only get XP once per quiz)
ALTER TABLE quiz_results ADD CONSTRAINT unique_user_quiz UNIQUE (user_id, quiz_id);

-- 2. SYSTEM SETTINGS SECURITY
-- Drop broad public read policy
DROP POLICY IF EXISTS "Public can read system settings" ON system_settings;

-- New targeted policy: Public can only see NON-sensitive keys (like banners)
CREATE POLICY "Public can read non-sensitive settings" ON system_settings
  FOR SELECT USING (key != 'ai_prompt');

-- Admins can still see everything (existing policy "Admins can manage system settings" covers this)

-- 3. RECURSIVE DELETION (CASCADE)
-- Ensure deleting a module deletes its chapters
ALTER TABLE module_chapters 
  DROP CONSTRAINT IF EXISTS module_chapters_module_id_fkey,
  ADD CONSTRAINT module_chapters_module_id_fkey 
    FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE;

-- Ensure deleting a video series deletes its videos
ALTER TABLE video_chapters 
  DROP CONSTRAINT IF EXISTS video_chapters_series_id_fkey,
  ADD CONSTRAINT video_chapters_series_id_fkey 
    FOREIGN KEY (series_id) REFERENCES video_series(id) ON DELETE CASCADE;

-- 4. SERVER-SIDE SEARCH ENGINE
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
BEGIN
  RETURN QUERY
  WITH search_results AS (
    -- Articles
    SELECT 
      a.id, a.title, a.category, a.image, a.tags,
      CASE WHEN a.category = 'Newsletter' THEN '/newsletter/' || a.id ELSE '/post/' || a.id END as link,
      a.read_time, a.views,
      ts_rank(to_tsvector('english', a.title || ' ' || a.excerpt), plainto_tsquery('english', p_query)) as rank
    FROM articles a
    WHERE a.is_published = true AND (a.scheduled_for IS NULL OR a.scheduled_for <= NOW())
    
    UNION ALL
    
    -- Modules
    SELECT 
      m.id, m.title, 'Modules' as category, m.image, jsonb_build_array(m.tag) as tags,
      '/modules/' || m.id as link,
      m.total_read_time as read_time, m.views,
      ts_rank(to_tsvector('english', m.title || ' ' || m.description), plainto_tsquery('english', p_query)) as rank
    FROM modules m
    WHERE m.is_published = true AND (m.scheduled_for IS NULL OR m.scheduled_for <= NOW())
    
    UNION ALL
    
    -- Video Series
    SELECT 
      v.id, v.title, 'Videos' as category, v.thumbnail as image, jsonb_build_array(v.tag) as tags,
      '/videos/' || v.id as link,
      v.total_duration as read_time, v.views,
      ts_rank(to_tsvector('english', v.title || ' ' || v.description), plainto_tsquery('english', p_query)) as rank
    FROM video_series v
    WHERE v.is_published = true AND (v.scheduled_for IS NULL OR v.scheduled_for <= NOW())
  )
  SELECT sr.id, sr.title, sr.category, sr.image, sr.tags, sr.link, sr.read_time, sr.views, sr.rank::REAL as search_rank
  FROM search_results sr
  WHERE sr.rank > 0
  ORDER BY sr.rank DESC, sr.views DESC
  LIMIT p_limit;
END;
$$;
