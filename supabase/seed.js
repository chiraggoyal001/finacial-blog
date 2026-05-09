// =====================================================
// SEED SCRIPT: Migrate dummy data to Supabase
// Run: node supabase/seed.js
// Requires: npm install dotenv @supabase/supabase-js
// =====================================================

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: VITE_SUPABASE_URL and VITE_SUPABASE_KEY must be set in .env file');
  console.log('\n💡 Make sure your .env file contains:');
  console.log('VITE_SUPABASE_URL=https://your-project.supabase.co');
  console.log('VITE_SUPABASE_KEY=your-anon-key');
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
    content: `<p>The global financial markets in 2025 are defined by a complex interplay of geopolitical tensions, central bank policies, and technological disruption.</p><h2>Key Drivers</h2><p>Interest rates across major economies have begun a cautious descent, with the Federal Reserve signaling further cuts. Meanwhile, emerging markets are seeing renewed capital flows.</p><h2>What Investors Should Watch</h2><p>Sector rotation continues to favor technology and healthcare, while traditional energy faces headwinds from renewable adoption.</p><h2>Our Outlook</h2><p>We maintain a cautiously optimistic stance for H2 2025, recommending diversified exposure with a tilt toward quality growth names.</p>`,
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
    content: `<p>Financial planning is the cornerstone of building long-term wealth and security. Whether you're fresh out of college or mid-career, it's never too late to start.</p><h2>Step 1: Assess Your Current Position</h2><p>List all your assets, liabilities, income sources, and monthly expenses. This gives you a clear picture of where you stand financially.</p><h2>Step 2: Set SMART Goals</h2><p>Your goals should be Specific, Measurable, Achievable, Relevant, and Time-bound.</p><h2>Step 3: Create a Budget</h2><p>The 50/30/20 rule is a great starting point — 50% needs, 30% wants, 20% savings and investments.</p>`,
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
    content: `<p>Markets ended the week on a positive note, with the S&P 500 gaining 1.2% and the Nifty 50 touching new highs.</p><h2>Earnings Highlights</h2><p>Tech giants reported better-than-expected earnings, driven by AI infrastructure spending.</p><h2>Economic Data</h2><p>Inflation came in at 3.1%, slightly below expectations. Employment numbers remained strong.</p>`,
    category: "Newsletter",
    author_name: "Editorial Team",
    image: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=600&h=400&fit=crop",
    read_time: "4 min",
    tags: [{ name: "Markets", type: "major" }, { name: "Weekly", type: "minor" }],
    views: 2100,
    likes: 156,
    is_published: true,
  },
  {
    title: "Investment Strategies for Young Professionals",
    excerpt: "How to build a strong portfolio even when you're just starting your career.",
    content: `<p>Starting to invest early is one of the most powerful financial decisions you can make. Compound interest works best with time on your side.</p><h2>Start with Index Funds</h2><p>Low-cost index funds provide instant diversification and have historically outperformed most actively managed funds.</p><h2>The Power of SIP</h2><p>Systematic Investment Plans allow you to invest fixed amounts regularly, averaging out market volatility.</p>`,
    category: "Modules",
    author_name: "Editorial Team",
    image: "https://images.unsplash.com/photo-1579532537598-459ecdaf39cc?w=600&h=400&fit=crop",
    read_time: "6 min",
    tags: [{ name: "Investing", type: "major" }, { name: "Career", type: "minor" }],
    views: 760,
    likes: 95,
    is_published: true,
  },
  {
    title: "The Rise of Digital Banking",
    excerpt: "How fintech is reshaping the banking landscape and what it means for consumers.",
    content: `<p>Digital banking has transformed from a convenience to a necessity. Neo-banks and fintech platforms are challenging traditional banking models.</p><h2>Key Trends</h2><p>Open banking APIs, embedded finance, and AI-driven credit scoring are reshaping how financial services are delivered.</p><h2>Impact on Consumers</h2><p>Lower fees, faster transactions, and more personalized financial products are benefiting consumers.</p>`,
    category: "Videos",
    author_name: "Editorial Team",
    image: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=600&h=400&fit=crop",
    read_time: "7 min",
    tags: [{ name: "Fintech", type: "major" }, { name: "Banking", type: "minor" }],
    views: 1560,
    likes: 210,
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
        content: `<p>A stock market is a marketplace where shares of publicly listed companies are traded. It serves as a platform for companies to raise capital and for investors to build wealth.</p><h2>How It Works</h2><p>Companies list their shares through an Initial Public Offering (IPO). Once listed, shares are traded between investors on the exchange.</p><h2>Major Exchanges</h2><p>The world's largest stock exchanges include the NYSE, NASDAQ, London Stock Exchange, and Tokyo Stock Exchange.</p>`,
        read_time: "8 min",
        tags: [{ name: "Investing", type: "major" }, { name: "Beginners", type: "minor" }],
      },
      {
        title: "Types of Stocks",
        content: `<p>Stocks can be classified into several categories based on various factors like market capitalization, growth potential, and dividend payout.</p><h2>By Market Cap</h2><p>Large-cap stocks are well-established companies with market caps over $10 billion.</p><h2>Growth vs Value</h2><p>Growth stocks are companies expected to grow faster than the market average.</p>`,
        read_time: "10 min",
        tags: [{ name: "Investing", type: "major" }, { name: "Analysis", type: "minor" }],
      },
    ],
  },
  {
    title: "Personal Finance Mastery",
    description: "A comprehensive guide to managing your money, budgeting, and planning for the future.",
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
        content: `<p>Budgeting is the foundation of personal finance. It helps you understand where your money goes.</p><h2>The 50/30/20 Rule</h2><p>Allocate 50% of income to needs, 30% to wants, and 20% to savings and investments.</p><h2>Tracking Expenses</h2><p>Use apps or spreadsheets to track every expense for at least 3 months.</p>`,
        read_time: "8 min",
        tags: [{ name: "Planning", type: "major" }, { name: "Beginners", type: "minor" }],
      },
    ],
  },
];

const DUMMY_VIDEO_SERIES = [
  {
    title: "Stock Market Fundamentals — Video Course",
    description: "Visual walkthroughs of core stock market concepts with real-world examples.",
    thumbnail: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600&h=400&fit=crop",
    tag: { name: "Investing", type: "major" },
    total_duration: "1h 15min",
    linked_module_id: null,
    views: 5400,
    likes: 320,
    is_published: true,
    chapters: [
      {
        title: "Introduction to Stock Markets",
        video_url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        duration: "14:32",
        description: "An overview of what stock markets are and how they function.",
        tags: [{ name: "Investing", type: "major" }, { name: "Beginners", type: "minor" }],
      },
      {
        title: "Understanding Stock Prices",
        video_url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        duration: "18:45",
        description: "Learn what drives stock prices up and down.",
        tags: [{ name: "Investing", type: "major" }, { name: "Analysis", type: "minor" }],
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
    registration_url: "#",
    capacity: 100,
    registered: 67,
    is_published: true,
  },
  {
    title: "Personal Finance Quiz Night",
    description: "Test your financial literacy in a fun, competitive quiz.",
    type: "quiz",
    date: "2026-04-25",
    time: "19:00 - 21:00",
    location: "Online",
    image: "https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?w=600",
    tags: [{ name: "Planning", type: "major" }, { name: "Beginners", type: "minor" }],
    is_upcoming: true,
    registration_url: "#",
    capacity: 500,
    registered: 312,
    is_published: true,
  },
];

const DUMMY_JUNIOR_MODULES = [
  {
    title: "What is Money? 💰",
    description: "A fun, animated journey into how money works — from bartering to digital payments!",
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
      {
        title: "💳 Paper to Plastic",
        content_type: "video",
        content: "From paper notes to credit cards — how payment evolved.",
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

  // 1. Seed Articles
  console.log('📄 Seeding articles...');
  for (const post of DUMMY_POSTS) {
    const { error } = await supabase.from('articles').insert({
      title: post.title,
      excerpt: post.excerpt,
      content: post.content,
      category: post.category,
      author_name: post.author_name,
      image: post.image,
      read_time: post.read_time,
      tags: post.tags,
      views: post.views || 0,
      likes: post.likes || 0,
      is_published: post.is_published,
    });
    if (error) console.error('❌ Error inserting article:', error.message);
    else console.log(`  ✓ ${post.title}`);
  }
  console.log('');

  // 2. Seed Modules
  console.log('📚 Seeding modules...');
  for (const module of DUMMY_MODULES) {
    const { data: moduleData, error: moduleError } = await supabase.from('modules').insert({
      title: module.title,
      description: module.description,
      image: module.image,
      tag: module.tag,
      total_read_time: module.total_read_time,
      youtube_playlist: module.youtube_playlist,
      views: module.views || 0,
      likes: module.likes || 0,
      is_published: module.is_published,
    }).select().single();

    if (moduleError) {
      console.error('❌ Error inserting module:', moduleError.message);
      continue;
    }
    console.log(`  ✓ ${module.title}`);

    // Seed module chapters
    for (let i = 0; i < module.chapters.length; i++) {
      const chapter = module.chapters[i];
      const { error: chapterError } = await supabase.from('module_chapters').insert({
        module_id: moduleData.id,
        title: chapter.title,
        content: chapter.content,
        read_time: chapter.read_time,
        tags: chapter.tags,
        sort_order: i,
      });
      if (chapterError) console.error('❌ Error inserting chapter:', chapterError.message);
    }
  }
  console.log('');

  // 3. Seed Video Series
  console.log('🎬 Seeding video series...');
  for (const series of DUMMY_VIDEO_SERIES) {
    const { data: seriesData, error: seriesError } = await supabase.from('video_series').insert({
      title: series.title,
      description: series.description,
      thumbnail: series.thumbnail,
      tag: series.tag,
      total_duration: series.total_duration,
      linked_module_id: series.linked_module_id,
      views: series.views || 0,
      likes: series.likes || 0,
      is_published: series.is_published,
    }).select().single();

    if (seriesError) {
      console.error('❌ Error inserting video series:', seriesError.message);
      continue;
    }
    console.log(`  ✓ ${series.title}`);

    // Seed video chapters
    for (let i = 0; i < series.chapters.length; i++) {
      const chapter = series.chapters[i];
      const { error: chapterError } = await supabase.from('video_chapters').insert({
        series_id: seriesData.id,
        title: chapter.title,
        video_url: chapter.video_url,
        duration: chapter.duration,
        description: chapter.description,
        tags: chapter.tags,
        sort_order: i,
      });
      if (chapterError) console.error('❌ Error inserting video chapter:', chapterError.message);
    }
  }
  console.log('');

  // 4. Seed Events
  console.log('📅 Seeding events...');
  for (const event of DUMMY_EVENTS) {
    const { error } = await supabase.from('events').insert({
      title: event.title,
      description: event.description,
      type: event.type,
      date: event.date,
      time: event.time,
      location: event.location,
      image: event.image,
      tags: event.tags,
      is_upcoming: event.is_upcoming,
      registration_url: event.registration_url,
      capacity: event.capacity,
      registered: event.registered || 0,
      is_published: event.is_published,
    });
    if (error) console.error('❌ Error inserting event:', error.message);
    else console.log(`  ✓ ${event.title}`);
  }
  console.log('');

  // 5. Seed Junior Modules
  console.log('🎓 Seeding junior modules...');
  for (const module of DUMMY_JUNIOR_MODULES) {
    const { data: moduleData, error: moduleError } = await supabase.from('junior_modules').insert({
      title: module.title,
      description: module.description,
      image: module.image,
      tag: module.tag,
      content_type: module.content_type,
      total_duration: module.total_duration,
      views: module.views || 0,
      likes: module.likes || 0,
      is_published: module.is_published,
    }).select().single();

    if (moduleError) {
      console.error('❌ Error inserting junior module:', moduleError.message);
      continue;
    }
    console.log(`  ✓ ${module.title}`);

    // Seed junior chapters
    for (let i = 0; i < module.chapters.length; i++) {
      const chapter = module.chapters[i];
      const { error: chapterError } = await supabase.from('junior_chapters').insert({
        module_id: moduleData.id,
        title: chapter.title,
        content_type: chapter.content_type,
        content: chapter.content,
        video_url: chapter.video_url,
        duration: chapter.duration,
        tags: chapter.tags,
        illustration: chapter.illustration,
        sort_order: i,
      });
      if (chapterError) console.error('❌ Error inserting junior chapter:', chapterError.message);
    }
  }

  console.log('\n✅ Database seeding completed!');
}

// Run seeding
seedDatabase().catch((err) => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
