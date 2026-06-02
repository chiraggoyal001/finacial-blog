-- =====================================================
-- CREATE STORAGE BUCKET FOR CONTENT IMAGES AND DEFINE POLICIES
-- =====================================================

-- 1. Create the bucket if it doesn't already exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('content-images', 'content-images', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Define RLS Policies for content-images bucket (RLS is enabled by default on storage.objects)

-- 3. Define RLS Policies for content-images bucket
-- Note: We drop them first if they exist to prevent errors during migration replays.

DROP POLICY IF EXISTS "Public Read Access for Content Images" ON storage.objects;
CREATE POLICY "Public Read Access for Content Images" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'content-images');

DROP POLICY IF EXISTS "Admins can insert content images" ON storage.objects;
CREATE POLICY "Admins can insert content images" ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'content-images');

DROP POLICY IF EXISTS "Admins can update content images" ON storage.objects;
CREATE POLICY "Admins can update content images" ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'content-images')
  WITH CHECK (bucket_id = 'content-images');

DROP POLICY IF EXISTS "Admins can delete content images" ON storage.objects;
CREATE POLICY "Admins can delete content images" ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'content-images');
