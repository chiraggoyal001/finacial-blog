-- =====================================================
-- MIGRATION: Ratings System & View Tracking Fix
-- =====================================================

-- 1. Create content_ratings table
CREATE TABLE IF NOT EXISTS content_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content_type TEXT NOT NULL,
  content_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, content_type, content_id)
);

-- 2. Add rating columns to content tables
ALTER TABLE articles ADD COLUMN IF NOT EXISTS avg_rating DECIMAL(3,2) DEFAULT 0;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS rating_count INTEGER DEFAULT 0;

ALTER TABLE modules ADD COLUMN IF NOT EXISTS avg_rating DECIMAL(3,2) DEFAULT 0;
ALTER TABLE modules ADD COLUMN IF NOT EXISTS rating_count INTEGER DEFAULT 0;

ALTER TABLE video_series ADD COLUMN IF NOT EXISTS avg_rating DECIMAL(3,2) DEFAULT 0;
ALTER TABLE video_series ADD COLUMN IF NOT EXISTS rating_count INTEGER DEFAULT 0;

ALTER TABLE junior_modules ADD COLUMN IF NOT EXISTS avg_rating DECIMAL(3,2) DEFAULT 0;
ALTER TABLE junior_modules ADD COLUMN IF NOT EXISTS rating_count INTEGER DEFAULT 0;

-- 3. RPC: Rate content (insert/update rating + recalculate avg)
CREATE OR REPLACE FUNCTION rate_content(
  p_content_type TEXT,
  p_content_id UUID,
  p_rating INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_avg DECIMAL(3,2);
  v_count INTEGER;
  v_result JSONB;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_rating < 1 OR p_rating > 5 THEN
    RAISE EXCEPTION 'Rating must be between 1 and 5';
  END IF;

  -- Upsert the rating
  INSERT INTO content_ratings (user_id, content_type, content_id, rating)
  VALUES (v_user_id, p_content_type, p_content_id, p_rating)
  ON CONFLICT (user_id, content_type, content_id)
  DO UPDATE SET rating = p_rating, created_at = NOW();

  -- Recalculate average and count
  SELECT ROUND(AVG(rating)::numeric, 2), COUNT(*)
  INTO v_avg, v_count
  FROM content_ratings
  WHERE content_type = p_content_type AND content_id = p_content_id;

  -- Update the appropriate content table
  IF p_content_type = 'article' THEN
    UPDATE articles SET avg_rating = v_avg, rating_count = v_count WHERE id = p_content_id;
  ELSIF p_content_type = 'module' THEN
    UPDATE modules SET avg_rating = v_avg, rating_count = v_count WHERE id = p_content_id;
  ELSIF p_content_type = 'video' THEN
    UPDATE video_series SET avg_rating = v_avg, rating_count = v_count WHERE id = p_content_id;
  ELSIF p_content_type = 'junior' THEN
    UPDATE junior_modules SET avg_rating = v_avg, rating_count = v_count WHERE id = p_content_id;
  END IF;

  RETURN jsonb_build_object(
    'avg_rating', v_avg,
    'rating_count', v_count,
    'user_rating', p_rating
  );
END;
$$;

-- 4. RPC: Track content view
CREATE OR REPLACE FUNCTION track_content_view(
  p_content_type TEXT,
  p_content_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_table_name TEXT;
BEGIN
  v_table_name := CASE p_content_type
    WHEN 'article' THEN 'articles'
    WHEN 'module' THEN 'modules'
    WHEN 'video' THEN 'video_series'
    WHEN 'junior' THEN 'junior_modules'
    ELSE NULL
  END;

  IF v_table_name IS NULL THEN
    RAISE EXCEPTION 'Invalid content type: %', p_content_type;
  END IF;

  EXECUTE format('UPDATE %I SET views = views + 1 WHERE id = $1', v_table_name)
  USING p_content_id;
END;
$$;

-- 5. Update content_performance view to include ratings
DROP VIEW IF EXISTS content_performance CASCADE;
CREATE OR REPLACE VIEW content_performance AS
SELECT 
  'article' as content_type, a.id, a.title, a.views, a.likes, a.avg_rating, a.rating_count,
  COUNT(DISTINCT ul.user_id) as unique_likes, a.created_at
FROM articles a
LEFT JOIN user_likes ul ON ul.content_type = 'article' AND ul.content_id = a.id
GROUP BY a.id, a.title, a.views, a.likes, a.avg_rating, a.rating_count, a.created_at
UNION ALL
SELECT 
  'module' as content_type, m.id, m.title, m.views, m.likes, m.avg_rating, m.rating_count,
  COUNT(DISTINCT ul.user_id) as unique_likes, m.created_at
FROM modules m
LEFT JOIN user_likes ul ON ul.content_type = 'module' AND ul.content_id = m.id
GROUP BY m.id, m.title, m.views, m.likes, m.avg_rating, m.rating_count, m.created_at
UNION ALL
SELECT 
  'video' as content_type, v.id, v.title, v.views, v.likes, v.avg_rating, v.rating_count,
  COUNT(DISTINCT ul.user_id) as unique_likes, v.created_at
FROM video_series v
LEFT JOIN user_likes ul ON ul.content_type = 'video' AND ul.content_id = v.id
GROUP BY v.id, v.title, v.views, v.likes, v.avg_rating, v.rating_count, v.created_at
UNION ALL
SELECT 
  'junior' as content_type, j.id, j.title, j.views, j.likes, j.avg_rating, j.rating_count,
  COUNT(DISTINCT ul.user_id) as unique_likes, j.created_at
FROM junior_modules j
LEFT JOIN user_likes ul ON ul.content_type = 'junior' AND ul.content_id = j.id
GROUP BY j.id, j.title, j.views, j.likes, j.avg_rating, j.rating_count, j.created_at;

-- 6. RLS for content_ratings
ALTER TABLE content_ratings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own ratings" ON content_ratings FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admins can read all ratings" ON content_ratings FOR SELECT USING (is_admin(auth.uid()));