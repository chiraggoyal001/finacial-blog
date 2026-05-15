-- =====================================================
-- GAMIFICATION & SEO SCHEMA UPDATES
-- =====================================================

-- 1. Add XP to Profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS xp INTEGER DEFAULT 0;

-- 2. Create Quiz Results Table
CREATE TABLE IF NOT EXISTS quiz_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  quiz_id TEXT NOT NULL,
  score INTEGER NOT NULL,
  total INTEGER NOT NULL,
  xp_awarded INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on quiz_results
ALTER TABLE quiz_results ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can read own quiz results') THEN
        CREATE POLICY "Users can read own quiz results" ON quiz_results FOR SELECT USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert own quiz results') THEN
        CREATE POLICY "Users can insert own quiz results" ON quiz_results FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
END
$$;

-- 3. Function to submit quiz and get live stats (Percentile, XP)
CREATE OR REPLACE FUNCTION submit_quiz_and_get_stats(
  p_quiz_id TEXT,
  p_score INTEGER,
  p_total INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_xp_to_add INTEGER;
  v_new_total_xp INTEGER;
  v_percentile FLOAT;
  v_total_users INTEGER;
  v_users_below INTEGER;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Calculate XP: 10 per correct answer, bonus 50 for perfect score
  v_xp_to_add := (p_score * 10);
  IF p_score = p_total AND p_total > 0 THEN
    v_xp_to_add := v_xp_to_add + 50;
  END IF;

  -- Record the result
  INSERT INTO quiz_results (user_id, quiz_id, score, total, xp_awarded)
  VALUES (v_user_id, p_quiz_id, p_score, p_total, v_xp_to_add);

  -- Update profile XP
  UPDATE profiles 
  SET xp = xp + v_xp_to_add 
  WHERE id = v_user_id
  RETURNING xp INTO v_new_total_xp;

  -- Calculate percentile rank
  SELECT COUNT(*) INTO v_total_users FROM profiles;
  SELECT COUNT(*) INTO v_users_below FROM profiles WHERE xp < v_new_total_xp;
  
  IF v_total_users > 1 THEN
    v_percentile := (v_users_below::FLOAT / (v_total_users - 1)::FLOAT) * 100;
  ELSE
    v_percentile := 100;
  END IF;

  RETURN jsonb_build_object(
    'xp_awarded', v_xp_to_add,
    'total_xp', v_new_total_xp,
    'percentile', ROUND(v_percentile::numeric, 1)
  );
END;
$$;

-- 4. SEO Metadata Columns
ALTER TABLE articles ADD COLUMN IF NOT EXISTS seo_title TEXT;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS seo_description TEXT;

ALTER TABLE modules ADD COLUMN IF NOT EXISTS seo_title TEXT;
ALTER TABLE modules ADD COLUMN IF NOT EXISTS seo_description TEXT;

ALTER TABLE video_series ADD COLUMN IF NOT EXISTS seo_title TEXT;
ALTER TABLE video_series ADD COLUMN IF NOT EXISTS seo_description TEXT;

ALTER TABLE events ADD COLUMN IF NOT EXISTS seo_title TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS seo_description TEXT;

ALTER TABLE junior_modules ADD COLUMN IF NOT EXISTS seo_title TEXT;
ALTER TABLE junior_modules ADD COLUMN IF NOT EXISTS seo_description TEXT;
