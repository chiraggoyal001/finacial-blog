export type TagType = "major" | "minor";

export interface Tag {
  name: string;
  type: TagType;
}

export type QuizQuestionType = "mcq" | "true-false" | "fill-blank" | "multi-select";

export interface QuizOption {
  label: string;
  isCorrect: boolean;
}

export interface QuizQuestion {
  id: string;
  question: string;
  type?: QuizQuestionType; // defaults to "mcq"
  options: QuizOption[];
  correctAnswer?: string; // for fill-blank
}

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
  tags: Tag[];
  views?: number;
  likes?: number;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  isSubscribed: boolean;
  onboardingCompleted: boolean;
  mailPreference: "intrusive" | "non-intrusive";
  notifyLaunches: boolean;
  age?: number;
  region?: string;
  interests?: string[];
  hobbies?: string;
  profession?: string;
  description?: string;
  avatarUrl?: string;
  xp?: number;
}

export const FINANCE_INTERESTS = [
  "Investing",
  "Trading",
  "Stock Market",
  "Mutual Funds",
  "Retirement Planning",
  "Tax Planning",
  "Financial Independence",
  "Real Estate",
  "Cryptocurrency",
  "Personal Finance",
] as const;

export const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
] as const;

export interface Chapter {
  id: string;
  title: string;
  content: string;
  readTime: string;
  tags: Tag[];
  quizQuestions?: QuizQuestion[];
}

export interface Module {
  id: string;
  title: string;
  description: string;
  image: string;
  tag: Tag; // head tag visible on card
  chapters: Chapter[];
  totalReadTime: string;
  youtubePlaylist?: string;
  views?: number;
  likes?: number;
}

export interface VideoChapter {
  id: string;
  title: string;
  videoUrl: string;
  duration: string;
  description: string;
  tags: Tag[];
  quizQuestions?: QuizQuestion[];
}

export interface VideoSeries {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  tag: Tag; // head tag visible on card
  chapters: VideoChapter[];
  totalDuration: string;
  linkedModuleId?: string; // link to related module
  views?: number;
  likes?: number;
}

export type EventType = "community" | "quiz" | "bootcamp";

export interface BlogEvent {
  id: string;
  title: string;
  description: string;
  type: EventType;
  start_time: string; // ISO datetime
  end_time: string; // ISO datetime
  location: string; // "Online" or city name
  image: string;
  tags: Tag[];
  registrationUrl?: string;
  capacity?: number;
  registered?: number;
  virtualLobbyUrl?: string;
}

export type JuniorContentType = "video" | "reading";

export interface JuniorChapter {
  id: string;
  title: string;
  contentType: JuniorContentType;
  content: string;
  videoUrl?: string;
  duration?: string;
  readTime?: string;
  tags: Tag[];
  illustration?: string;
  quizQuestions?: QuizQuestion[];
}

export interface JuniorModule {
  id: string;
  title: string;
  description: string;
  image: string;
  tag: Tag;
  contentType: JuniorContentType;
  chapters: JuniorChapter[];
  totalReadTime?: string;
  totalDuration?: string;
  views?: number;
  likes?: number;
}

export interface NavItem {
  label: string;
  href: string;
  description?: string;
  badge?: string;
}

// =====================================================
// DATABASE TYPES (Supabase)
// =====================================================

export interface DbArticle {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  author_id: string;
  author_name: string;
  image: string;
  read_time: string;
  tags: { name: string; type: 'major' | 'minor' }[];
  views: number;
  likes: number;
  avg_rating: number;
  rating_count: number;
  is_published: boolean;
  published_at: string;
  created_at: string;
  updated_at: string;
  seo_title?: string;
  seo_description?: string;
  scheduled_for?: string;
}

export interface DbModule {
  id: string;
  title: string;
  description: string;
  image: string;
  tag: { name: string; type: 'major' | 'minor' };
  total_read_time: string;
  youtube_playlist: string;
  views: number;
  likes: number;
  avg_rating: number;
  rating_count: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  seo_title?: string;
  seo_description?: string;
  scheduled_for?: string;
  chapters?: DbModuleChapter[];
}

export interface DbModuleChapter {
  id: string;
  module_id: string;
  title: string;
  content: string;
  read_time: string;
  tags: { name: string; type: 'major' | 'minor' }[];
  sort_order: number;
  quiz_questions: QuizQuestion[];
  created_at: string;
  updated_at: string;
}

export interface DbVideoSeries {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  tag: { name: string; type: 'major' | 'minor' };
  total_duration: string;
  linked_module_id: string;
  views: number;
  likes: number;
  avg_rating: number;
  rating_count: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  chapters?: DbVideoChapter[];
}

export interface DbVideoChapter {
  id: string;
  series_id: string;
  title: string;
  video_url: string;
  duration: string;
  description: string;
  tags: { name: string; type: 'major' | 'minor' }[];
  sort_order: number;
  quiz_questions: QuizQuestion[];
  created_at: string;
  updated_at: string;
}

export interface DbEvent {
  id: string;
  title: string;
  description: string;
  type: EventType;
  start_time: string;
  end_time: string;
  location: string;
  image: string;
  tags: { name: string; type: 'major' | 'minor' }[];
  registration_url: string;
  capacity: number;
  registered: number;
  is_published: boolean;
  virtual_lobby_url?: string;
  recording_url?: string;
  scheduled_for?: string;
  created_at: string;
  updated_at: string;
}

export interface DbJuniorModule {
  id: string;
  title: string;
  description: string;
  image: string;
  tag: { name: string; type: 'major' | 'minor' };
  content_type: JuniorContentType;
  total_duration: string;
  views: number;
  likes: number;
  avg_rating: number;
  rating_count: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  chapters?: DbJuniorChapter[];
}

export interface DbJuniorChapter {
  id: string;
  module_id: string;
  title: string;
  content_type: JuniorContentType;
  content: string;
  video_url: string;
  duration: string;
  tags: { name: string; type: 'major' | 'minor' }[];
  illustration: string;
  sort_order: number;
  quiz_questions: QuizQuestion[];
  created_at: string;
  updated_at: string;
}

// A/B Testing Types
export interface ABTest {
  id: string;
  name: string;
  description: string;
  test_type: 'cta' | 'avatar' | 'mascot' | 'layout';
  status: 'draft' | 'running' | 'paused' | 'completed';
  start_date: string;
  end_date: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ABTestVariant {
  id: string;
  test_id: string;
  name: string;
  content: Record<string, unknown>;
  traffic_percentage: number;
  views: number;
  clicks: number;
  conversions: number;
  created_at: string;
}

export interface ABTestAssignment {
  id: string;
  test_id: string;
  user_id: string;
  variant_id: string;
  assigned_at: string;
}

// User Role Types
export interface DbRole {
  id: string;
  name: 'admin' | 'user';
  permissions: Record<string, boolean>;
  created_at: string;
}

export interface DbUserRole {
  id: string;
  user_id: string;
  role_id: string;
  created_at: string;
}
