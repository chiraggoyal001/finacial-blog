import React, { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useLoaderData } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { Clock, ChevronRight, Share2, CheckCircle2, BookOpen } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SubscribeSection from "@/components/SubscribeSection";
import QuizSection from "@/components/QuizSection";
import FeedbackSection from "@/components/FeedbackSection";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { useReadingProgress } from "@/contexts/ReadingProgressContext";
import { useModule } from "@/hooks/useContent";
import { useTrackView } from "@/hooks/useViewTracker";
import { Module } from "@/lib/types";
import { useSEO } from "@/hooks/useSEO";
import { BookmarkButton } from "@/components/BookmarkButton";
import { sanitizeHtml } from "@/lib/sanitize";
import DataError from "@/components/DataError";
import { initArticleTracking } from "@/lib/sessionTracker";
import { supabase } from "@/lib/supabase";

export async function loader({ params }: LoaderFunctionArgs) {
  const { moduleId } = params;
  if (!moduleId) return { initialDbModule: null };

  // Fetch from supabase server-side for SSR SEO
  let query = supabase.from('modules').select('*').eq('id', moduleId).eq('is_published', true);
  const { data: moduleData } = await query.single();
  
  if (!moduleData) return { initialDbModule: null };

  const { data: chapters } = await supabase
    .from('module_chapters')
    .select('*')
    .eq('module_id', moduleId)
    .order('sort_order', { ascending: true });

  return { initialDbModule: { ...moduleData, chapters } };
}

const XIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-label="X">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const ModuleArticlePage = () => {
  const { moduleId, chapterId } = useParams<{ moduleId: string; chapterId?: string }>();
  const { initialDbModule } = useLoaderData() as any;

  // Track views for both module and chapter
  useTrackView('module', moduleId);
  const { isLoggedIn, user } = useAuth();
  const { getProgress, setProgress, isRead } = useReadingProgress();
  const isSubscribed = isLoggedIn && user?.isSubscribed;
  const contentRef = useRef<HTMLDivElement>(null);
  const [scrollPercent, setScrollPercent] = useState(0);
  const { data: fetchedModule, isLoading, error, refetch } = useModule(moduleId || '', { publishedOnly: true });

  const dbModule = fetchedModule || initialDbModule;

  // Derive data safely before hooks — use null-safe defaults for loading/error states
  const mod = React.useMemo(() => dbModule ? {
    id: dbModule.id,
    title: dbModule.title,
    description: dbModule.description,
    image: dbModule.image,
    tag: dbModule.tag,
    chapters: (dbModule.chapters || []).map((ch) => ({
      id: ch.id,
      title: ch.title,
      content: ch.content,
      readTime: ch.read_time,
      tags: ch.tags,
      quizQuestions: ch.quiz_questions,
    })),
    totalReadTime: dbModule.total_read_time,
    youtubePlaylist: dbModule.youtube_playlist,
    views: dbModule.views,
    likes: dbModule.likes,
    seoTitle: dbModule.seo_title,
    seoDescription: dbModule.seo_description,
  } : null, [dbModule]);

  const activeChapterIndex = Math.max(0, mod?.chapters?.findIndex((c) => c.id === chapterId) ?? -1);
  const chapter = mod?.chapters ? mod.chapters[activeChapterIndex] : undefined;
  const nextChapter = mod?.chapters ? mod.chapters[activeChapterIndex + 1] : undefined;

  const readPercent = chapter ? getProgress(chapter.id) : 0;

  const defaultTitle = mod?.seoTitle || (chapter ? chapter.title : mod?.title) || 'Module';
  const defaultDescription = mod?.seoDescription || mod?.description || 'Loading...';
  const defaultImage = mod?.image;
  const seoSchema = mod ? {
    "@context": "https://schema.org",
    "@type": "Course",
    "name": mod.title,
    "description": mod.description,
    "provider": {
      "@type": "Organization",
      "name": "Dhaani",
      "sameAs": window.location.origin
    }
  } : undefined;

  useSEO({
    title: defaultTitle,
    description: defaultDescription,
    image: defaultImage,
    type: 'article',
    schema: seoSchema,
  });

  useEffect(() => {
    if (!chapter || !isLoggedIn || !contentRef.current) return;

    const handleScroll = () => {
      const el = contentRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const totalHeight = el.scrollHeight;
      const visibleBottom = window.innerHeight - rect.top;
      const percent = Math.round(Math.min(100, Math.max(0, (visibleBottom / totalHeight) * 100)));
      setScrollPercent(percent);
      setProgress(chapter.id, percent);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [chapter, isLoggedIn, setProgress]);

  // Chatbot session tracking
  useEffect(() => {
    if (!chapter || !mod) return;
    const tags = chapter.tags ? chapter.tags.map((t: any) => typeof t === 'string' ? t : t.name || '') : [];
    const cleanup = initArticleTracking(user?.id || null, chapter.id, tags);
    return cleanup;
  }, [chapter, mod, user?.id]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [chapterId]);

  // Keyboard shortcut: ArrowRight to go to next chapter, ArrowLeft for previous
  useEffect(() => {
    if (!nextChapter && !mod?.chapters?.[activeChapterIndex - 1]) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      if (e.key === "ArrowRight" && nextChapter) {
        e.preventDefault();
        window.location.href = `/modules/${mod!.id}/${nextChapter.id}`;
      } else if (e.key === "ArrowLeft" && activeChapterIndex > 0) {
        e.preventDefault();
        const prevChapter = mod!.chapters[activeChapterIndex - 1];
        window.location.href = `/modules/${mod!.id}/${prevChapter.id}`;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [nextChapter, activeChapterIndex, mod]);

  if (isLoading && !dbModule) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <div className="flex-1 flex items-center justify-center" role="status" aria-live="polite">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          <span className="sr-only">Loading module content...</span>
        </div>
      </div>
    );
  }

  if (error || !dbModule) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <div className="flex-1 container py-20 flex items-center justify-center">
          <DataError 
            title="Module Not Found"
            message="The module you are looking for might have been moved or is not yet published."
            onRetry={() => refetch()} 
          />
        </div>
        <Footer />
      </div>
    );
  }

  if (!chapter) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <div className="flex-1 container py-20 flex items-center justify-center">
          <DataError 
            title="Chapter Not Found"
            message="The chapter you are looking for does not exist in this module."
          />
        </div>
        <Footer />
      </div>
    );
  }

  const currentPercent = isLoggedIn ? Math.max(readPercent, scrollPercent) : scrollPercent;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      {/* Reading progress bar */}
      <div 
        style={{ top: "calc(4rem + var(--banner-height, 0px))" }}
        className="sticky z-40 w-full"
      >
        <Progress value={currentPercent} className="h-1 rounded-none" />
      </div>

      {/* Main layout */}
      <div className="container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-8">
          {/* Left Chapter Nav */}
          <aside className="space-y-2">
            <h3 className="font-display text-sm font-bold text-foreground mb-3 flex items-center gap-1.5">
              <BookOpen className="h-4 w-4 text-primary" />
              {mod.title}
            </h3>
            <nav className="space-y-1">
              {mod.chapters.map((ch, idx) => {
                const chRead = isRead(ch.id);
                const chProgress = getProgress(ch.id);
                const isActive = ch.id === chapter.id;
                return (
                  <Link
                    key={ch.id}
                    to={`/modules/${mod.id}/${ch.id}`}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                      isActive
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent"
                    }`}
                  >
                    {isLoggedIn && chRead ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                    ) : (
                      <span className="text-xs text-muted-foreground flex-shrink-0 w-3.5 text-center font-mono">
                        {idx + 1}
                      </span>
                    )}
                    <span className="line-clamp-1">{ch.title}</span>
                    {isLoggedIn && chProgress > 0 && !chRead && (
                      <span className="ml-auto text-[10px] text-muted-foreground">{chProgress}%</span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </aside>

          {/* Chapter Content */}
          <article className="max-w-3xl">
            {/* Header */}
            <div className="space-y-3 mb-6">
              <Badge variant={mod.tag.type === "major" ? "default" : "secondary"} className="text-xs">
                {mod.tag.name}
              </Badge>
              <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground leading-tight">
                {chapter.title}
              </h1>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />{chapter.readTime}
                  </span>
                  <span className="font-mono text-xs">
                    Chapter {activeChapterIndex + 1} of {mod.chapters.length}
                  </span>
                </div>
                <BookmarkButton contentType="module" contentId={mod.id} showText />
              </div>
              {isLoggedIn && readPercent > 0 && (
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{readPercent >= 100 ? "✓ Read" : `${readPercent}% read`}</span>
                  <Progress value={readPercent} className="h-1.5 flex-1 max-w-[200px]" />
                </div>
              )}
            </div>

            {/* Content */}
            <div
              ref={contentRef}
              className="prose prose-lg dark:prose-invert max-w-none prose-headings:font-display prose-headings:text-foreground prose-p:text-muted-foreground prose-a:text-primary"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(chapter.content) }}
            />

            {/* Next Chapter */}
            {nextChapter && (
              <div className="mt-8 pt-6 border-t border-border">
                <Link
                  to={`/modules/${mod.id}/${nextChapter.id}`}
                  className="group flex items-center justify-between p-4 rounded-xl border border-border bg-card hover:shadow-md transition-all"
                >
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground">Next Chapter</span>
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                      {nextChapter.title}
                    </h3>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />{nextChapter.readTime}
                    </span>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </Link>
              </div>
            )}

            {/* Quiz */}
            {chapter.quizQuestions && chapter.quizQuestions.length > 0 && (
              <div className="mt-8 pt-6 border-t border-border">
                <QuizSection questions={chapter.quizQuestions} />
              </div>
            )}

            {/* Feedback */}
            <div className="mt-8 pt-6 border-t border-border">
              <FeedbackSection placeholder="Share your thoughts on this chapter..." />
            </div>

            {/* Social Share - dynamic share URLs */}
            <div className="flex items-center gap-3 pt-8 mt-8 border-t border-border">
              <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                <Share2 className="h-4 w-4" /> Share
              </span>
              <a 
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`${chapter.title} - ${mod.title}`)}&url=${encodeURIComponent(window.location.href)}`} 
                target="_blank" rel="noopener noreferrer" 
                className="text-muted-foreground hover:text-primary"
                aria-label="Share on X (Twitter)"
              >
                <XIcon />
              </a>
              <a 
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`} 
                target="_blank" rel="noopener noreferrer" 
                className="text-muted-foreground hover:text-primary"
                aria-label="Share on LinkedIn"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
              </a>
              <a 
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`${chapter.title} - ${mod.title} ${window.location.href}`)}`} 
                target="_blank" rel="noopener noreferrer" 
                className="text-muted-foreground hover:text-primary"
                aria-label="Share on WhatsApp"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              </a>
            </div>
          </article>
        </div>
      </div>

      {/* Subscribe */}
      {!isSubscribed && <SubscribeSection />}

      <Footer />
    </div>
  );
};

export default ModuleArticlePage;
