import { readFileSync, readdirSync, writeFileSync } from 'fs';
import { resolve, join } from 'path';

const PROJECT_REF = 'jvucpnlgfvgulhgthhix';
const ACCESS_TOKEN = 'sbp_d51b70d38b39cb2f4c33f5d0a654db4d9a4495ff';

async function applySql(sql) {
  const response = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ACCESS_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query: sql })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'API Error');
  return data;
}

async function main() {
  try {
    const migrationDir = resolve(process.cwd(), 'supabase/migrations');
    const files = readdirSync(migrationDir).filter(f => f.endsWith('.sql')).sort();
    
    let consolidatedSql = `
      -- =====================================================
      -- CONSOLIDATED SCHEMA AUTO-GENERATED
      -- =====================================================
      
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
      END;
      $$ language 'plpgsql';
    `;

    for (const file of files) {
      console.log(`Reading ${file}...`);
      const content = readFileSync(join(migrationDir, file), 'utf-8');
      consolidatedSql += `\n\n-- Migration: ${file}\n${content}`;
    }

    // Write to file for record
    writeFileSync(resolve(process.cwd(), 'supabase/consolidated_schema.sql'), consolidatedSql);
    console.log('✅ Created consolidated_schema.sql');

    console.log('🚀 Syncing live database with consolidated schema...');
    await applySql(consolidatedSql);
    console.log('✅ Live database is now fully in sync!');

  } catch (err) {
    console.error('❌ Failed:', err.message);
    process.exit(1);
  }
}

main();
