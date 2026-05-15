// =====================================================
// SEED SCRIPT - Uses existing project dependencies
// Run: node supabase/seed-using-existing.mjs
// =====================================================

import { createClient } from '@supabase/supabase-js';

// Get credentials from environment or prompt
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_KEY || 'your-anon-key';

if (supabaseUrl.includes('your-project') || supabaseKey.includes('your-anon')) {
  console.error('❌ Please set VITE_SUPABASE_URL and VITE_SUPABASE_KEY in your .env file');
  console.log('\n💡 Your .env file should have:');
  console.log('VITE_SUPABASE_URL=https://xxxxxx.supabase.co');
  console.log('VITE_SUPABASE_KEY=eyJhbGciOiJIUzI1NiIs...');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// =====================================================
// DUMMY DATA
// =====================================================

const DUMMY_POSTS = [
  {
    title: "Understanding Market Dynamics in 2025",
    excerpt: "A deep dive into the forces shaping global markets this year and what investors should watch for.",
    content: `<p>The global financial markets in 2025 are defined by a complex interplay of geopolitical tensions, central bank policies, and technological disruption.</p><h2>Key Drivers</h2><p>Interest rates across major economies have begun a cautious descent, with the Federal Reserve signaling further cuts.</p><h2>Our Outlook</h2><p>We maintain a cautiously optimistic stance for H2 2025.</p>`,
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
    excerpt: "Everything you need to know to start your financial planning journey from scratch.",
    content: `<p>Financial planning is the cornerstone of building long-term wealth and security.</p><h2>Step 1: Assess Your Current Position</h2><p>List all your assets, liabilities, income sources, and monthly expenses.</p><h2>Step 2: Set SMART Goals</h2><p>Your goals should be Specific, Measurable, Achievable, Relevant, and Time-bound.</p><h2>Step 3: Create a Budget</h2><p>The 50/30/20 rule is a great starting point.</p>`,
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
    excerpt: "This week's top market movements, earnings reports, and economic indicators summarized.",
    content: `<p>Markets ended the week on a positive note, with the S&P 500 gaining 1.2% and the Nifty 50 touching new highs.</p><h2>Earnings Highlights</h2><p>Tech giants reported better-than-expected earnings, driven by AI infrastructure spending.</p>`,
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
    description: "Learn the basics of stock markets, how they work, and how to start investing wisely.",
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
        content: `<p>A stock market is a marketplace where shares of publicly listed companies are traded.</p><h2>How It Works</h2><p>Companies list their shares through an IPO. Once listed, shares are traded between investors.</p>`,
        read_time: "8 min",
        tags: [{ name: "Investing", type: "major" }, { name: "Beginners", type: "minor" }],
      },
      {
        title: "Types of Stocks",
        content: `<p>Stocks can be classified into several categories based on various factors.</p><h2>By Market Cap</h2><p>Large-cap stocks are well-established companies.</p>`,
        read_time: "10 min",
        tags: [{ name: "Investing", type: "major" }, { name: "Analysis", type: "minor" }],
      },
    ],
  },
];

const DUMMY_VIDEO_SERIES = [
  {
    title: "Stock Market Fundamentals — Video Course",
    description: "Visual walkthroughs of core stock market concepts.",
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
        description: "An overview of what stock markets are.",
        tags: [{ name: "Investing", type: "major" }, { name: "Beginners", type: "minor" }],
      },
    ],
  },
];

const DUMMY_EVENTS = [
  {
    title: "Market Outlook 2026 — Community Meetup",
    description: "Join fellow investors for an open discussion on global market trends.",
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
        content: "Discover how people traded before money existed.",
        video_url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        duration: "8:00",
        tags: [{ name: "Basics", type: "major" }, { name: "History", type: "minor" }],
        illustration: "https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=400",
      },
    ],
  },
];

// =====================================================
// SEED FUNCTION
// =====================================================

async function seedDatabase() {
  console.log('🌱 Starting database seeding...\n');

  // 1. Seed Articles
  console.log('📄 Seeding articles...');
  for (const post of DUMMY_POSTS) {
    const { error } = await supabase.from('articles').insert(post);
    if (error) console.error(`❌ ${post.title}:`, error.message);
    else console.log(`  ✅ ${post.title}`);
  }
  console.log('');

  // 2. Seed Modules
  console.log('📚 Seeding modules...');
  for (const module of DUMMY_MODULES) {
    const chapters = module.chapters;
    delete module.chapters;
    
    const { data: moduleData, error: moduleError } = await supabase.from('modules').insert(module).select().single();
    if (moduleError) {
      console.error(`❌ ${module.title}:`, moduleError.message);
      continue;
    }
    console.log(`  ✅ ${module.title}`);

    for (let i = 0; i < chapters.length; i++) {
      const { error } = await supabase.from('module_chapters').insert({
        ...chapters[i],
        module_id: moduleData.id,
        sort_order: i,
      });
      if (error) console.error(`   ❌ Chapter ${i+1}:`, error.message);
    }
  }
  console.log('');

  // 3. Seed Video Series
  console.log('🎬 Seeding video series...');
  for (const series of DUMMY_VIDEO_SERIES) {
    const chapters = series.chapters;
    delete series.chapters;
    
    const { data: seriesData, error: seriesError } = await supabase.from('video_series').insert(series).select().single();
    if (seriesError) {
      console.error(`❌ ${series.title}:`, seriesError.message);
      continue;
    }
    console.log(`  ✅ ${series.title}`);

    for (let i = 0; i < chapters.length; i++) {
      const { error } = await supabase.from('video_chapters').insert({
        ...chapters[i],
        series_id: seriesData.id,
        sort_order: i,
      });
      if (error) console.error(`   ❌ Chapter ${i+1}:`, error.message);
    }
  }
  console.log('');

  // 4. Seed Events
  console.log('📅 Seeding events...');
  for (const event of DUMMY_EVENTS) {
    const { error } = await supabase.from('events').insert(event);
    if (error) console.error(`❌ ${event.title}:`, error.message);
    else console.log(`  ✅ ${event.title}`);
  }
  console.log('');

  // 5. Seed Junior Modules
  console.log('🎓 Seeding junior modules...');
  for (const module of DUMMY_JUNIOR_MODULES) {
    const chapters = module.chapters;
    delete module.chapters;
    
    const { data: moduleData, error: moduleError } = await supabase.from('junior_modules').insert(module).select().single();
    if (moduleError) {
      console.error(`❌ ${module.title}:`, moduleError.message);
      continue;
    }
    console.log(`  ✅ ${module.title}`);

    for (let i = 0; i < chapters.length; i++) {
      const { error } = await supabase.from('junior_chapters').insert({
        ...chapters[i],
        module_id: moduleData.id,
        sort_order: i,
      });
      if (error) console.error(`   ❌ Chapter ${i+1}:`, error.message);
    }
  }

  console.log('\n🎉 Database seeding completed!');
  console.log('\n📊 Seeded:');
  console.log(`   • ${DUMMY_POSTS.length} articles`);
  console.log(`   • ${DUMMY_MODULES.length} modules with chapters`);
  console.log(`   • ${DUMMY_VIDEO_SERIES.length} video series with chapters`);
  console.log(`   • ${DUMMY_EVENTS.length} events`);
  console.log(`   • ${DUMMY_JUNIOR_MODULES.length} junior modules with chapters`);
}

seedDatabase().catch(console.error);
