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

export interface NavItem {
  label: string;
  href: string;
  description?: string;
  badge?: string;
}
