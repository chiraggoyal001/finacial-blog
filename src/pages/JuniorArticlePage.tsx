import React, { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Clock, ChevronRight, Share2, CheckCircle2, BookOpen, Play, Sparkles } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SubscribeSection from "@/components/SubscribeSection";
import QuizSection from "@/components/QuizSection";
import FeedbackSection from "@/components/FeedbackSection";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { useJuniorModule } from "@/hooks/useContent";
import { SOCIAL_LINKS } from "@/lib/data";
import { useAuth } from "@/hooks/useAuth";
import { useReadingProgress } from "@/contexts/ReadingProgressContext";
import { JuniorModule, JuniorChapter } from "@/lib/types";
import { sanitizeHtml } from "@/lib/sanitize";
import DataError from "@/components/DataError";
import { initArticleTracking } from "@/lib/sessionTracker";

const XIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-label="X">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const JuniorArticlePage = () => {
  const { moduleId, chapterId } = useParams<{ moduleId: string; chapterId?: string }>();
  const { isLoggedIn, user } = useAuth();
  const { getProgress, setProgress, isRead } = useReadingProgress();
  const isSubscribed = isLoggedIn && user?.isSubscribed;
  const contentRef = useRef<HTMLDivElement>(null);
  const [scrollPercent, setScrollPercent] = useState(0);

  const { data: dbJuniorModule, isLoading, error, refetch } = useJuniorModule(moduleId || "", { publishedOnly: true });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [chapterId]);

  useEffect(() => {
    if (!chapterId || !isLoggedIn || !contentRef.current) return;

    const handleScroll = () => {
      const el = contentRef.current;
      if (!el) return;
      
      const rect = el.getBoundingClientRect();
      const totalHeight = el.scrollHeight;
      const visibleBottom = window.innerHeight - rect.top;
      const percent = Math.round(Math.min(100, Math.max(0, (visibleBottom / totalHeight) * 100)));
      
      setScrollPercent(percent);
      const key = `junior-${moduleId}-${chapterId}`;
      setProgress(key, percent);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [moduleId, chapterId, isLoggedIn, setProgress]);

  // Chatbot session tracking
  useEffect(() => {
    if (!chapterId || !dbJuniorModule) return;
    const tags = dbJuniorModule.tag ? [typeof dbJuniorModule.tag === 'string' ? dbJuniorModule.tag : dbJuniorModule.tag.name || ''] : [];
    const cleanup = initArticleTracking(user?.id || null, `junior-${moduleId}-${chapterId}`, tags);
    return cleanup;
  }, [chapterId, dbJuniorModule, moduleId, user?.id]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="h-8 w-48 bg-muted animate-pulse rounded mx-auto" />
            <div className="h-4 w-32 bg-muted animate-pulse rounded mx-auto" />
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !dbJuniorModule) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <div className="flex-1 container py-20 flex items-center justify-center">
          <DataError 
            title="Module Not Found"
            message="The junior module you are looking for might have been moved or is not yet published."
            onRetry={() => refetch()} 
          />
        </div>
        <Footer />
      </div>
    );
  }

  const mod: JuniorModule = {
    id: dbJuniorModule.id,
    title: dbJuniorModule.title,
    description: dbJuniorModule.description,
    image: dbJuniorModule.image,
    tag: dbJuniorModule.tag,
    contentType: dbJuniorModule.content_type,
    chapters: (dbJuniorModule.chapters || []).map((ch): JuniorChapter => ({
      id: ch.id,
      title: ch.title,
      contentType: ch.content_type,
      content: ch.content,
      videoUrl: ch.video_url,
      duration: ch.duration,
      readTime: ch.duration,
      tags: ch.tags,
      illustration: ch.illustration,
      quizQuestions: ch.quiz_questions,
    })),
    totalReadTime: dbJuniorModule.total_duration,
    totalDuration: dbJuniorModule.total_duration,
    views: dbJuniorModule.views,
    likes: dbJuniorModule.likes,
  };
  const activeChapterIndex = Math.max(0, mod.chapters.findIndex((c) => c.id === chapterId));
  const chapter = mod.chapters[activeChapterIndex];
  
  if (!chapter) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="font-display text-2xl font-bold text-foreground">Chapter not found</h1>
            <Link to={`/junior/${mod.id}`}><Button variant="link" className="mt-4">Back to Module</Button></Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const nextChapter = mod.chapters[activeChapterIndex + 1];
  const progressKey = `junior-${mod.id}-${chapter.id}`;

  const [shareUrl, setShareUrl] = useState("");
  useEffect(() => {
    setShareUrl(window.location.href);
  }, []);
  const isVideoChapter = chapter.contentType === "video";

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      {/* Reading progress bar */}
      {!isVideoChapter && (
        <div 
          style={{ top: "calc(4rem + var(--banner-height, 0px))" }}
          className="sticky z-50 h-1 bg-muted"
        >
          <div className="h-full bg-secondary transition-all duration-200" style={{ width: `${scrollPercent}%` }} />
        </div>
      )}

      {/* Hero */}
      <section className="bg-gradient-to-br from-secondary/10 via-background to-primary/5">
        <div className="container py-8">
          <Badge variant="secondary" className="mb-2">{mod.tag.name}</Badge>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">{mod.title}</h1>
        </div>
      </section>

      {/* Main Content */}
      <section className="container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-8">
          {/* Left Nav — Chapters */}
          <aside className="space-y-1">
            <h3 className="font-display text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Chapters</h3>
            {mod.chapters.map((ch, i) => {
              const chKey = `junior-${mod.id}-${ch.id}`;
              const isActive = i === activeChapterIndex;
              const chRead = isLoggedIn && isRead(chKey);
              const chProgress = isLoggedIn ? getProgress(chKey) : 0;
              const isVideo = ch.contentType === "video";
              return (
                <Link
                  key={ch.id}
                  to={`/junior/${mod.id}/${ch.id}`}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                    isActive
                      ? "bg-secondary/10 text-secondary font-semibold border border-secondary/20"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {chRead ? (
                    <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                  ) : isVideo ? (
                    <Play className="h-4 w-4 shrink-0" />
                  ) : (
                    <BookOpen className="h-4 w-4 shrink-0" />
                  )}
                  <span className="flex-1 truncate">{ch.title}</span>
                  <span className="text-xs opacity-60 font-mono shrink-0">
                    {isVideo ? ch.duration : ch.readTime}
                  </span>
                  {isLoggedIn && !chRead && chProgress > 0 && (
                    <span className="text-xs text-secondary font-mono">{chProgress}%</span>
                  )}
                </Link>
              );
            })}
          </aside>

          {/* Content */}
          <div className="space-y-8">
            <div>
              <h2 className="font-display text-xl md:text-2xl font-bold text-foreground mb-2">{chapter.title}</h2>
              <div className="flex items-center gap-3 text-sm text-muted-foreground mb-6">
                {isVideoChapter ? (
                  <span className="flex items-center gap-1"><Play className="h-3.5 w-3.5" /> {chapter.duration}</span>
                ) : (
                  <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {chapter.readTime}</span>
                )}
              </div>
            </div>

            {/* Video Embed or Reading Content */}
            {isVideoChapter && chapter.videoUrl ? (
              <div className="rounded-xl overflow-hidden border border-border shadow-sm">
                <div className="aspect-video">
                  <iframe
                    src={chapter.videoUrl}
                    title={chapter.title}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            ) : null}

            {/* Illustration */}
            {chapter.illustration && (
              <div className="rounded-xl overflow-hidden border border-border shadow-sm">
                <img src={chapter.illustration} alt={chapter.title} className="w-full h-48 object-cover" />
              </div>
            )}

            <div
              ref={contentRef}
              className="prose prose-lg max-w-none text-foreground leading-relaxed"
              style={{ fontFamily: "var(--font-body)" }}
            >
              {chapter.content.includes('<') ? (
                <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(chapter.content) }} />
              ) : (
                chapter.content.split("\n").map((line, i) => {
                  if (line.startsWith("### ")) return <h3 key={i} className="font-display text-lg font-bold text-foreground mt-6 mb-3">{line.replace("### ", "")}</h3>;
                  if (line.startsWith("## ")) return <h2 key={i} className="font-display text-xl font-bold text-foreground mt-8 mb-4">{line.replace("## ", "")}</h2>;
                  if (line.startsWith("**") && line.endsWith("**")) return <p key={i} className="font-semibold text-foreground">{line.replace(/\*\*/g, "")}</p>;
                  if (line.startsWith("- ")) return <li key={i} className="ml-4 text-muted-foreground">{line.replace("- ", "")}</li>;
                  if (line.startsWith("Q:")) return <p key={i} className="font-semibold text-secondary mt-4">{line}</p>;
                  if (line.startsWith("A:")) return <p key={i} className="text-primary font-medium">{line}</p>;
                  if (line.trim() === "") return <br key={i} />;
                  return <p key={i} className="text-muted-foreground mb-2">{line}</p>;
                })
              )}
            </div>

            <Separator />

            {/* Next Chapter */}
            {nextChapter && (
              <Link to={`/junior/${mod.id}/${nextChapter.id}`}>
                <Card className="hover:shadow-md transition-shadow border-border group">
                  <CardContent className="p-5 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-muted-foreground uppercase tracking-wider">Next Chapter</span>
                      <h3 className="font-display font-semibold text-foreground mt-1">{nextChapter.title}</h3>
                      <span className="text-xs text-muted-foreground">
                        {nextChapter.contentType === "video" ? nextChapter.duration : nextChapter.readTime}
                      </span>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-secondary transition-colors" />
                  </CardContent>
                </Card>
              </Link>
            )}

            {/* Quiz */}
            {chapter.quizQuestions && chapter.quizQuestions.length > 0 && (
              <Card className="border-border bg-gradient-to-br from-secondary/5 to-background">
                <CardContent className="p-6">
                  <QuizSection questions={chapter.quizQuestions} variant="junior" />
                </CardContent>
              </Card>
            )}

            {/* Feedback */}
            <Card className="border-border">
              <CardContent className="p-6">
                <FeedbackSection variant="junior" placeholder="What did you learn? Share your thoughts..." />
              </CardContent>
            </Card>

            {/* Social Links */}
            <div className="flex items-center gap-3">
              <Share2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Share:</span>
              <a href={`https://x.com/intent/tweet?url=${shareUrl}`} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-secondary transition-colors"><XIcon /></a>
              <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-secondary transition-colors text-sm font-medium">LinkedIn</a>
              <a href={`https://wa.me/?text=${shareUrl}`} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-secondary transition-colors text-sm font-medium">WhatsApp</a>
            </div>
          </div>
        </div>
      </section>

      <SubscribeSection />
      <Footer />
    </div>
  );
};

export default JuniorArticlePage;
