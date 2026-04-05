import React, { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Clock, Play, BookOpen, Eye, Heart, CheckCircle2, Sparkles, Rocket, Star, Zap } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SubscribeSection from "@/components/SubscribeSection";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { DUMMY_JUNIOR_MODULES } from "@/lib/data";
import { useAuth } from "@/contexts/AuthContext";
import { useReadingProgress } from "@/contexts/ReadingProgressContext";
import { useTranslation } from "@/hooks/useTranslation";

gsap.registerPlugin(ScrollTrigger);

const FloatingEmoji = ({ emoji, className }: { emoji: string; className?: string }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    gsap.to(ref.current, {
      y: "random(-20, 20)",
      x: "random(-10, 10)",
      rotation: "random(-15, 15)",
      duration: "random(2, 4)",
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
    });
  }, []);

  return (
    <div ref={ref} className={`absolute select-none pointer-events-none ${className}`}>
      <span className="text-4xl md:text-6xl opacity-20">{emoji}</span>
    </div>
  );
};

const JuniorPage = () => {
  const { isLoggedIn, user } = useAuth();
  const isSubscribed = isLoggedIn && user?.isSubscribed;
  const { getProgress, isRead } = useReadingProgress();
  const { t } = useTranslation();

  const heroRef = useRef<HTMLDivElement>(null);
  const heroTextRef = useRef<HTMLDivElement>(null);
  const videoSectionRef = useRef<HTMLDivElement>(null);
  const readingSectionRef = useRef<HTMLDivElement>(null);
  const videoCardsRef = useRef<HTMLDivElement>(null);
  const readingCardsRef = useRef<HTMLDivElement>(null);

  const videoModules = DUMMY_JUNIOR_MODULES.filter((m) => m.contentType === "video");
  const readingModules = DUMMY_JUNIOR_MODULES.filter((m) => m.contentType === "reading");

  // GSAP animations
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Hero entrance
      if (heroTextRef.current) {
        gsap.from(heroTextRef.current.children, {
          y: 40,
          opacity: 0,
          duration: 0.8,
          stagger: 0.15,
          ease: "power3.out",
        });
      }

      // Section headers slide in
      [videoSectionRef, readingSectionRef].forEach((ref) => {
        if (ref.current) {
          gsap.from(ref.current, {
            x: -50,
            opacity: 0,
            duration: 0.6,
            ease: "power2.out",
            scrollTrigger: {
              trigger: ref.current,
              start: "top 85%",
              toggleActions: "play none none none",
            },
          });
        }
      });

      // Cards staggered entrance
      [videoCardsRef, readingCardsRef].forEach((ref) => {
        if (ref.current) {
          gsap.from(ref.current.children, {
            y: 60,
            opacity: 0,
            scale: 0.95,
            duration: 0.5,
            stagger: 0.12,
            ease: "back.out(1.2)",
            scrollTrigger: {
              trigger: ref.current,
              start: "top 85%",
              toggleActions: "play none none none",
            },
          });
        }
      });
    });

    return () => ctx.revert();
  }, []);

  const renderCard = (mod: typeof DUMMY_JUNIOR_MODULES[0]) => {
    const chapterCount = mod.chapters.length;
    const readChapters = isLoggedIn ? mod.chapters.filter((c) => isRead(`junior-${mod.id}-${c.id}`)).length : 0;
    const overallProgress = isLoggedIn && chapterCount > 0 ? Math.round((readChapters / chapterCount) * 100) : 0;
    const isVideo = mod.contentType === "video";
    const TimeIcon = isVideo ? Play : Clock;
    const timeLabel = isVideo ? mod.totalDuration : mod.totalReadTime;

    return (
      <Link key={mod.id} to={`/junior/${mod.id}`}>
        <Card className="overflow-hidden border-border group h-full transition-all duration-300 hover:shadow-xl hover:shadow-secondary/10 hover:-translate-y-2 hover:border-secondary/30">
          <div className="aspect-[16/10] overflow-hidden relative">
            <img src={mod.image} alt={mod.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="absolute top-3 left-3 flex gap-2">
              <Badge className={`${isVideo ? "bg-secondary text-secondary-foreground" : "bg-primary text-primary-foreground"} shadow-lg`}>
                {isVideo ? <Play className="h-3 w-3 mr-1" /> : <BookOpen className="h-3 w-3 mr-1" />}
                {isVideo ? t("junior.video") : t("junior.reading")}
              </Badge>
            </div>
            {isLoggedIn && overallProgress === 100 && (
              <div className="absolute top-3 right-3">
                <Badge className="bg-green-500 text-white shadow-lg"><CheckCircle2 className="h-3 w-3 mr-1" /> {t("junior.done")}</Badge>
              </div>
            )}
            {/* Hover play icon for video */}
            {isVideo && (
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="bg-secondary/90 text-white rounded-full p-4 shadow-xl transform group-hover:scale-110 transition-transform">
                  <Play className="h-8 w-8" />
                </div>
              </div>
            )}
          </div>
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">{mod.tag.name}</Badge>
            </div>
            <h3 className="font-display font-bold text-foreground text-lg leading-tight group-hover:text-secondary transition-colors">{mod.title}</h3>
            <p className="text-sm text-muted-foreground line-clamp-2">{mod.description}</p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><TimeIcon className="h-3.5 w-3.5" /> {timeLabel}</span>
              <span className="flex items-center gap-1"><BookOpen className="h-3.5 w-3.5" /> {chapterCount} {t("common.chapters")}</span>
              {mod.views && <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" /> {mod.views.toLocaleString()}</span>}
              {mod.likes && <span className="flex items-center gap-1"><Heart className="h-3.5 w-3.5" /> {mod.likes.toLocaleString()}</span>}
            </div>
            {isLoggedIn && overallProgress > 0 && overallProgress < 100 && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{readChapters}/{chapterCount} {t("common.chapters")}</span>
                  <span className="font-mono">{overallProgress}%</span>
                </div>
                <Progress value={overallProgress} className="h-1.5" />
              </div>
            )}
          </CardContent>
        </Card>
      </Link>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      {/* Animated Hero Banner */}
      <section ref={heroRef} className="bg-gradient-to-br from-secondary/10 via-background to-primary/5 relative overflow-hidden">
        {/* Floating emojis with GSAP */}
        <FloatingEmoji emoji="💡" className="top-8 left-[5%]" />
        <FloatingEmoji emoji="🚀" className="top-16 right-[10%]" />
        <FloatingEmoji emoji="📚" className="bottom-8 left-[30%]" />
        <FloatingEmoji emoji="🎮" className="bottom-12 right-[5%]" />
        <FloatingEmoji emoji="⭐" className="top-[40%] left-[15%]" />
        <FloatingEmoji emoji="🎯" className="top-[30%] right-[25%]" />
        <FloatingEmoji emoji="💰" className="bottom-[20%] left-[60%]" />
        <FloatingEmoji emoji="🏆" className="top-12 left-[50%]" />

        {/* Animated gradient orbs */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-secondary/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />

        <div className="container py-14 md:py-24 relative z-10" ref={heroTextRef}>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-6 w-6 text-secondary" />
            <span className="inline-block text-xs font-semibold tracking-widest uppercase text-secondary">{t("junior.tag")}</span>
          </div>
          <h1 className="font-display text-4xl md:text-6xl font-bold text-foreground">
            {t("junior.heroTitle1")} <span className="text-secondary inline-flex items-center gap-2">{t("junior.heroTitle2")} <span className="text-4xl md:text-5xl">🎉</span></span>
          </h1>
          <p className="mt-5 text-muted-foreground max-w-xl text-lg leading-relaxed">
            {t("junior.heroDesc")}
          </p>

          {/* Fun stats bar */}
          <div className="mt-8 flex flex-wrap gap-4">
            {[
              { icon: Rocket, label: `${DUMMY_JUNIOR_MODULES.length} Modules`, color: "text-secondary" },
              { icon: Star, label: `${DUMMY_JUNIOR_MODULES.reduce((a, m) => a + m.chapters.length, 0)} Chapters`, color: "text-primary" },
              { icon: Zap, label: "Interactive", color: "text-orange-500" },
            ].map((stat, i) => (
              <div key={i} className="flex items-center gap-2 bg-card/80 backdrop-blur-sm border border-border rounded-full px-4 py-2 shadow-sm">
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
                <span className="text-sm font-medium text-foreground">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Video Modules */}
      <section className="container py-12">
        <div ref={videoSectionRef} className="flex items-center gap-3 mb-8">
          <div className="rounded-xl p-2.5 bg-secondary/10 shadow-sm">
            <Play className="h-6 w-6 text-secondary" />
          </div>
          <div>
            <h2 className="font-display text-2xl font-bold text-foreground">{t("junior.videoModules")}</h2>
            <p className="text-sm text-muted-foreground">{videoModules.length} modules · Watch & learn</p>
          </div>
        </div>
        <div ref={videoCardsRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {videoModules.map(renderCard)}
        </div>
      </section>

      {/* Reading Modules */}
      <section className="container py-12">
        <div ref={readingSectionRef} className="flex items-center gap-3 mb-8">
          <div className="rounded-xl p-2.5 bg-primary/10 shadow-sm">
            <BookOpen className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="font-display text-2xl font-bold text-foreground">{t("junior.readingModules")}</h2>
            <p className="text-sm text-muted-foreground">{readingModules.length} modules · Read & explore</p>
          </div>
        </div>
        <div ref={readingCardsRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {readingModules.map(renderCard)}
        </div>
      </section>

      <SubscribeSection />
      <Footer />
    </div>
  );
};

export default JuniorPage;
