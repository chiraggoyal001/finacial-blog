import { BlogPost, NavItem, Module } from "./types";

export const ADMIN_EMAILS = [
  "admin@blog.com",
  "editor@blog.com",
  "author@blog.com",
];

export const NAV_ITEMS: NavItem[] = [
  { label: "Newsletter", href: "/newsletter", description: "Weekly insights delivered to your inbox" },
  { label: "Modules", href: "/modules", description: "Structured learning paths" },
  { label: "Videos", href: "/videos", description: "Visual content library" },
  { label: "Junior", href: "/junior", badge: "Coming Soon", description: "Content for beginners" },
  { label: "Events", href: "/events", badge: "Coming Soon", description: "Upcoming events & webinars" },
  { label: "Financial Services", href: "https://example.com/financial", description: "Bot and other services" },
];

export const SOCIAL_LINKS = {
  youtube: "https://youtube.com",
  instagram: "https://instagram.com",
  twitter: "https://x.com",
  linkedin: "https://linkedin.com",
  facebook: "https://facebook.com",
  whatsapp: "https://whatsapp.com",
};

export const MAJOR_TAGS = ["Markets", "Investing", "Fintech", "Planning", "Economy"];
export const MINOR_TAGS = ["Analysis", "Weekly", "Beginners", "Career", "Banking", "Tax", "Trends", "Deep Dive"];

export const DUMMY_POSTS: BlogPost[] = [
  {
    id: "1",
    title: "Understanding Market Dynamics in 2025",
    excerpt: "A deep dive into the forces shaping global markets this year and what investors should watch for.",
    content: `<p>The global financial markets in 2025 are defined by a complex interplay of geopolitical tensions, central bank policies, and technological disruption.</p>
<h2>Key Drivers</h2>
<p>Interest rates across major economies have begun a cautious descent, with the Federal Reserve signaling further cuts. Meanwhile, emerging markets are seeing renewed capital flows.</p>
<h2>What Investors Should Watch</h2>
<p>Sector rotation continues to favor technology and healthcare, while traditional energy faces headwinds from renewable adoption. The AI boom has created a new class of mega-cap growth stocks that dominate index performance.</p>
<p>Currency markets remain volatile as the dollar index fluctuates between 100 and 105, creating both risks and opportunities for international investors.</p>
<h2>Our Outlook</h2>
<p>We maintain a cautiously optimistic stance for H2 2025, recommending diversified exposure with a tilt toward quality growth names and select emerging market bonds.</p>`,
    category: "Newsletter",
    author: "Editorial Team",
    date: "2025-06-25",
    image: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600&h=400&fit=crop",
    readTime: "5 min",
    tags: [{ name: "Markets", type: "major" }, { name: "Analysis", type: "minor" }],
    views: 1240,
    likes: 89,
  },
  {
    id: "2",
    title: "Beginner's Guide to Financial Planning",
    excerpt: "Everything you need to know to start your financial planning journey from scratch.",
    content: `<p>Financial planning is the cornerstone of building long-term wealth and security. Whether you're fresh out of college or mid-career, it's never too late to start.</p>
<h2>Step 1: Assess Your Current Position</h2>
<p>List all your assets, liabilities, income sources, and monthly expenses. This gives you a clear picture of where you stand financially.</p>
<h2>Step 2: Set SMART Goals</h2>
<p>Your goals should be Specific, Measurable, Achievable, Relevant, and Time-bound. Examples include building a 6-month emergency fund or saving for a home down payment.</p>
<h2>Step 3: Create a Budget</h2>
<p>The 50/30/20 rule is a great starting point — 50% needs, 30% wants, 20% savings and investments.</p>`,
    category: "Modules",
    author: "Editorial Team",
    date: "2025-06-20",
    image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&h=400&fit=crop",
    readTime: "8 min",
    tags: [{ name: "Planning", type: "major" }, { name: "Beginners", type: "minor" }],
    views: 980,
    likes: 124,
  },
  {
    id: "3",
    title: "Weekly Market Wrap: Key Takeaways",
    excerpt: "This week's top market movements, earnings reports, and economic indicators summarized.",
    content: `<p>Markets ended the week on a positive note, with the S&P 500 gaining 1.2% and the Nifty 50 touching new highs.</p>
<h2>Earnings Highlights</h2>
<p>Tech giants reported better-than-expected earnings, driven by AI infrastructure spending. Consumer staples showed resilience despite inflationary pressures.</p>
<h2>Economic Data</h2>
<p>Inflation came in at 3.1%, slightly below expectations. Employment numbers remained strong with 180K new jobs added.</p>`,
    category: "Newsletter",
    author: "Editorial Team",
    date: "2025-06-18",
    image: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=600&h=400&fit=crop",
    readTime: "4 min",
    tags: [{ name: "Markets", type: "major" }, { name: "Weekly", type: "minor" }],
    views: 2100,
    likes: 156,
  },
  {
    id: "4",
    title: "Investment Strategies for Young Professionals",
    excerpt: "How to build a strong portfolio even when you're just starting your career.",
    content: `<p>Starting to invest early is one of the most powerful financial decisions you can make. Compound interest works best with time on your side.</p>
<h2>Start with Index Funds</h2>
<p>Low-cost index funds provide instant diversification and have historically outperformed most actively managed funds over long periods.</p>
<h2>The Power of SIP</h2>
<p>Systematic Investment Plans allow you to invest fixed amounts regularly, averaging out market volatility over time.</p>`,
    category: "Modules",
    author: "Editorial Team",
    date: "2025-06-15",
    image: "https://images.unsplash.com/photo-1579532537598-459ecdaf39cc?w=600&h=400&fit=crop",
    readTime: "6 min",
    tags: [{ name: "Investing", type: "major" }, { name: "Career", type: "minor" }],
    views: 760,
    likes: 95,
  },
  {
    id: "5",
    title: "The Rise of Digital Banking",
    excerpt: "How fintech is reshaping the banking landscape and what it means for consumers.",
    content: `<p>Digital banking has transformed from a convenience to a necessity. Neo-banks and fintech platforms are challenging traditional banking models.</p>
<h2>Key Trends</h2>
<p>Open banking APIs, embedded finance, and AI-driven credit scoring are reshaping how financial services are delivered.</p>
<h2>Impact on Consumers</h2>
<p>Lower fees, faster transactions, and more personalized financial products are benefiting consumers across all income levels.</p>`,
    category: "Videos",
    author: "Editorial Team",
    date: "2025-06-12",
    image: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=600&h=400&fit=crop",
    readTime: "7 min",
    tags: [{ name: "Fintech", type: "major" }, { name: "Banking", type: "minor" }],
    views: 1560,
    likes: 210,
  },
  {
    id: "6",
    title: "Tax Planning Essentials",
    excerpt: "Smart tax strategies that every individual should know before the end of the financial year.",
    content: `<p>Tax planning is not about evasion — it's about legally optimizing your tax liability through smart financial decisions.</p>
<h2>Section 80C Investments</h2>
<p>ELSS mutual funds, PPF, and life insurance premiums qualify for deductions up to ₹1.5 lakh under Section 80C.</p>
<h2>Health Insurance Benefits</h2>
<p>Premiums paid for health insurance qualify for deductions under Section 80D, providing both coverage and tax savings.</p>`,
    category: "Modules",
    author: "Editorial Team",
    date: "2025-06-10",
    image: "https://images.unsplash.com/photo-1554224154-26032ffc0d07?w=600&h=400&fit=crop",
    readTime: "5 min",
    tags: [{ name: "Planning", type: "major" }, { name: "Tax", type: "minor" }],
    views: 890,
    likes: 67,
  },
  {
    id: "7",
    title: "Global Economy Outlook: Q3 2025",
    excerpt: "What the latest macroeconomic data tells us about the rest of the year.",
    content: `<p>The global economy is navigating a complex landscape of recovery and uncertainty as we enter Q3 2025.</p>
<h2>Growth Projections</h2>
<p>The IMF projects global GDP growth at 3.2% for 2025, with emerging Asia leading at 5.1%. Advanced economies are expected to grow at a modest 1.8%.</p>
<h2>Risks to Watch</h2>
<p>Geopolitical tensions, supply chain disruptions, and the lagged effects of monetary tightening remain key downside risks.</p>`,
    category: "Newsletter",
    author: "Editorial Team",
    date: "2025-06-08",
    image: "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=600&h=400&fit=crop",
    readTime: "6 min",
    tags: [{ name: "Economy", type: "major" }, { name: "Deep Dive", type: "minor" }],
    views: 1890,
    likes: 143,
  },
  {
    id: "8",
    title: "Crypto Market Update: Regulation Era",
    excerpt: "How new global regulations are shaping the cryptocurrency landscape.",
    content: `<p>2025 marks a turning point for cryptocurrency regulation worldwide, with major economies implementing comprehensive frameworks.</p>
<h2>US Framework</h2>
<p>The SEC's new guidelines provide clarity on which digital assets qualify as securities, bringing much-needed regulatory certainty.</p>
<h2>Impact on Markets</h2>
<p>Institutional adoption has accelerated post-regulation, with Bitcoin ETFs accumulating over $100 billion in assets.</p>`,
    category: "Newsletter",
    author: "Editorial Team",
    date: "2025-06-05",
    image: "https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=600&h=400&fit=crop",
    readTime: "5 min",
    tags: [{ name: "Fintech", type: "major" }, { name: "Trends", type: "minor" }],
    views: 3200,
    likes: 278,
  },
];

export const OTHER_PRODUCTS = [
  { name: "Wealth Advisory", href: "#", description: "Personalized wealth management" },
  { name: "Trading Platform", href: "#", description: "Advanced trading tools" },
  { name: "Insurance Hub", href: "#", description: "Compare and buy policies" },
  { name: "Credit Services", href: "#", description: "Loans and credit solutions" },
];
