import { BlogPost, NavItem } from "./types";

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

export const DUMMY_POSTS: BlogPost[] = [
  {
    id: "1",
    title: "Understanding Market Dynamics in 2025",
    excerpt: "A deep dive into the forces shaping global markets this year and what investors should watch for.",
    content: "",
    category: "Newsletter",
    author: "Editorial Team",
    date: "2025-06-25",
    image: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600&h=400&fit=crop",
    readTime: "5 min",
    tags: ["Markets", "Analysis"],
  },
  {
    id: "2",
    title: "Beginner's Guide to Financial Planning",
    excerpt: "Everything you need to know to start your financial planning journey from scratch.",
    content: "",
    category: "Modules",
    author: "Editorial Team",
    date: "2025-06-20",
    image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&h=400&fit=crop",
    readTime: "8 min",
    tags: ["Planning", "Beginners"],
  },
  {
    id: "3",
    title: "Weekly Market Wrap: Key Takeaways",
    excerpt: "This week's top market movements, earnings reports, and economic indicators summarized.",
    content: "",
    category: "Newsletter",
    author: "Editorial Team",
    date: "2025-06-18",
    image: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=600&h=400&fit=crop",
    readTime: "4 min",
    tags: ["Markets", "Weekly"],
  },
  {
    id: "4",
    title: "Investment Strategies for Young Professionals",
    excerpt: "How to build a strong portfolio even when you're just starting your career.",
    content: "",
    category: "Modules",
    author: "Editorial Team",
    date: "2025-06-15",
    image: "https://images.unsplash.com/photo-1579532537598-459ecdaf39cc?w=600&h=400&fit=crop",
    readTime: "6 min",
    tags: ["Investing", "Career"],
  },
  {
    id: "5",
    title: "The Rise of Digital Banking",
    excerpt: "How fintech is reshaping the banking landscape and what it means for consumers.",
    content: "",
    category: "Videos",
    author: "Editorial Team",
    date: "2025-06-12",
    image: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=600&h=400&fit=crop",
    readTime: "7 min",
    tags: ["Fintech", "Banking"],
  },
  {
    id: "6",
    title: "Tax Planning Essentials",
    excerpt: "Smart tax strategies that every individual should know before the end of the financial year.",
    content: "",
    category: "Modules",
    author: "Editorial Team",
    date: "2025-06-10",
    image: "https://images.unsplash.com/photo-1554224154-26032ffc0d07?w=600&h=400&fit=crop",
    readTime: "5 min",
    tags: ["Tax", "Planning"],
  },
];

export const OTHER_PRODUCTS = [
  { name: "Wealth Advisory", href: "#", description: "Personalized wealth management" },
  { name: "Trading Platform", href: "#", description: "Advanced trading tools" },
  { name: "Insurance Hub", href: "#", description: "Compare and buy policies" },
  { name: "Credit Services", href: "#", description: "Loans and credit solutions" },
];
