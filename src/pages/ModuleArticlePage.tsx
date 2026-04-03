import React, { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Clock, ChevronRight, Share2, CheckCircle2, BookOpen } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SubscribeSection from "@/components/SubscribeSection";
import QuizSection from "@/components/QuizSection";
import FeedbackSection from "@/components/FeedbackSection";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { DUMMY_MODULES, SOCIAL_LINKS } from "@/lib/data";
import { useAuth } from "@/contexts/AuthContext";
import { useReadingProgress } from "@/contexts/ReadingProgressContext";

const XIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-label="X">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const ModuleArticlePage = () => {
  const { moduleId, chapterId } = useParams<{ moduleId: string; chapterId?: string }>();
  const { isLoggedIn, user } = useAuth();
  const { getProgress, setProgress, isRead } = useReadingProgress();
  const isSubscribed = isLoggedIn && user?.isSubscribed;
  const contentRef = useRef<HTMLDivElement>(null);
  const [scrollPercent, setScrollPercent] = useState(0);

  const mod = DUMMY_MODULES.find((m) => m.id === moduleId);
  const activeChapterIndex = mod
    ? Math.max(0, mod.chapters.findIndex((c) => c.id === chapterId))
    : 0;
  const chapter = mod?.chapters[activeChapterIndex];
  const nextChapter = mod?.chapters[activeChapterIndex + 1];

  const readPercent = chapter ? getProgress(chapter.id) : 0;

  // Track scroll-based reading progress
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

  // Reset on chapter change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [chapterId]);

  if (!mod || !chapter) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <h1 className="font-display text-2xl font-bold text-foreground">Module Not Found</h1>
            <Link to="/modules">
              <Button variant="outline">Back to Modules</Button>
            </Link>
          </div>
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
      <div className="sticky top-16 z-40 w-full">
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
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />{chapter.readTime}
                </span>
                <span className="font-mono text-xs">
                  Chapter {activeChapterIndex + 1} of {mod.chapters.length}
                </span>
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
              dangerouslySetInnerHTML={{ __html: chapter.content }}
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

            {/* Quiz / Feedback */}
            <div className="mt-8 pt-6 border-t border-border space-y-6">
              <h3 className="font-display text-lg font-bold text-foreground">Quiz & Feedback</h3>

              {!submitted ? (
                <div className="space-y-4">
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground font-medium">
                      How would you rate this chapter?
                    </p>
                    <RadioGroup value={quizAnswer} onValueChange={setQuizAnswer} className="flex gap-4">
                      {["⭐", "⭐⭐", "⭐⭐⭐", "⭐⭐⭐⭐", "⭐⭐⭐⭐⭐"].map((stars, i) => (
                        <div key={i} className="flex items-center space-x-1">
                          <RadioGroupItem value={String(i + 1)} id={`rating-${i + 1}`} />
                          <Label htmlFor={`rating-${i + 1}`} className="text-sm cursor-pointer">
                            {i + 1}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Any feedback or comments?</Label>
                    <Textarea
                      placeholder="Share your thoughts on this chapter..."
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      className="resize-none"
                      rows={3}
                    />
                  </div>
                  <Button
                    onClick={() => setSubmitted(true)}
                    disabled={!quizAnswer}
                    size="sm"
                  >
                    Submit Feedback
                  </Button>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 text-sm text-foreground">
                  Thanks for your feedback! Your rating: {quizAnswer}/5
                </div>
              )}
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

export default ModuleArticlePage;
