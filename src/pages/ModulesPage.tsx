import React from "react";
import { Link } from "react-router-dom";
import { Clock, BookOpen, Play, Eye, Heart, CheckCircle2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SubscribeSection from "@/components/SubscribeSection";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { useReadingProgress } from "@/contexts/ReadingProgressContext";
import { useTranslation } from "@/hooks/useTranslation";
import { useModules } from "@/hooks/useContent";
import { Module } from "@/lib/types";
import DataError from "@/components/DataError";

const ModulesPage = () => {
  const { isLoggedIn, user } = useAuth();
  const isSubscribed = isLoggedIn && user?.isSubscribed;
  const { getProgress, isRead } = useReadingProgress();
  const { t } = useTranslation();
  const { data: dbModules, isLoading, error, refetch } = useModules({ published: true });

  if (error) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <div className="flex-1 container py-20 flex items-center justify-center">
          <DataError 
            title="Unable to Load Modules"
            message="We're having trouble loading the learning modules. Please try again later."
            onRetry={() => refetch()} 
          />
        </div>
        <Footer />
      </div>
    );
  }

  const modules: Module[] = (dbModules || []).map((mod) => ({
    id: mod.id,
    title: mod.title,
    description: mod.description,
    image: mod.image,
    tag: mod.tag,
    chapters: (mod.chapters || []).map((ch) => ({
      id: ch.id,
      title: ch.title,
      content: ch.content,
      readTime: ch.read_time,
      tags: ch.tags,
      quizQuestions: ch.quiz_questions,
    })),
    totalReadTime: mod.total_read_time,
    youtubePlaylist: mod.youtube_playlist,
    views: mod.views,
    likes: mod.likes,
  }));

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <section className="bg-gradient-to-br from-primary/5 via-background to-accent/30">
        <div className="container py-10 md:py-16">
          <span className="inline-block text-xs font-semibold tracking-widest uppercase text-primary mb-2">{t("modules.tag")}</span>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">{t("modules.title1")} <span className="text-primary">{t("modules.title2")}</span></h1>
          <p className="text-muted-foreground mt-2 max-w-xl">{t("modules.desc")}</p>
        </div>
      </section>
      <section className="py-10">
        <div className="container space-y-8">
          {isLoading ? (
            <div className="space-y-8">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="rounded-2xl overflow-hidden border border-border bg-card">
                  <div className="grid md:grid-cols-[320px_1fr] gap-0">
                    <div className="aspect-video md:aspect-auto bg-muted animate-pulse" />
                    <div className="p-6 space-y-3">
                      <div className="h-4 w-16 bg-muted animate-pulse rounded" />
                      <div className="h-6 w-3/4 bg-muted animate-pulse rounded" />
                      <div className="h-4 w-full bg-muted animate-pulse rounded" />
                      <div className="h-4 w-2/3 bg-muted animate-pulse rounded" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : modules.map((mod) => {
            const chapterProgresses = mod.chapters.map((ch) => getProgress(ch.id));
            const avgProgress = chapterProgresses.length > 0 ? Math.round(chapterProgresses.reduce((a, b) => a + b, 0) / chapterProgresses.length) : 0;
            const allRead = mod.chapters.every((ch) => isRead(ch.id));
            const chaptersRead = mod.chapters.filter((ch) => isRead(ch.id)).length;
            return (
              <Link key={mod.id} to={`/modules/${mod.id}`} className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-2xl">
                <div className="rounded-2xl overflow-hidden border border-border bg-card hover:shadow-lg transition-all">
                  <div className="grid md:grid-cols-[320px_1fr] gap-0">
                    <div className="aspect-video md:aspect-auto overflow-hidden relative">
                      <img src={mod.image} alt={mod.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                      
                      {isLoggedIn && avgProgress > 0 && (
                        <div className="absolute top-3 right-3 bg-background/90 backdrop-blur-sm rounded-full p-1 shadow-lg border border-primary/20 flex items-center justify-center">
                          <div className="relative w-10 h-10">
                            <svg className="w-10 h-10 -rotate-90" viewBox="0 0 100 100">
                              <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--muted))" strokeWidth="10" />
                              <circle cx="50" cy="50" r="42" fill="none"
                                stroke="hsl(var(--primary))"
                                strokeWidth="10" strokeLinecap="round" 
                                strokeDasharray={`${avgProgress * 2.64} 264`} 
                                className="transition-all duration-1000 ease-out"
                              />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                              {allRead ? (
                                <CheckCircle2 className="h-5 w-5 text-primary" />
                              ) : (
                                <span className="text-[10px] font-bold text-foreground">{avgProgress}%</span>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="p-6 flex flex-col justify-center space-y-3">
                      <Badge variant={mod.tag.type === "major" ? "default" : "secondary"} className="text-[10px] w-fit">{mod.tag.name}</Badge>
                      <h2 className="font-display text-xl md:text-2xl font-bold text-foreground group-hover:text-primary transition-colors">{mod.title}</h2>
                      <p className="text-sm text-muted-foreground leading-relaxed">{mod.description}</p>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><BookOpen className="h-3.5 w-3.5" />{mod.chapters.length} {t("modules.chapters")}</span>
                        <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{mod.totalReadTime}</span>
                        {mod.views && <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" />{mod.views.toLocaleString()}</span>}
                        {mod.likes && <span className="flex items-center gap-1"><Heart className="h-3.5 w-3.5" />{mod.likes}</span>}
                        {mod.youtubePlaylist && (
                          <a href={mod.youtubePlaylist} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline" onClick={(e) => e.stopPropagation()}>
                            <Play className="h-3.5 w-3.5" />{t("modules.ytPlaylist")}
                          </a>
                        )}
                      </div>
                      {isLoggedIn && avgProgress > 0 && (
                        <div className="space-y-1 pt-1">
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{allRead ? `✓ ${t("modules.completed")}` : `${chaptersRead}/${mod.chapters.length} ${t("modules.chapters")} · ${avgProgress}% ${t("modules.read")}`}</span>
                          </div>
                          <Progress value={avgProgress} className="h-1.5" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
      {!isSubscribed && <SubscribeSection />}
      <Footer />
    </div>
  );
};

export default ModulesPage;
