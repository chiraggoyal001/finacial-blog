export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  author: string;
  date: string;
  image: string;
  readTime: string;
  tags: string[];
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  isSubscribed: boolean;
  mailPreference: "intrusive" | "non-intrusive";
  notifyLaunches: boolean;
}

export interface NavItem {
  label: string;
  href: string;
  description?: string;
  badge?: string;
}
