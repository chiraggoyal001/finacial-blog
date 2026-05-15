// =====================================================
// SEED SCRIPT - Reads .env file directly
// Run: node supabase/seed-direct.mjs
// =====================================================

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Read .env file
function loadEnv() {
  try {
    const envPath = resolve(process.cwd(), '.env');
    const envContent = readFileSync(envPath, 'utf-8');
    const env = {};
    
    envContent.split('\n').forEach(line => {
      const match = line.match(/^([^=:#]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        let value = match[2].trim();
        // Remove quotes if present
        if ((value.startsWith('"') && value.endsWith('"')) || 
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        env[key] = value;
      }
    });
    
    return env;
  } catch (err) {
    console.error('❌ Could not read .env file:', err.message);
    return {};
  }
}

const env = loadEnv();
const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  console.log('\n📄 Current .env contents:');
  console.log(`   VITE_SUPABASE_URL=${supabaseUrl || '(missing)'}`);
  console.log(`   SUPABASE_SERVICE_ROLE_KEY=${env.SUPABASE_SERVICE_ROLE_KEY ? '(set)' : '(missing)'}`);
  console.log(`   VITE_SUPABASE_KEY=${env.VITE_SUPABASE_KEY ? '(set)' : '(missing)'}`);
  console.log('\n💡 Fix: For seeding, add your Service Role Key to .env:');
  console.log('SUPABASE_SERVICE_ROLE_KEY=eyJ...');
  process.exit(1);
}

if (env.SUPABASE_SERVICE_ROLE_KEY) {
  console.log('⚡ Using Service Role Key (RLS Bypass enabled)');
} else {
  console.log('⚠️ Using Anon Key (May fail due to RLS)');
}

console.log('✅ Loaded credentials from .env');
console.log(`   URL: ${supabaseUrl.substring(0, 30)}...`);
console.log(`   Key: ${supabaseKey.substring(0, 20)}...\n`);

const supabase = createClient(supabaseUrl, supabaseKey);

// =====================================================
// DUMMY DATA
// =====================================================

const DUMMY_POSTS = [
  {
    title: "Understanding Market Dynamics in 2025",
    excerpt: "A deep dive into the forces shaping global markets this year.",
    content: `<p>The global financial markets in 2025 are defined by a complex interplay of geopolitical tensions, central bank policies, and technological disruption.</p><h2>Key Drivers</h2><p>Interest rates across major economies have begun a cautious descent.</p><h2>Our Outlook</h2><p>We maintain a cautiously optimistic stance for H2 2025.</p>`,
    category: "Newsletter",
    author_name: "Editorial Team",
    image: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600&h=400&fit=crop",
    read_time: "5 min",
    tags: [{ name: "Markets", type: "major" }, { name: "Analysis", type: "minor" }],
    views: 1240,
    likes: 89,
    is_published: true,
  },
  {
    title: "Beginner's Guide to Financial Planning",
    excerpt: "Everything you need to know to start your financial planning journey.",
    content: `<p>Financial planning is the cornerstone of building long-term wealth.</p><h2>Step 1: Assess Your Position</h2><p>List all your assets, liabilities, income sources.</p><h2>Step 2: Set SMART Goals</h2><p>Specific, Measurable, Achievable goals.</p><h2>Step 3: Create a Budget</h2><p>The 50/30/20 rule.</p>`,
    category: "Modules",
    author_name: "Editorial Team",
    image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&h=400&fit=crop",
    read_time: "8 min",
    tags: [{ name: "Planning", type: "major" }, { name: "Beginners", type: "minor" }],
    views: 980,
    likes: 124,
    is_published: true,
  },
  {
    title: "Weekly Market Wrap: Key Takeaways",
    excerpt: "This week's top market movements and earnings reports.",
    content: `<p>Markets ended the week on a positive note, with the S&P 500 gaining 1.2%.</p><h2>Earnings Highlights</h2><p>Tech giants reported better-than-expected earnings.</p>`,
    category: "Newsletter",
    author_name: "Editorial Team",
    image: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=600&h=400&fit=crop",
    read_time: "4 min",
    tags: [{ name: "Markets", type: "major" }, { name: "Weekly", type: "minor" }],
    views: 2100,
    likes: 156,
    is_published: true,
  },
];

const DUMMY_MODULES = [
  {
    title: "Stock Market Fundamentals",
    description: "Learn the basics of stock markets and how to start investing.",
    image: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600&h=400&fit=crop",
    tag: { name: "Investing", type: "major" },
    total_read_time: "45 min",
    youtube_playlist: "https://youtube.com/playlist?list=example1",
    views: 3200,
    likes: 245,
    is_published: true,
    chapters: [
      {
        title: "What is a Stock Market?",
        content: `<p>A stock market is a marketplace where shares are traded.</p><h2>How It Works</h2><p>Companies list shares through an IPO.</p>`,
        read_time: "8 min",
        tags: [{ name: "Investing", type: "major" }, { name: "Beginners", type: "minor" }],
      },
      {
        title: "Types of Stocks",
        content: `<p>Stocks can be classified by market cap, growth potential.</p><h2>By Market Cap</h2><p>Large-cap, mid-cap, small-cap.</p>`,
        read_time: "10 min",
        tags: [{ name: "Investing", type: "major" }, { name: "Analysis", type: "minor" }],
      },
    ],
  },
  {
    title: "Personal Finance Mastery",
    description: "A guide to managing money, budgeting, and planning.",
    image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&h=400&fit=crop",
    tag: { name: "Planning", type: "major" },
    total_read_time: "35 min",
    youtube_playlist: "https://youtube.com/playlist?list=example2",
    views: 2800,
    likes: 312,
    is_published: true,
    chapters: [
      {
        title: "Budgeting 101",
        content: `<p>Budgeting is the foundation of personal finance.</p><h2>The 50/30/20 Rule</h2><p>50% needs, 30% wants, 20% savings.</p>`,
        read_time: "8 min",
        tags: [{ name: "Planning", type: "major" }, { name: "Beginners", type: "minor" }],
      },
    ],
  },
];

const DUMMY_VIDEO_SERIES = [
  {
    title: "Stock Market Fundamentals — Video Course",
    description: "Visual walkthroughs of stock market concepts.",
    thumbnail: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600&h=400&fit=crop",
    tag: { name: "Investing", type: "major" },
    total_duration: "1h 15min",
    views: 5400,
    likes: 320,
    is_published: true,
    chapters: [
      {
        title: "Introduction to Stock Markets",
        video_url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        duration: "14:32",
        description: "Overview of stock markets.",
        tags: [{ name: "Investing", type: "major" }, { name: "Beginners", type: "minor" }],
      },
      {
        title: "Understanding Stock Prices",
        video_url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        duration: "18:45",
        description: "What drives stock prices.",
        tags: [{ name: "Investing", type: "major" }, { name: "Analysis", type: "minor" }],
      },
    ],
  },
];

const DUMMY_EVENTS = [
  {
    title: "Market Outlook 2026 — Community Meetup",
    description: "Open discussion on global market trends.",
    type: "community",
    date: "2026-04-20",
    time: "18:00 - 20:00",
    location: "Mumbai",
    image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600",
    tags: [{ name: "Markets", type: "major" }, { name: "Trends", type: "minor" }],
    is_upcoming: true,
    capacity: 100,
    registered: 67,
    is_published: true,
  },
  {
    title: "Personal Finance Quiz Night",
    description: "Test your financial literacy in a fun quiz.",
    type: "quiz",
    date: "2026-04-25",
    time: "19:00 - 21:00",
    location: "Online",
    image: "https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?w=600",
    tags: [{ name: "Planning", type: "major" }, { name: "Beginners", type: "minor" }],
    is_upcoming: true,
    capacity: 500,
    registered: 312,
    is_published: true,
  },
];

const DUMMY_JUNIOR_MODULES = [
  {
    title: "What is Money? 💰",
    description: "A fun journey into how money works.",
    image: "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=600",
    tag: { name: "Basics", type: "major" },
    content_type: "video",
    total_duration: "25 min",
    views: 2400,
    likes: 380,
    is_published: true,
    chapters: [
      {
        title: "🪙 Barter to Coins",
        content_type: "video",
        content: "How people traded before money existed.",
        video_url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        duration: "8:00",
        tags: [{ name: "Basics", type: "major" }, { name: "History", type: "minor" }],
        illustration: "https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=400",
      },
      {
        title: "💳 Paper to Plastic",
        content_type: "video",
        content: "How payment evolved over centuries.",
        video_url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        duration: "9:30",
        tags: [{ name: "Basics", type: "major" }, { name: "Trends", type: "minor" }],
        illustration: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400",
      },
    ],
  },
];

// =====================================================
// SEED FUNCTION
// =====================================================

async function seedDatabase() {
  console.log('🌱 Starting database seeding...\n');
  let successCount = 0;
  let errorCount = 0;

  // 1. Seed Articles
  console.log('📄 Seeding articles...');
  for (const post of DUMMY_POSTS) {
    const { error } = await supabase.from('articles').insert(post);
    if (error) {
      console.error(`   ❌ ${post.title}: ${error.message}`);
      errorCount++;
    } else {
      console.log(`   ✅ ${post.title}`);
      successCount++;
    }
  }

  // 2. Seed Modules
  console.log('\n📚 Seeding modules...');
  for (const module of DUMMY_MODULES) {
    const chapters = module.chapters;
    delete module.chapters;
    
    const { data: moduleData, error: moduleError } = await supabase.from('modules').insert(module).select().single();
    if (moduleError) {
      console.error(`   ❌ ${module.title}: ${moduleError.message}`);
      errorCount++;
      continue;
    }
    console.log(`   ✅ ${module.title}`);
    successCount++;

    for (let i = 0; i < chapters.length; i++) {
      const { error } = await supabase.from('module_chapters').insert({
        ...chapters[i],
        module_id: moduleData.id,
        sort_order: i,
      });
      if (error) {
        console.error(`      ❌ Chapter ${i+1}: ${error.message}`);
        errorCount++;
      }
    }
  }

  // 3. Seed Video Series
  console.log('\n🎬 Seeding video series...');
  for (const series of DUMMY_VIDEO_SERIES) {
    const chapters = series.chapters;
    delete series.chapters;
    
    const { data: seriesData, error: seriesError } = await supabase.from('video_series').insert(series).select().single();
    if (seriesError) {
      console.error(`   ❌ ${series.title}: ${seriesError.message}`);
      errorCount++;
      continue;
    }
    console.log(`   ✅ ${series.title}`);
    successCount++;

    for (let i = 0; i < chapters.length; i++) {
      const { error } = await supabase.from('video_chapters').insert({
        ...chapters[i],
        series_id: seriesData.id,
        sort_order: i,
      });
      if (error) {
        console.error(`      ❌ Chapter ${i+1}: ${error.message}`);
        errorCount++;
      }
    }
  }

  // 4. Seed Events
  console.log('\n📅 Seeding events...');
  for (const event of DUMMY_EVENTS) {
    const { error } = await supabase.from('events').insert(event);
    if (error) {
      console.error(`   ❌ ${event.title}: ${error.message}`);
      errorCount++;
    } else {
      console.log(`   ✅ ${event.title}`);
      successCount++;
    }
  }

  // 5. Seed Junior Modules
  console.log('\n🎓 Seeding junior modules...');
  for (const module of DUMMY_JUNIOR_MODULES) {
    const chapters = module.chapters;
    delete module.chapters;
    
    const { data: moduleData, error: moduleError } = await supabase.from('junior_modules').insert(module).select().single();
    if (moduleError) {
      console.error(`   ❌ ${module.title}: ${moduleError.message}`);
      errorCount++;
      continue;
    }
    console.log(`   ✅ ${module.title}`);
    successCount++;

    for (let i = 0; i < chapters.length; i++) {
      const { error } = await supabase.from('junior_chapters').insert({
        ...chapters[i],
        module_id: moduleData.id,
        sort_order: i,
      });
      if (error) {
        console.error(`      ❌ Chapter ${i+1}: ${error.message}`);
        errorCount++;
      }
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('🎉 Database seeding completed!');
  console.log(`   ✅ Success: ${successCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);
  console.log('\n💡 Next step: Go to /admin to manage your content');
}

seedDatabase().catch((err) => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
