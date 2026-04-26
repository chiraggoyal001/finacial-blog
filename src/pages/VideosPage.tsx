import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Clock, Play, Eye, Heart, Film, BookOpen } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SubscribeSection from "@/components/SubscribeSection";
import { Badge } from "@/components/ui/badge";
import { DUMMY_VIDEO_SERIES, DUMMY_MODULES } from "@/lib/data";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import { VideoCardSkeleton } from "@/components/skeletons";

const VideosPage = () => {
  const { isLoggedIn, user } = useAuth();
  const isSubscribed = isLoggedIn && user?.isSubscribed;
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <section className="bg-gradient-to-br from-primary/5 via-background to-accent/30">
        <div className="container py-10 md:py-16">
          <span className="inline-block text-xs font-semibold tracking-widest uppercase text-primary mb-2">{t("videos.tag")}</span>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">{t("videos.title1")} <span className="text-primary">{t("videos.title2")}</span></h1>
          <p className="text-muted-foreground mt-2 max-w-xl">{t("videos.desc")}</p>
        </div>
      </section>
      <section className="py-10">
        <div className="container space-y-8">
          {isLoading
            ? Array.from({ length: 3 }).map((_, i) => <VideoCardSkeleton key={i} />)
            : DUMMY_VIDEO_SERIES.map((series) => {
            const linkedModule = series.linkedModuleId ? DUMMY_MODULES.find((m) => m.id === series.linkedModuleId) : null;
            return (
              <Link key={series.id} to={`/videos/${series.id}`} className="group block">
                <div className="rounded-2xl overflow-hidden border border-border bg-card hover:shadow-lg transition-all">
                  <div className="grid md:grid-cols-[320px_1fr] gap-0">
                    <div className="aspect-video md:aspect-auto overflow-hidden relative">
                      <img src={series.thumbnail} alt={series.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="bg-primary text-primary-foreground rounded-full p-3"><Play className="h-6 w-6" /></div>
                      </div>
                    </div>
                    <div className="p-6 flex flex-col justify-center space-y-3">
                      <Badge variant={series.tag.type === "major" ? "default" : "secondary"} className="text-[10px] w-fit">{series.tag.name}</Badge>
                      <h2 className="font-display text-xl md:text-2xl font-bold text-foreground group-hover:text-primary transition-colors">{series.title}</h2>
                      <p className="text-sm text-muted-foreground leading-relaxed">{series.description}</p>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Film className="h-3.5 w-3.5" />{series.chapters.length} {t("videos.videos")}</span>
                        <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{series.totalDuration}</span>
                        {series.views && <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" />{series.views.toLocaleString()}</span>}
                        {series.likes && <span className="flex items-center gap-1"><Heart className="h-3.5 w-3.5" />{series.likes}</span>}
                      </div>
                      {linkedModule && (
                        <Link to={`/modules/${linkedModule.id}`} className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline w-fit" onClick={(e) => e.stopPropagation()}>
                          <BookOpen className="h-3.5 w-3.5" />{t("videos.relatedModule")} {linkedModule.title}
                        </Link>
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

export default VideosPage;
