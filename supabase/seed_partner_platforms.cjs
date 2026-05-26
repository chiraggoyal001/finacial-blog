const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Parse .env manually to avoid dependency issues
const envPath = path.join(__dirname, '../.env');
const env = {};
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  content.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      let value = match[2] || '';
      if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      env[match[1]] = value.trim();
    }
  });
}

const supabaseUrl = env['VITE_SUPABASE_URL'];
const supabaseServiceKey = env['SUPABASE_SERVICE_ROLE_KEY'];

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Error: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env file");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seed() {
  console.log("🌱 Seeding partner_platforms settings to remote database...");
  
  const defaultValue = {
    isVisible: true,
    logos: {
      zerodha: true,
      groww: true,
      bloomberg: true,
      moneycontrol: true,
      upstox: true
    },
    badges: {
      factChecked: true,
      structuredPaths: true,
      topRated: true
    }
  };

  const { data, error } = await supabase
    .from('system_settings')
    .insert([
      { key: 'partner_platforms', value: defaultValue }
    ])
    .select();

  if (error) {
    if (error.code === '23505') { // Unique violation
      console.log("✓ Setting 'partner_platforms' already exists in remote database.");
    } else {
      console.error("❌ Error seeding setting:", error.message);
      process.exit(1);
    }
  } else {
    console.log("🚀 Successfully seeded partner_platforms settings:", data);
  }
}

seed().catch(err => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});
