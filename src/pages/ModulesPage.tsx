import React from "react";
import { Link } from "react-router-dom";
import { Clock, BookOpen, Play, Eye, Heart, CheckCircle2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SubscribeSection from "@/components/SubscribeSection";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { DUMMY_MODULES } from "@/lib/data";
import { useAuth } from "@/contexts/AuthContext";
import { useReadingProgress } from "@/contexts/ReadingProgressContext";
import { useTranslation } from "@/hooks/useTranslation";

const ModulesPage = () => {
  const { isLoggedIn, user } = useAuth();
  const isSubscribed = isLoggedIn && user?.isSubscribed;
  const { getProgress, isRead } = useReadingProgress();
  const { t } = useTranslation();

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
          {DUMMY_MODULES.map((mod) => {
            const chapterProgresses = mod.chapters.map((ch) => getProgress(ch.id));
            const avgProgress = chapterProgresses.length > 0 ? Math.round(chapterProgresses.reduce((a, b) => a + b, 0) / chapterProgresses.length) : 0;
            const allRead = mod.chapters.every((ch) => isRead(ch.id));
            const chaptersRead = mod.chapters.filter((ch) => isRead(ch.id)).length;
            return (
              <Link key={mod.id} to={`/modules/${mod.id}`} className="group block">
                <div className="rounded-2xl overflow-hidden border border-border bg-card hover:shadow-lg transition-all">
                  <div className="grid md:grid-cols-[320px_1fr] gap-0">
                    <div className="aspect-video md:aspect-auto overflow-hidden relative">
                      <img src={mod.image} alt={mod.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                      {isLoggedIn && allRead && <div className="absolute top-3 right-3 bg-primary text-primary-foreground rounded-full p-1.5"><CheckCircle2 className="h-4 w-4" /></div>}
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
