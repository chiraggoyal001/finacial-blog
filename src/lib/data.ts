import { BlogPost, NavItem, Module, VideoSeries, BlogEvent, JuniorModule, QuizQuestion } from "./types";

// Reusable quiz question sets
const STOCK_MARKET_QUIZ: QuizQuestion[] = [
  { id: "q1", question: "What is an IPO?", type: "mcq", options: [{ label: "Initial Public Offering", isCorrect: true }, { label: "Internal Profit Order", isCorrect: false }, { label: "Investment Portfolio Option", isCorrect: false }, { label: "Index Price Objective", isCorrect: false }] },
  { id: "q2", question: "NSE is the largest stock exchange in India.", type: "true-false", options: [{ label: "True", isCorrect: true }, { label: "False", isCorrect: false }] },
  { id: "q3", question: "The full form of SEBI is Securities and Exchange Board of _____.", type: "fill-blank", options: [], correctAnswer: "India" },
];
const STOCK_TYPES_QUIZ: QuizQuestion[] = [
  { id: "q4", question: "What defines a large-cap stock?", type: "mcq", options: [{ label: "Market cap over $10 billion", isCorrect: true }, { label: "Stock price over $100", isCorrect: false }, { label: "Over 10,000 employees", isCorrect: false }, { label: "Listed for over 10 years", isCorrect: false }] },
  { id: "q5", question: "Which of the following are types of stocks?", type: "multi-select", options: [{ label: "Growth stocks", isCorrect: true }, { label: "Value stocks", isCorrect: true }, { label: "Savings stocks", isCorrect: false }, { label: "Dividend stocks", isCorrect: true }] },
  { id: "q6", question: "Blue-chip stocks are generally considered safe investments.", type: "true-false", options: [{ label: "True", isCorrect: true }, { label: "False", isCorrect: false }] },
];
const FINANCIAL_STATEMENTS_QUIZ: QuizQuestion[] = [
  { id: "q7", question: "Which statement shows revenue and expenses?", type: "mcq", options: [{ label: "Balance Sheet", isCorrect: false }, { label: "Income Statement", isCorrect: true }, { label: "Cash Flow Statement", isCorrect: false }, { label: "Notes to Accounts", isCorrect: false }] },
  { id: "q8", question: "The three main financial statements are Balance Sheet, Income Statement, and _____ Statement.", type: "fill-blank", options: [], correctAnswer: "Cash Flow" },
];
const BUDGETING_QUIZ: QuizQuestion[] = [
  { id: "q9", question: "In the 50/30/20 rule, what does the 20% represent?", type: "mcq", options: [{ label: "Needs", isCorrect: false }, { label: "Wants", isCorrect: false }, { label: "Savings & investments", isCorrect: true }, { label: "Taxes", isCorrect: false }] },
  { id: "q10", question: "Select all valid budgeting methods:", type: "multi-select", options: [{ label: "50/30/20 rule", isCorrect: true }, { label: "Zero-based budgeting", isCorrect: true }, { label: "Random spending", isCorrect: false }, { label: "Envelope method", isCorrect: true }] },
];
const VIDEO_INTRO_QUIZ: QuizQuestion[] = [
  { id: "vq1", question: "What is the primary purpose of a stock market?", type: "mcq", options: [{ label: "For companies to raise capital and investors to trade", isCorrect: true }, { label: "To store physical gold", isCorrect: false }, { label: "To print currency", isCorrect: false }, { label: "To manage bank accounts", isCorrect: false }] },
  { id: "vq2", question: "Stock prices are determined by supply and demand.", type: "true-false", options: [{ label: "True", isCorrect: true }, { label: "False", isCorrect: false }] },
];
const JUNIOR_INVESTING_QUIZ: QuizQuestion[] = [
  { id: "jq1", question: "What is investing like?", type: "mcq", options: [{ label: "Planting a seed and watching it grow 🌱", isCorrect: true }, { label: "Spending all your money at once", isCorrect: false }, { label: "Hiding money under the bed", isCorrect: false }, { label: "Giving money away", isCorrect: false }] },
  { id: "jq2", question: "Compound interest means earning interest on your interest too!", type: "true-false", options: [{ label: "True", isCorrect: true }, { label: "False", isCorrect: false }] },
];
const JUNIOR_MONEY_QUIZ: QuizQuestion[] = [
  { id: "jq3", question: "What came before coins?", type: "mcq", options: [{ label: "Credit cards", isCorrect: false }, { label: "Bartering (trading goods)", isCorrect: true }, { label: "Digital wallets", isCorrect: false }, { label: "Checks", isCorrect: false }] },
  { id: "jq4", question: "UPI stands for Unified _____ Interface.", type: "fill-blank", options: [], correctAnswer: "Payments" },
];
const JUNIOR_BANKING_SAFETY_QUIZ: QuizQuestion[] = [
  { id: "jq5", question: "If someone calls saying they're from the bank and asks for your OTP, what should you do?", type: "mcq", options: [{ label: "Give them the OTP to verify your account", isCorrect: false }, { label: "HANG UP! Banks never ask for OTPs over the phone.", isCorrect: true }, { label: "Ask them to hold while you check with your friend", isCorrect: false }, { label: "Give them your PIN instead", isCorrect: false }] },
];

export const ADMIN_EMAILS = [
  "admin@blog.com",
  "editor@blog.com",
  "author@blog.com",
];

export const NAV_ITEMS: NavItem[] = [
  { label: "Newsletter", href: "/newsletter", description: "Weekly insights delivered to your inbox" },
  { label: "Modules", href: "/modules", description: "Structured learning paths" },
  { label: "Videos", href: "/videos", description: "Visual content library" },
  { label: "Junior", href: "/junior", description: "Content for beginners" },
  { label: "Events", href: "/events", description: "Upcoming events & webinars" },
  { label: "Financial Services", href: "https://example.com/financial", description: "Bot and other services" },
];

export const SOCIAL_LINKS = {
  youtube: "https://www.youtube.com/@KamadaApp",
  instagram: "https://www.instagram.com/kamada.app/",
  twitter: "https://x.com/Kamada_Wealth",
  linkedin: "https://www.linkedin.com/company/kamada-wealth/",
  facebook: "https://www.facebook.com/profile.php?id=61590046643761",
  whatsapp: "https://chat.whatsapp.com/IAdyFwUMEgDA5CaH3KzzR3",
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

export const DUMMY_MODULES: Module[] = [
  {
    id: "m1",
    title: "Stock Market Fundamentals",
    description: "Learn the basics of stock markets, how they work, and how to start investing wisely.",
    image: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600&h=400&fit=crop",
    tag: { name: "Investing", type: "major" },
    totalReadTime: "45 min",
    youtubePlaylist: "https://youtube.com/playlist?list=example1",
    views: 3200,
    likes: 245,
    chapters: [
      {
        id: "m1c1",
        title: "What is a Stock Market?",
        content: `<p>A stock market is a marketplace where shares of publicly listed companies are traded. It serves as a platform for companies to raise capital and for investors to build wealth.</p><h2>How It Works</h2><p>Companies list their shares through an Initial Public Offering (IPO). Once listed, shares are traded between investors on the exchange. Prices are determined by supply and demand dynamics.</p><h2>Major Exchanges</h2><p>The world's largest stock exchanges include the NYSE, NASDAQ, London Stock Exchange, and Tokyo Stock Exchange. In India, BSE and NSE are the primary exchanges.</p>`,
        readTime: "8 min",
        tags: [{ name: "Investing", type: "major" }, { name: "Beginners", type: "minor" }],
        quizQuestions: STOCK_MARKET_QUIZ,
      },
      {
        id: "m1c2",
        title: "Types of Stocks",
        content: `<p>Stocks can be classified into several categories based on various factors like market capitalization, growth potential, and dividend payout.</p><h2>By Market Cap</h2><p>Large-cap stocks are well-established companies with market caps over $10 billion. Mid-cap stocks range from $2-10 billion, while small-cap stocks are below $2 billion.</p><h2>Growth vs Value</h2><p>Growth stocks are companies expected to grow faster than the market average. Value stocks trade below their intrinsic value, offering potential upside.</p>`,
        readTime: "10 min",
        tags: [{ name: "Investing", type: "major" }, { name: "Analysis", type: "minor" }],
        quizQuestions: STOCK_TYPES_QUIZ,
      },
      {
        id: "m1c3",
        title: "Reading Financial Statements",
        content: `<p>Understanding financial statements is crucial for making informed investment decisions.</p><h2>Income Statement</h2><p>Shows revenue, expenses, and profit over a period. Key metrics include revenue growth, operating margin, and net profit margin.</p><h2>Balance Sheet</h2><p>A snapshot of a company's assets, liabilities, and equity at a point in time. Look at debt-to-equity ratio and current ratio.</p><h2>Cash Flow Statement</h2><p>Tracks the actual cash moving in and out. Free cash flow is a key indicator of financial health.</p>`,
        readTime: "12 min",
        tags: [{ name: "Investing", type: "major" }, { name: "Deep Dive", type: "minor" }],
        quizQuestions: FINANCIAL_STATEMENTS_QUIZ,
      },
      {
        id: "m1c4",
        title: "Building Your First Portfolio",
        content: `<p>A well-constructed portfolio balances risk and return according to your financial goals and risk tolerance.</p><h2>Diversification</h2><p>Don't put all your eggs in one basket. Spread investments across different sectors, asset classes, and geographies.</p><h2>Asset Allocation</h2><p>A common rule of thumb: subtract your age from 100 to determine the percentage allocated to equities. The rest goes into bonds and fixed income.</p><h2>Rebalancing</h2><p>Review and rebalance your portfolio periodically — at least once a year — to maintain your target allocation.</p>`,
        readTime: "15 min",
        tags: [{ name: "Investing", type: "major" }, { name: "Planning", type: "minor" }],
      },
    ],
  },
  {
    id: "m2",
    title: "Personal Finance Mastery",
    description: "A comprehensive guide to managing your money, budgeting, and planning for the future.",
    image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&h=400&fit=crop",
    tag: { name: "Planning", type: "major" },
    totalReadTime: "35 min",
    youtubePlaylist: "https://youtube.com/playlist?list=example2",
    views: 2800,
    likes: 312,
    chapters: [
      {
        id: "m2c1",
        title: "Budgeting 101",
        content: `<p>Budgeting is the foundation of personal finance. It helps you understand where your money goes and take control of your spending.</p><h2>The 50/30/20 Rule</h2><p>Allocate 50% of income to needs, 30% to wants, and 20% to savings and investments. This simple framework works for most income levels.</p><h2>Tracking Expenses</h2><p>Use apps or spreadsheets to track every expense for at least 3 months. You'll be surprised at where your money actually goes.</p>`,
        readTime: "8 min",
        tags: [{ name: "Planning", type: "major" }, { name: "Beginners", type: "minor" }],
        quizQuestions: BUDGETING_QUIZ,
      },
      {
        id: "m2c2",
        title: "Emergency Funds & Insurance",
        content: `<p>Before you start investing, ensure you have a financial safety net in place.</p><h2>Emergency Fund</h2><p>Aim for 3-6 months of living expenses in a liquid, easily accessible account. This protects you from unexpected events like job loss or medical emergencies.</p><h2>Insurance Essentials</h2><p>Health insurance and term life insurance are non-negotiable. Consider disability insurance if your employer doesn't provide it.</p>`,
        readTime: "10 min",
        tags: [{ name: "Planning", type: "major" }, { name: "Beginners", type: "minor" }],
      },
      {
        id: "m2c3",
        title: "Retirement Planning",
        content: `<p>It's never too early to start planning for retirement. The power of compounding makes early contributions incredibly valuable.</p><h2>Employer-Sponsored Plans</h2><p>Always contribute enough to get the full employer match — it's essentially free money. Increase contributions by 1% each year.</p><h2>Individual Retirement Accounts</h2><p>IRAs offer tax advantages for retirement savings. Choose between traditional (tax-deferred) and Roth (tax-free growth) based on your current vs. expected future tax rate.</p>`,
        readTime: "12 min",
        tags: [{ name: "Planning", type: "major" }, { name: "Deep Dive", type: "minor" }],
      },
    ],
  },
  {
    id: "m3",
    title: "Fintech Revolution",
    description: "Explore how technology is disrupting traditional finance — from digital payments to DeFi.",
    image: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=600&h=400&fit=crop",
    tag: { name: "Fintech", type: "major" },
    totalReadTime: "30 min",
    views: 1950,
    likes: 178,
    chapters: [
      {
        id: "m3c1",
        title: "Digital Payments Landscape",
        content: `<p>Digital payments have fundamentally changed how money moves around the world.</p><h2>UPI & Mobile Wallets</h2><p>India's UPI processes over 10 billion transactions monthly, making it the world's largest real-time payment system. Mobile wallets have brought banking to millions of unbanked individuals.</p><h2>Cross-Border Payments</h2><p>Traditional cross-border payments are slow and expensive. Fintech solutions are reducing costs and settlement times dramatically.</p>`,
        readTime: "8 min",
        tags: [{ name: "Fintech", type: "major" }, { name: "Trends", type: "minor" }],
      },
      {
        id: "m3c2",
        title: "Blockchain & DeFi Basics",
        content: `<p>Blockchain technology and Decentralized Finance (DeFi) represent a paradigm shift in financial services.</p><h2>How Blockchain Works</h2><p>A blockchain is a distributed ledger that records transactions across many computers. It's immutable, transparent, and doesn't require a central authority.</p><h2>DeFi Applications</h2><p>DeFi protocols offer lending, borrowing, trading, and yield farming without traditional intermediaries. However, they come with smart contract risks and regulatory uncertainty.</p>`,
        readTime: "10 min",
        tags: [{ name: "Fintech", type: "major" }, { name: "Deep Dive", type: "minor" }],
      },
      {
        id: "m3c3",
        title: "AI in Financial Services",
        content: `<p>Artificial intelligence is transforming every aspect of financial services, from customer service to risk management.</p><h2>Robo-Advisors</h2><p>AI-powered robo-advisors provide automated, algorithm-driven financial planning with minimal human supervision. They've democratized wealth management.</p><h2>Fraud Detection</h2><p>Machine learning models analyze millions of transactions in real-time to detect and prevent fraudulent activity with far greater accuracy than traditional rule-based systems.</p>`,
        readTime: "12 min",
        tags: [{ name: "Fintech", type: "major" }, { name: "Trends", type: "minor" }],
      },
    ],
  },
  {
    id: "m4",
    title: "Advanced Financial Planning",
    description: "Deep dive into advanced financial planning strategies for experienced investors.",
    image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&h=400&fit=crop",
    tag: { name: "Planning", type: "major" },
    totalReadTime: "40 min",
    views: 1100,
    likes: 130,
    chapters: [
      {
        id: "m4c1",
        title: "Assessing Your Current Position",
        content: `<p>List all your assets, liabilities, income sources, and monthly expenses. This gives you a clear picture of where you stand financially.</p>`,
        readTime: "10 min",
        tags: [{ name: "Planning", type: "major" }, { name: "Beginners", type: "minor" }],
      },
      {
        id: "m4c2",
        title: "Setting SMART Goals",
        content: `<p>Your goals should be Specific, Measurable, Achievable, Relevant, and Time-bound. Examples include building a 6-month emergency fund or saving for a home down payment.</p>`,
        readTime: "15 min",
        tags: [{ name: "Planning", type: "major" }, { name: "Beginners", type: "minor" }],
      },
      {
        id: "m4c3",
        title: "Creating a Budget",
        content: `<p>The 50/30/20 rule is a great starting point — 50% needs, 30% wants, 20% savings and investments.</p>`,
        readTime: "15 min",
        tags: [{ name: "Planning", type: "major" }, { name: "Beginners", type: "minor" }],
        quizQuestions: BUDGETING_QUIZ,
      }
    ],
  },
];

export const DUMMY_VIDEO_SERIES: VideoSeries[] = [
  {
    id: "v1",
    title: "Stock Market Fundamentals — Video Course",
    description: "Visual walkthroughs of core stock market concepts with real-world examples.",
    thumbnail: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600&h=400&fit=crop",
    tag: { name: "Investing", type: "major" },
    totalDuration: "1h 15min",
    linkedModuleId: "m1",
    views: 5400,
    likes: 320,
    chapters: [
      {
        id: "v1c1",
        title: "Introduction to Stock Markets",
        videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        duration: "14:32",
        description: "An overview of what stock markets are, how they function, and why they matter for wealth building.",
        tags: [{ name: "Investing", type: "major" }, { name: "Beginners", type: "minor" }],
        quizQuestions: VIDEO_INTRO_QUIZ,
      },
      {
        id: "v1c2",
        title: "Understanding Stock Prices",
        videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        duration: "18:45",
        description: "Learn what drives stock prices up and down — supply, demand, earnings, and market sentiment.",
        tags: [{ name: "Investing", type: "major" }, { name: "Analysis", type: "minor" }],
      },
      {
        id: "v1c3",
        title: "How to Read Charts",
        videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        duration: "22:10",
        description: "Candlestick charts, moving averages, and volume indicators explained visually.",
        tags: [{ name: "Investing", type: "major" }, { name: "Deep Dive", type: "minor" }],
      },
      {
        id: "v1c4",
        title: "Placing Your First Trade",
        videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        duration: "19:48",
        description: "Step-by-step walkthrough of placing market and limit orders on a trading platform.",
        tags: [{ name: "Investing", type: "major" }, { name: "Beginners", type: "minor" }],
      },
    ],
  },
  {
    id: "v2",
    title: "Personal Finance Essentials",
    description: "Practical video lessons on budgeting, saving, and building long-term wealth.",
    thumbnail: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&h=400&fit=crop",
    tag: { name: "Planning", type: "major" },
    totalDuration: "55min",
    linkedModuleId: "m2",
    views: 3800,
    likes: 275,
    chapters: [
      {
        id: "v2c1",
        title: "Budgeting That Actually Works",
        videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        duration: "16:20",
        description: "Practical budgeting strategies you can implement today using the 50/30/20 framework.",
        tags: [{ name: "Planning", type: "major" }, { name: "Beginners", type: "minor" }],
      },
      {
        id: "v2c2",
        title: "Building an Emergency Fund",
        videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        duration: "12:45",
        description: "Why you need an emergency fund, how much to save, and where to keep it.",
        tags: [{ name: "Planning", type: "major" }, { name: "Beginners", type: "minor" }],
      },
      {
        id: "v2c3",
        title: "Investing for Retirement",
        videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        duration: "25:50",
        description: "Understanding retirement accounts, employer matching, and the power of compounding.",
        tags: [{ name: "Planning", type: "major" }, { name: "Deep Dive", type: "minor" }],
      },
    ],
  },
  {
    id: "v3",
    title: "Fintech Explained",
    description: "How technology is reshaping banking, payments, and financial services globally.",
    thumbnail: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=600&h=400&fit=crop",
    tag: { name: "Fintech", type: "major" },
    totalDuration: "48min",
    linkedModuleId: "m3",
    views: 2900,
    likes: 198,
    chapters: [
      {
        id: "v3c1",
        title: "The Digital Payments Revolution",
        videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        duration: "15:30",
        description: "From UPI to Apple Pay — how digital payments are replacing cash worldwide.",
        tags: [{ name: "Fintech", type: "major" }, { name: "Trends", type: "minor" }],
      },
      {
        id: "v3c2",
        title: "Blockchain Simplified",
        videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        duration: "18:15",
        description: "Understanding blockchain technology without the jargon — what it is and why it matters.",
        tags: [{ name: "Fintech", type: "major" }, { name: "Deep Dive", type: "minor" }],
      },
      {
        id: "v3c3",
        title: "AI-Powered Finance",
        videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        duration: "14:00",
        description: "How artificial intelligence is transforming robo-advisors, fraud detection, and credit scoring.",
        tags: [{ name: "Fintech", type: "major" }, { name: "Trends", type: "minor" }],
      },
    ],
  },
];

export const OTHER_PRODUCTS = [
  { name: "Wealth Advisory", href: "#", description: "Personalized wealth management" },
  { name: "Trading Platform", href: "#", description: "Advanced trading tools" },
  { name: "Insurance Hub", href: "#", description: "Compare and buy policies" },
  { name: "Credit Services", href: "#", description: "Loans and credit solutions" },
];

export const DUMMY_EVENTS: BlogEvent[] = [
  {
    id: "e1",
    title: "Market Outlook 2026 — Community Meetup",
    description: "Join fellow investors for an open discussion on global market trends, portfolio strategies, and macro forecasts for the year ahead.",
    type: "community",
    start_time: "2026-04-20T18:00:00Z",
    end_time: "2026-04-20T20:00:00Z",
    location: "Mumbai",
    image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600",
    tags: [{ name: "Markets", type: "major" }, { name: "Trends", type: "minor" }],
    registrationUrl: "#",
    capacity: 100,
    registered: 67,
  },
  {
    id: "e2",
    title: "Personal Finance Quiz Night",
    description: "Test your financial literacy in a fun, competitive quiz covering budgeting, investments, tax planning, and more.",
    type: "quiz",
    start_time: "2026-04-25T19:00:00Z",
    end_time: "2026-04-25T21:00:00Z",
    location: "Online",
    image: "https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?w=600",
    tags: [{ name: "Planning", type: "major" }, { name: "Beginners", type: "minor" }],
    registrationUrl: "#",
    capacity: 500,
    registered: 312,
  },
  {
    id: "e3",
    title: "Fintech Builders Bootcamp",
    description: "A 3-day intensive bootcamp on building fintech products—covering payments, lending APIs, compliance, and go-to-market strategies.",
    type: "bootcamp",
    start_time: "2026-05-10T09:00:00Z",
    end_time: "2026-05-10T17:00:00Z",
    location: "Bangalore",
    image: "https://images.unsplash.com/photo-1559223607-180d0c35be49?w=600",
    tags: [{ name: "Fintech", type: "major" }, { name: "Career", type: "minor" }],
    registrationUrl: "#",
    capacity: 50,
    registered: 42,
  },
  {
    id: "e4",
    title: "Investment Strategies Workshop",
    description: "A hands-on community workshop exploring value investing, risk management, and portfolio diversification techniques.",
    type: "community",
    start_time: "2026-05-18T10:00:00Z",
    end_time: "2026-05-18T13:00:00Z",
    location: "Online",
    image: "https://images.unsplash.com/photo-1591115765373-5207764f72e7?w=600",
    tags: [{ name: "Investing", type: "major" }, { name: "Deep Dive", type: "minor" }],
    registrationUrl: "#",
    capacity: 200,
    registered: 89,
  },
  {
    id: "e5",
    title: "Tax Planning Quiz Challenge",
    description: "How well do you know tax-saving instruments? Compete in this timed quiz and win exclusive merchandise.",
    type: "quiz",
    start_time: "2026-03-15T17:00:00Z",
    end_time: "2026-03-15T18:30:00Z",
    location: "Online",
    image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600",
    tags: [{ name: "Planning", type: "major" }, { name: "Tax", type: "minor" }],
  },
  {
    id: "e6",
    title: "Data-Driven Trading Bootcamp",
    description: "Learn algorithmic trading fundamentals, backtesting, and Python-based quantitative strategies in this weekend bootcamp.",
    type: "bootcamp",
    start_time: "2026-03-01T09:00:00Z",
    end_time: "2026-03-01T18:00:00Z",
    location: "Delhi",
    image: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600",
    tags: [{ name: "Markets", type: "major" }, { name: "Analysis", type: "minor" }],
  },
];

export const DUMMY_JUNIOR_MODULES: JuniorModule[] = [
  {
    id: "jr-v1",
    title: "What is Money? 💰",
    description: "A fun, animated journey into how money works — from bartering to digital payments!",
    image: "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=600",
    tag: { name: "Basics", type: "major" },
    contentType: "video",
    totalDuration: "25 min",
    chapters: [
      { id: "jr-v1c1", title: "🪙 Barter to Coins", contentType: "video", content: "Discover how people traded before money existed and why coins changed everything.", videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", duration: "8:00", tags: [{ name: "Basics", type: "major" }, { name: "History", type: "minor" }], illustration: "https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=400", quizQuestions: JUNIOR_MONEY_QUIZ },
      { id: "jr-v1c2", title: "💳 Paper to Plastic", contentType: "video", content: "From paper notes to credit cards — how payment evolved over centuries.", videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", duration: "9:30", tags: [{ name: "Basics", type: "major" }, { name: "Trends", type: "minor" }], illustration: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400" },
      { id: "jr-v1c3", title: "📱 Digital Money", contentType: "video", content: "UPI, wallets, crypto — welcome to the future of payments!", videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", duration: "7:30", tags: [{ name: "Fintech", type: "major" }, { name: "Trends", type: "minor" }], illustration: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=400" },
    ],
    views: 2400,
    likes: 380,
  },
  {
    id: "jr-v2",
    title: "Saving vs Spending 🐷",
    description: "Learn the difference between needs and wants, and why your piggy bank is your best friend.",
    image: "https://images.unsplash.com/photo-1633158829585-23ba8f7c8caf?w=600",
    tag: { name: "Planning", type: "major" },
    contentType: "video",
    totalDuration: "18 min",
    chapters: [
      { id: "jr-v2c1", title: "🎯 Needs vs Wants", contentType: "video", content: "Can you tell the difference? Let's play a sorting game!", videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", duration: "6:00", tags: [{ name: "Planning", type: "major" }, { name: "Beginners", type: "minor" }] },
      { id: "jr-v2c2", title: "🏦 Your First Savings Goal", contentType: "video", content: "Pick something you want, make a plan, and watch your savings grow.", videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", duration: "7:00", tags: [{ name: "Planning", type: "major" }, { name: "Beginners", type: "minor" }] },
      { id: "jr-v2c3", title: "🧮 The 50-30-20 Rule (Kid Edition)", contentType: "video", content: "A simple way to split your pocket money like a pro.", videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", duration: "5:00", tags: [{ name: "Planning", type: "major" }, { name: "Beginners", type: "minor" }] },
    ],
    views: 1800,
    likes: 290,
  },
  {
    id: "jr-r1",
    title: "My First Investment 📈",
    description: "A colorful, illustrated guide to understanding stocks, bonds, and why your money can grow on its own.",
    image: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600",
    tag: { name: "Investing", type: "major" },
    contentType: "reading",
    totalReadTime: "15 min",
    chapters: [
      { id: "jr-r1c1", title: "🌱 What is Investing?", contentType: "reading", content: "Imagine planting a seed. You water it, give it sunlight, and over time it grows into a big tree. Investing works the same way!\n\nWhen you invest, you put your money into something — like a company or a fund — and over time, it can grow bigger. This is how people build wealth over many years.\n\n**Key Idea:** Investing = making your money work for you while you sleep! 😴💰\n\n### The Magic of Compound Interest\nIf you save ₹100 and earn 10% every year, after one year you have ₹110. But the next year, you earn 10% on ₹110 — that's ₹121! The growth keeps getting bigger.\n\n### Fun Fact 🎉\nIf you invested ₹1,000 at age 15 with 12% annual returns, by age 60 you'd have over ₹1,60,000 — without adding a single rupee more!", readTime: "5 min", tags: [{ name: "Investing", type: "major" }, { name: "Beginners", type: "minor" }], illustration: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400", quizQuestions: JUNIOR_INVESTING_QUIZ },
      { id: "jr-r1c2", title: "📊 Stocks — Owning a Piece of a Company", contentType: "reading", content: "Have you ever wished you owned a part of your favourite company? With stocks, you can!\n\nA **stock** (or share) is a tiny piece of a company. When you buy a stock, you become a part-owner. If the company does well, your stock becomes more valuable.\n\n### Example\nImagine your friend starts a lemonade stand. She needs ₹100 to buy supplies. You give her ₹50, and she gives you 50% ownership. If the stand makes ₹200, you get ₹100 back — that's a profit of ₹50! 🍋\n\n### Types of Companies\n- **Blue chip:** Big, stable companies (like the popular kid everyone trusts)\n- **Growth stocks:** Smaller companies that might grow fast (like the new kid with big ideas)\n- **Penny stocks:** Very cheap stocks, but very risky (like a mystery box!)\n\n### Remember ⚠️\nStocks go up AND down. Never invest money you can't afford to lose.", readTime: "5 min", tags: [{ name: "Investing", type: "major" }, { name: "Analysis", type: "minor" }], illustration: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=400" },
      { id: "jr-r1c3", title: "🛡️ Bonds — Lending Money Safely", contentType: "reading", content: "If stocks are like owning a slice of pizza, bonds are like lending your pizza and getting it back with extra toppings!\n\nA **bond** is when you lend money to a government or company. In return, they promise to pay you back with interest after a set time.\n\n### How It Works\n1. You lend ₹1,000 to the government\n2. They promise to pay 7% interest per year\n3. After 5 years, you get back ₹1,000 + all the interest earned\n\n### Stocks vs Bonds\n| | Stocks | Bonds |\n|---|---|---|\n| Risk | Higher 📈📉 | Lower 📊 |\n| Returns | Potentially higher | More predictable |\n| You are | An owner | A lender |\n\n### Pro Tip 💡\nA good portfolio has BOTH stocks and bonds — it's like having both adventure and safety in your financial journey!", readTime: "5 min", tags: [{ name: "Investing", type: "major" }, { name: "Beginners", type: "minor" }], illustration: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400" },
    ],
    views: 1200,
    likes: 210,
  },
  {
    id: "jr-r2",
    title: "Banking for Kids 🏦",
    description: "Everything you need to know about banks — why they exist, how accounts work, and how to open your first one!",
    image: "https://images.unsplash.com/photo-1541354329998-f4d9a9f9297f?w=600",
    tag: { name: "Banking", type: "major" },
    contentType: "reading",
    totalReadTime: "12 min",
    chapters: [
      { id: "jr-r2c1", title: "🏛️ Why Do Banks Exist?", contentType: "reading", content: "A long time ago, people kept gold under their beds (not a great idea! 😅). Banks were created as safe places to store money.\n\nToday banks do much more:\n- **Keep your money safe** in an account\n- **Pay you interest** for keeping money with them\n- **Lend money** to people who need it (loans)\n- **Help you pay** bills and transfer money\n\n### Fun Fact 🎉\nThe word 'bank' comes from the Italian word 'banca' which means bench — because early bankers sat on benches in marketplaces!", readTime: "4 min", tags: [{ name: "Banking", type: "major" }, { name: "Beginners", type: "minor" }] },
      { id: "jr-r2c2", title: "💳 Types of Accounts", contentType: "reading", content: "Banks offer different types of accounts for different needs:\n\n### 1. Savings Account 🐷\n- Best for: Keeping money safe and earning interest\n- You can deposit and withdraw anytime\n- Perfect for your first account!\n\n### 2. Current Account 🏪\n- Best for: Businesses that make lots of transactions\n- Usually no interest, but lots of features\n\n### 3. Fixed Deposit (FD) 🔒\n- You lock your money for a set period (6 months, 1 year, etc.)\n- Higher interest than savings account\n- Can't withdraw early without penalty\n\n### 4. Recurring Deposit (RD) 📅\n- Deposit a fixed amount every month\n- Great for building a savings habit!\n\n### Which One Is Right for You?\nStart with a **Savings Account** — it's flexible, earns interest, and teaches you money management!", readTime: "5 min", tags: [{ name: "Banking", type: "major" }, { name: "Beginners", type: "minor" }] },
      { id: "jr-r2c3", title: "📱 Digital Banking", contentType: "reading", content: "Welcome to the future of banking — no more standing in lines! 🎉\n\n### What is Digital Banking?\nIt's using your phone or computer to do everything you'd do at a bank branch:\n- Check your balance\n- Transfer money to friends\n- Pay bills\n- Open new accounts\n\n### UPI — India's Superpower 🇮🇳\nUPI (Unified Payments Interface) lets you send money instantly using just a phone number or QR code. India processes over 10 BILLION UPI transactions every month!\n\n### Staying Safe Online 🔐\n1. Never share your PIN or OTP with anyone\n2. Don't click suspicious links\n3. Always use official banking apps\n4. Enable transaction alerts", readTime: "3 min", tags: [{ name: "Banking", type: "major" }, { name: "Fintech", type: "minor" }], quizQuestions: JUNIOR_BANKING_SAFETY_QUIZ },
    ],
    views: 950,
    likes: 175,
  },
];
