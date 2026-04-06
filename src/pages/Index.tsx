import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, TrendingUp, PieChart, BarChart3, Wallet, Shield, Zap } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SubscribeSection from "@/components/SubscribeSection";
import HorizontalScroll from "@/components/HorizontalScroll";
import ProTip from "@/components/ProTip";
import { DUMMY_POSTS, DUMMY_JUNIOR_MODULES, DUMMY_EVENTS } from "@/lib/data";
import { useAuth } from "@/contexts/AuthContext";
import { BlogPost } from "@/lib/types";
import { useTranslation } from "@/hooks/useTranslation";

const FloatingIcon = ({ children, className, style }: { children: React.ReactNode; className: string; style?: React.CSSProperties }) => (
  <div className={`absolute hidden md:flex items-center justify-center rounded-2xl bg-card/80 backdrop-blur border border-border shadow-lg ${className}`} style={style}>
    {children}
  </div>
);

const Index = () => {
  const { isLoggedIn, user } = useAuth();
  const isSubscribed = isLoggedIn && user?.isSubscribed;
  const { t } = useTranslation();

  const latestPosts = [...DUMMY_POSTS].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const newsletterPosts = DUMMY_POSTS.filter((p) => p.category === "Newsletter");
  const modulePosts = DUMMY_POSTS.filter((p) => p.category === "Modules");
  const videoPosts = DUMMY_POSTS.filter((p) => p.category === "Videos");

  const juniorPosts: BlogPost[] = DUMMY_JUNIOR_MODULES.map((m) => ({
    id: m.id, title: m.title, excerpt: m.description, content: "", category: "Junior",
    author: "Junior Team", date: "2025-06-01", image: m.image,
    readTime: m.totalReadTime || m.totalDuration || "", tags: [m.tag], views: m.views, likes: m.likes,
  }));

  const eventPosts: BlogPost[] = DUMMY_EVENTS.map((e) => ({
    id: e.id, title: e.title, excerpt: e.description, content: "", category: "Events",
    author: "Events Team", date: e.date, image: e.image, readTime: e.time, tags: e.tags,
  }));

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      {/* Hero with floating graphics */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-accent/30">
        {/* Decorative blobs */}
        <div className="absolute top-10 right-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-20 w-56 h-56 bg-secondary/5 rounded-full blur-3xl" />

        {/* Floating icons */}
        <FloatingIcon className="w-12 h-12 top-16 right-[15%] animate-bounce" style={{ animationDuration: "3s" } as React.CSSProperties}>
          <TrendingUp className="h-5 w-5 text-primary" />
        </FloatingIcon>
        <FloatingIcon className="w-10 h-10 top-32 right-[30%] animate-bounce" style={{ animationDuration: "4s", animationDelay: "0.5s" } as React.CSSProperties}>
          <PieChart className="h-4 w-4 text-secondary" />
        </FloatingIcon>
        <FloatingIcon className="w-11 h-11 bottom-16 right-[20%] animate-bounce" style={{ animationDuration: "3.5s", animationDelay: "1s" } as React.CSSProperties}>
          <BarChart3 className="h-4 w-4 text-primary" />
        </FloatingIcon>
        <FloatingIcon className="w-10 h-10 top-24 right-[45%] animate-bounce" style={{ animationDuration: "4.5s", animationDelay: "1.5s" } as React.CSSProperties}>
          <Wallet className="h-4 w-4 text-secondary" />
        </FloatingIcon>
        <FloatingIcon className="w-9 h-9 bottom-28 right-[38%] animate-bounce" style={{ animationDuration: "3.8s", animationDelay: "0.8s" } as React.CSSProperties}>
          <Shield className="h-3.5 w-3.5 text-primary" />
        </FloatingIcon>

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: "linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }} />

        <div className="container py-16 md:py-24 relative">
          <div className="max-w-2xl space-y-6">
            <span className="inline-block text-xs font-semibold tracking-widest uppercase text-primary">{t("home.tagline")}</span>
            <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground leading-tight">
              {t("home.heroTitle1")}{" "}<span className="text-primary">{t("home.heroTitle2")}</span>
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">{t("home.heroDesc")}</p>
            <div className="flex flex-wrap gap-3">
              <Link to="/subscribe"><Button size="lg" className="rounded-xl gap-2 font-semibold">{t("home.getStarted")} <ArrowRight className="h-4 w-4" /></Button></Link>
              <Link to="/modules"><Button variant="outline" size="lg" className="rounded-xl font-semibold">{t("home.exploreModules")}</Button></Link>
            </div>

            {/* Stats strip */}
            <div className="flex gap-6 pt-4">
              {[
                { icon: Zap, label: "8+ Modules", value: "" },
                { icon: TrendingUp, label: "10K+ Readers", value: "" },
                { icon: BarChart3, label: "50+ Articles", value: "" },
              ].map((s, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <s.icon className="h-4 w-4 text-primary" />
                  <span className="font-medium">{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 bg-card">
        <div className="container max-w-3xl text-center space-y-4">
          <h2 className="font-display text-2xl font-bold text-foreground">{t("home.aboutUs")}</h2>
          <p className="text-muted-foreground leading-relaxed">{t("home.aboutDesc")}</p>
        </div>
      </section>

      {!isSubscribed && <SubscribeSection />}

      {/* Pro Tip */}
      <div className="container">
        <ProTip>
          Start with the <Link to="/modules" className="text-primary font-semibold hover:underline">Stock Market Fundamentals</Link> module if you're new to investing. It covers everything from IPOs to portfolio building!
        </ProTip>
      </div>

      <section className="py-12">
        <div className="container">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-2xl font-bold text-foreground">{t("home.latest")}</h2>
            <span className="text-xs text-muted-foreground font-mono">{t("home.updated")} {new Date().toLocaleDateString()}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {latestPosts.slice(0, 3).map((post) => (
              <Link key={post.id} to={`/post/${post.id}`} className="block group">
                <div className="rounded-xl overflow-hidden border border-border bg-card hover:shadow-lg hover:border-primary/30 transition-all duration-300">
                  <div className="aspect-video overflow-hidden">
                    <img src={post.image} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                  </div>
                  <div className="p-5 space-y-2">
                    <span className="text-xs font-medium text-primary">{post.category}</span>
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">{post.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">{post.excerpt}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
                      <span className="font-mono">{new Date(post.date).toLocaleDateString()}</span>
                      <span>·</span>
                      <span>{post.readTime}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <HorizontalScroll title={t("nav.newsletter")} posts={newsletterPosts} />
      <HorizontalScroll title={t("nav.modules")} posts={modulePosts} />
      <HorizontalScroll title={t("nav.videos")} posts={videoPosts} />
      <HorizontalScroll title={t("nav.junior")} posts={juniorPosts} />
      <HorizontalScroll title={t("nav.events")} posts={eventPosts} />

      {!isSubscribed && <SubscribeSection />}
      <Footer />
    </div>
  );
};

export default Index;
