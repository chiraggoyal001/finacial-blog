import React from "react";
import { Link } from "react-router-dom";
import { Clock, Play, BookOpen, Eye, Heart, CheckCircle2, Sparkles } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SubscribeSection from "@/components/SubscribeSection";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { DUMMY_JUNIOR_MODULES } from "@/lib/data";
import { useAuth } from "@/contexts/AuthContext";
import { useReadingProgress } from "@/contexts/ReadingProgressContext";

const JuniorPage = () => {
  const { isLoggedIn, user } = useAuth();
  const isSubscribed = isLoggedIn && user?.isSubscribed;
  const { getProgress, isRead } = useReadingProgress();

  const videoModules = DUMMY_JUNIOR_MODULES.filter((m) => m.contentType === "video");
  const readingModules = DUMMY_JUNIOR_MODULES.filter((m) => m.contentType === "reading");

  const renderCard = (mod: typeof DUMMY_JUNIOR_MODULES[0]) => {
    const chapterCount = mod.chapters.length;
    const readChapters = isLoggedIn ? mod.chapters.filter((c) => isRead(`junior-${mod.id}-${c.id}`)).length : 0;
    const overallProgress = isLoggedIn && chapterCount > 0 ? Math.round((readChapters / chapterCount) * 100) : 0;
    const isVideo = mod.contentType === "video";
    const TimeIcon = isVideo ? Play : Clock;
    const timeLabel = isVideo ? mod.totalDuration : mod.totalReadTime;

    return (
      <Link key={mod.id} to={`/junior/${mod.id}`}>
        <Card className="overflow-hidden hover:shadow-lg transition-all border-border group h-full hover:-translate-y-1">
          <div className="aspect-[16/10] overflow-hidden relative">
            <img src={mod.image} alt={mod.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
            <div className="absolute top-3 left-3 flex gap-2">
              <Badge className={isVideo ? "bg-secondary text-secondary-foreground" : "bg-primary text-primary-foreground"}>
                {isVideo ? <Play className="h-3 w-3 mr-1" /> : <BookOpen className="h-3 w-3 mr-1" />}
                {isVideo ? "Video" : "Reading"}
              </Badge>
            </div>
            {isLoggedIn && overallProgress === 100 && (
              <div className="absolute top-3 right-3">
                <Badge className="bg-success text-white"><CheckCircle2 className="h-3 w-3 mr-1" /> Done</Badge>
              </div>
            )}
          </div>
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">{mod.tag.name}</Badge>
            </div>
            <h3 className="font-display font-bold text-foreground text-lg leading-tight">{mod.title}</h3>
            <p className="text-sm text-muted-foreground line-clamp-2">{mod.description}</p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><TimeIcon className="h-3.5 w-3.5" /> {timeLabel}</span>
              <span className="flex items-center gap-1"><BookOpen className="h-3.5 w-3.5" /> {chapterCount} chapters</span>
              {mod.views && <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" /> {mod.views.toLocaleString()}</span>}
              {mod.likes && <span className="flex items-center gap-1"><Heart className="h-3.5 w-3.5" /> {mod.likes.toLocaleString()}</span>}
            </div>
            {isLoggedIn && overallProgress > 0 && overallProgress < 100 && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{readChapters}/{chapterCount} chapters</span>
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

      {/* Hero Banner */}
      <section className="bg-gradient-to-br from-secondary/10 via-background to-primary/5 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          {/* Fun pattern */}
          <div className="absolute top-10 left-10 text-6xl">💡</div>
          <div className="absolute top-20 right-20 text-5xl">🚀</div>
          <div className="absolute bottom-10 left-1/3 text-4xl">📚</div>
          <div className="absolute bottom-20 right-10 text-6xl">🎮</div>
        </div>
        <div className="container py-12 md:py-20 relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-5 w-5 text-secondary" />
            <span className="inline-block text-xs font-semibold tracking-widest uppercase text-secondary">Junior</span>
          </div>
          <h1 className="font-display text-3xl md:text-5xl font-bold text-foreground">
            Finance Made <span className="text-secondary">Fun</span> 🎉
          </h1>
          <p className="mt-4 text-muted-foreground max-w-xl text-lg">
            Interactive lessons with colourful graphics, quizzes, and bite-sized concepts designed for young learners and beginners.
          </p>
        </div>
      </section>

      {/* Video Modules */}
      <section className="container py-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="rounded-lg p-2 bg-secondary/10">
            <Play className="h-5 w-5 text-secondary" />
          </div>
          <h2 className="font-display text-xl font-bold text-foreground">Video Modules</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {videoModules.map(renderCard)}
        </div>
      </section>

      {/* Reading Modules */}
      <section className="container py-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="rounded-lg p-2 bg-primary/10">
            <BookOpen className="h-5 w-5 text-primary" />
          </div>
          <h2 className="font-display text-xl font-bold text-foreground">Reading Modules</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {readingModules.map(renderCard)}
        </div>
      </section>

      <SubscribeSection />
      <Footer />
    </div>
  );
};

export default JuniorPage;
