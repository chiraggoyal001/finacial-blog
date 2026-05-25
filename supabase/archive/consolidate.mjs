import { readFileSync, readdirSync, writeFileSync, existsSync } from 'fs';
import { resolve, join } from 'path';

let supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
let token = process.env.SUPABASE_ACCESS_TOKEN;

// Try reading .env file from working directory if either is missing
if (!supabaseUrl || !token) {
  try {
    const envPath = resolve(process.cwd(), '.env');
    if (existsSync(envPath)) {
      const envContent = readFileSync(envPath, 'utf-8');
      if (!supabaseUrl) {
        const urlMatch = envContent.match(/(SUPABASE_URL|VITE_SUPABASE_URL)\s*=\s*['"]?([^'"\r\n]+)['"]?/);
        if (urlMatch) supabaseUrl = urlMatch[2];
      }
      if (!token) {
        const tokenMatch = envContent.match(/SUPABASE_ACCESS_TOKEN\s*=\s*['"]?([^'"\r\n]+)['"]?/);
        if (tokenMatch) token = tokenMatch[1];
      }
    }
  } catch (e) {
    // Ignore error
  }
}

const PROJECT_REF = supabaseUrl 
  ? supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] || 'jvucpnlgfvgulhgthhix'
  : 'jvucpnlgfvgulhgthhix';
const ACCESS_TOKEN = token;

if (!ACCESS_TOKEN) {
  console.error('❌ Error: SUPABASE_ACCESS_TOKEN is not defined in environment or .env file');
  process.exit(1);
}

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
