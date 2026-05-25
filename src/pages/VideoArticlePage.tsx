import React, { useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useLoaderData } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { Clock, ChevronRight, Share2, Film, Play, BookOpen } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SubscribeSection from "@/components/SubscribeSection";
import QuizSection from "@/components/QuizSection";
import FeedbackSection from "@/components/FeedbackSection";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useVideoSeriesItem, useModules } from "@/hooks/useContent";
import { SOCIAL_LINKS } from "@/lib/data";
import { useAuth } from "@/hooks/useAuth";
import { VideoSeries, Module } from "@/lib/types";
import DataError from "@/components/DataError";
import { initArticleTracking } from "@/lib/sessionTracker";
import { supabase } from "@/lib/supabase";

export async function loader({ params }: LoaderFunctionArgs) {
  const { seriesId } = params;
  if (!seriesId) return { initialDbVideoSeries: null };

  const { data: series } = await supabase
    .from('video_series')
    .select('*')
    .eq('id', seriesId)
    .eq('is_published', true)
    .single();
    
  if (!series) return { initialDbVideoSeries: null };

  const { data: chapters } = await supabase
    .from('video_chapters')
    .select('*')
    .eq('series_id', seriesId)
    .order('sort_order', { ascending: true });

  return { initialDbVideoSeries: { ...series, chapters } };
}

const XIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-label="X">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const VideoArticlePage = () => {
  const { seriesId, chapterId } = useParams<{ seriesId: string; chapterId?: string }>();
  const { initialDbVideoSeries } = useLoaderData() as any;
  const { isLoggedIn, user } = useAuth();
  const isSubscribed = isLoggedIn && user?.isSubscribed;

  const { data: fetchedSeries, isLoading, error, refetch } = useVideoSeriesItem(seriesId || "", { publishedOnly: true });
  const dbVideoSeries = fetchedSeries || initialDbVideoSeries;
  const { data: dbModules } = useModules({ published: true });

  const series: VideoSeries | undefined = React.useMemo(() => dbVideoSeries ? {
    id: dbVideoSeries.id,
    title: dbVideoSeries.title,
    description: dbVideoSeries.description,
    thumbnail: dbVideoSeries.thumbnail,
    tag: dbVideoSeries.tag,
    chapters: (dbVideoSeries.chapters || []).map((ch) => ({
      id: ch.id,
      title: ch.title,
      description: ch.description,
      videoUrl: ch.video_url,
      duration: ch.duration,
      quizQuestions: ch.quiz_questions,
    })),
    totalDuration: dbVideoSeries.total_duration,
    linkedModuleId: dbVideoSeries.linked_module_id,
  } : undefined, [dbVideoSeries]);

  const activeChapterIndex = Math.max(0, series?.chapters.findIndex((c) => c.id === chapterId) ?? 0);
  const chapter = series?.chapters[activeChapterIndex];
  const nextChapter = series?.chapters[activeChapterIndex + 1];
  const linkedModule = dbModules?.find((m) => m.id === series?.linkedModuleId);

  // ALL hooks must be called BEFORE any early returns
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [chapterId]);

  // Chatbot session tracking
  useEffect(() => {
    if (!chapter || !series) return;
    const cleanup = initArticleTracking(user?.id || null, chapter.id, [series.tag?.name || '']);
    return cleanup;
  }, [chapter, series, user?.id]);

  if (isLoading && !dbVideoSeries) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-muted-foreground animate-pulse">Loading video...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !dbVideoSeries) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <div className="flex-1 container py-20 flex items-center justify-center">
          <DataError 
            title="Video Not Found"
            message="The video series you are looking for might have been moved or is not yet published."
            onRetry={() => refetch()} 
          />
        </div>
        <Footer />
      </div>
    );
  }


  if (!series || !chapter) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <div className="flex-1 container py-20 flex items-center justify-center">
          <DataError 
            title="Video Not Found"
            message="The video you are looking for does not exist in this series."
          />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      {/* Main layout */}
      <div className="container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-8">
          {/* Left Chapter Nav */}
          <aside className="space-y-2">
            <h3 className="font-display text-sm font-bold text-foreground mb-3 flex items-center gap-1.5">
              <Film className="h-4 w-4 text-primary" />
              {series.title}
            </h3>
            <div className="text-xs text-muted-foreground mb-3 space-y-1">
              <p>{series.chapters.length} videos · {series.totalDuration}</p>
            </div>
            <nav className="space-y-1">
              {series.chapters.map((ch, idx) => {
                const isActive = ch.id === chapter.id;
                return (
                  <Link
                    key={ch.id}
                    to={`/videos/${series.id}/${ch.id}`}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                      isActive
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent"
                    }`}
                  >
                    <span className="text-xs flex-shrink-0 w-3.5 text-center font-mono">
                      {idx + 1}
                    </span>
                    <span className="line-clamp-1 flex-1">{ch.title}</span>
                    <span className="text-[10px] text-muted-foreground flex-shrink-0">{ch.duration}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Linked Module */}
            {linkedModule && (
              <div className="pt-3 border-t border-border mt-3">
                <Link
                  to={`/modules/${linkedModule.id}`}
                  className="flex items-center gap-1.5 text-xs text-primary hover:underline"
                >
                  <BookOpen className="h-3.5 w-3.5" />
                  Read the Module
                </Link>
              </div>
            )}
          </aside>

          {/* Video Content */}
          <article className="max-w-4xl">
            {/* Header */}
            <div className="space-y-3 mb-6">
              <Badge variant={series.tag.type === "major" ? "default" : "secondary"} className="text-xs">
                {series.tag.name}
              </Badge>
              <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground leading-tight">
                {chapter.title}
              </h1>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />{chapter.duration}
                </span>
                <span className="font-mono text-xs">
                  Video {activeChapterIndex + 1} of {series.chapters.length}
                </span>
              </div>
            </div>

            {/* Video Embed */}
            <div className="rounded-xl overflow-hidden mb-6 aspect-video bg-black">
              <iframe
                src={chapter.videoUrl}
                title={chapter.title}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>

            {/* Description */}
            <div className="prose dark:prose-invert max-w-none mb-8">
              <p className="text-muted-foreground">{chapter.description}</p>
            </div>

            {/* Next Chapter */}
            {nextChapter && (
              <div className="pt-6 border-t border-border">
                <Link
                  to={`/videos/${series.id}/${nextChapter.id}`}
                  className="group flex items-center justify-between p-4 rounded-xl border border-border bg-card hover:shadow-md transition-all"
                >
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground">Next Video</span>
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                      {nextChapter.title}
                    </h3>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Play className="h-3 w-3" />{nextChapter.duration}
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
              <FeedbackSection placeholder="Share your thoughts on this video..." />
            </div>

            {/* Social Share */}
            <div className="flex items-center gap-3 pt-8 mt-8 border-t border-border">
              <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                <Share2 className="h-4 w-4" /> Share
              </span>
              <a href={SOCIAL_LINKS.twitter} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary"><XIcon /></a>
              <a href={SOCIAL_LINKS.linkedin} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
              </a>
              <a href={SOCIAL_LINKS.whatsapp} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
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

export default VideoArticlePage;
