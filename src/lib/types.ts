export type TagType = "major" | "minor";

export interface Tag {
  name: string;
  type: TagType;
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
  mailPreference: "intrusive" | "non-intrusive";
  notifyLaunches: boolean;
}

export interface Chapter {
  id: string;
  title: string;
  content: string;
  readTime: string;
  tags: Tag[]; // tagged but not visible on card
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
  videoUrl: string; // YouTube embed URL
  duration: string; // e.g. "12:30"
  description: string;
  tags: Tag[]; // tagged but not visible on card
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
  date: string; // ISO date
  time: string; // e.g. "14:00 - 16:00"
  location: string; // "Online" or city name
  image: string;
  tags: Tag[];
  isUpcoming: boolean;
  registrationUrl?: string;
  capacity?: number;
  registered?: number;
}

export type JuniorContentType = "video" | "reading";

export interface JuniorChapter {
  id: string;
  title: string;
  contentType: JuniorContentType;
  content: string; // markdown-style text for reading, or description for video
  videoUrl?: string; // YouTube embed for video chapters
  duration?: string; // video duration
  readTime?: string; // reading time
  tags: Tag[];
  illustration?: string; // fun graphic/image
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
