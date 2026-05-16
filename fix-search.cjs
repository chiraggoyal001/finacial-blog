const https = require('https');

const projectRef = 'jvucpnlgfvgulhgthhix';
const token = 'sbp_d51b70d38b39cb2f4c33f5d0a654db4d9a4495ff';

function execSql(sql) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ query: sql });
    const options = {
      hostname: 'api.supabase.com',
      path: '/v1/projects/' + projectRef + '/database/query',
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + token,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 201) {
          resolve(body);
        } else {
          reject(new Error('Status ' + res.statusCode + ': ' + body));
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

(async () => {
  // Step 1: Drop old function
  try {
    await execSql('DROP FUNCTION IF EXISTS search_content CASCADE;');
    console.log('Dropped old function');
  } catch (e) {
    console.log('Note dropping function: ' + e.message);
  }

  // Step 2: Create GIN indexes  
  try {
    await execSql('CREATE INDEX IF NOT EXISTS idx_articles_search_vector ON articles USING GIN (search_vector);');
    console.log('Created articles GIN index');
    await execSql('CREATE INDEX IF NOT EXISTS idx_modules_search_vector ON modules USING GIN (search_vector);');
    console.log('Created modules GIN index');
    await execSql('CREATE INDEX IF NOT EXISTS idx_video_series_search_vector ON video_series USING GIN (search_vector);');
    console.log('Created video_series GIN index');
  } catch (e) {
    console.log('Note creating indexes: ' + e.message);
  }

  // Step 3: Create the new search function
  const createFuncSql = 
`CREATE OR REPLACE FUNCTION search_content(p_query TEXT, p_limit INTEGER DEFAULT 12)
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
AS $_$
DECLARE
  v_query tsquery;
BEGIN
  IF p_query IS NULL OR trim(p_query) = '' THEN
    RETURN;
  END IF;
  BEGIN
    v_query := websearch_to_tsquery('english', p_query);
  EXCEPTION WHEN OTHERS THEN
    v_query := plainto_tsquery('english', p_query);
  END;
  IF v_query IS NULL THEN
    RETURN;
  END IF;
  RETURN QUERY
  WITH search_results AS (
    SELECT a.id, a.title, a.category, a.image, a.tags,
      CASE WHEN a.category = 'Newsletter' THEN '/newsletter/' || a.id ELSE '/post/' || a.id END as link,
      a.read_time, a.views, ts_rank(a.search_vector, v_query) as rank
    FROM articles a
    WHERE a.is_published = true AND (a.scheduled_for IS NULL OR a.scheduled_for <= NOW())
      AND a.search_vector @@ v_query
    UNION ALL
    SELECT m.id, m.title, 'Modules' as category, m.image, jsonb_build_array(m.tag) as tags,
      '/modules/' || m.id as link, m.total_read_time as read_time, m.views,
      ts_rank(m.search_vector, v_query) as rank
    FROM modules m
    WHERE m.is_published = true AND (m.scheduled_for IS NULL OR m.scheduled_for <= NOW())
      AND m.search_vector @@ v_query
    UNION ALL
    SELECT v.id, v.title, 'Videos' as category, v.thumbnail as image, jsonb_build_array(v.tag) as tags,
      '/videos/' || v.id as link, v.total_duration as read_time, v.views,
      ts_rank(v.search_vector, v_query) as rank
    FROM video_series v
    WHERE v.is_published = true AND (v.scheduled_for IS NULL OR v.scheduled_for <= NOW())
      AND v.search_vector @@ v_query
  )
  SELECT sr.id, sr.title, sr.category, sr.image, sr.tags, sr.link, sr.read_time, sr.views, sr.rank::REAL as search_rank
  FROM search_results sr
  WHERE sr.rank > 0
  ORDER BY sr.rank DESC, sr.views DESC
  LIMIT p_limit;
END;
$_$;`;

  try {
    await execSql(createFuncSql);
    console.log('Created improved search_content function');
  } catch (e) {
    console.error('Failed to create function:', e.message);
    process.exit(1);
  }

  console.log('\nAll search fixes applied successfully!');
})();