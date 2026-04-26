import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SubscribeSection from "@/components/SubscribeSection";
import ArticleCard from "@/components/ArticleCard";
import HorizontalScroll from "@/components/HorizontalScroll";
import { ArticleCardSkeleton, HorizontalScrollSkeleton } from "@/components/skeletons";
import { DUMMY_POSTS, MAJOR_TAGS, MINOR_TAGS } from "@/lib/data";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";

const NewsletterPage = () => {
  const { isLoggedIn, user } = useAuth();
  const isSubscribed = isLoggedIn && user?.isSubscribed;
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 700);
    return () => clearTimeout(timer);
  }, []);

  const newsletterPosts = DUMMY_POSTS.filter((p) => p.category === "Newsletter").sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const latestPost = newsletterPosts[0];
  const pastPosts = newsletterPosts.slice(1);
  const mostViewed = [...newsletterPosts].sort((a, b) => (b.views || 0) - (a.views || 0));
  const mostLiked = [...newsletterPosts].sort((a, b) => (b.likes || 0) - (a.likes || 0));
  const filteredByTag = activeTag ? newsletterPosts.filter((p) => p.tags.some((tg) => tg.name === activeTag)) : [];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <section className="bg-gradient-to-br from-primary/5 via-background to-accent/30">
        <div className="container py-10 md:py-16">
          <span className="inline-block text-xs font-semibold tracking-widest uppercase text-primary mb-2">{t("newsletter.tag")}</span>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">{t("newsletter.title1")} <span className="text-primary">{t("newsletter.title2")}</span></h1>
          <p className="text-muted-foreground mt-2 max-w-xl">{t("newsletter.desc")}</p>
        </div>
      </section>
      {isLoading ? (
        <section className="py-8"><div className="container"><h2 className="font-display text-lg font-bold text-foreground mb-4">{t("newsletter.latestIssue")}</h2><ArticleCardSkeleton variant="hero" /></div></section>
      ) : latestPost && (
        <section className="py-8"><div className="container"><h2 className="font-display text-lg font-bold text-foreground mb-4">{t("newsletter.latestIssue")}</h2><ArticleCard post={latestPost} variant="hero" /></div></section>
      )}
      {isLoading ? (
        <section className="py-8"><div className="container"><h2 className="font-display text-lg font-bold text-foreground mb-4">{t("newsletter.pastIssues")}</h2><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{Array.from({ length: 3 }).map((_, i) => <ArticleCardSkeleton key={i} variant="default" />)}</div></div></section>
      ) : pastPosts.length > 0 && (
        <section className="py-8"><div className="container"><h2 className="font-display text-lg font-bold text-foreground mb-4">{t("newsletter.pastIssues")}</h2><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{pastPosts.map((post) => <ArticleCard key={post.id} post={post} />)}</div></div></section>
      )}
      <section className="py-8">
        <div className="container space-y-4">
          <h2 className="font-display text-lg font-bold text-foreground">{t("newsletter.browseByTag")}</h2>
          <div className="flex flex-wrap gap-2">
            {MAJOR_TAGS.map((tag) => <Badge key={tag} variant={activeTag === tag ? "default" : "outline"} className="cursor-pointer text-xs" onClick={() => setActiveTag(activeTag === tag ? null : tag)}>{tag}</Badge>)}
            {MINOR_TAGS.map((tag) => <Badge key={tag} variant={activeTag === tag ? "secondary" : "outline"} className="cursor-pointer text-xs" onClick={() => setActiveTag(activeTag === tag ? null : tag)}>{tag}</Badge>)}
          </div>
          {activeTag && filteredByTag.length > 0 && <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">{filteredByTag.map((post) => <ArticleCard key={post.id} post={post} />)}</div>}
          {activeTag && filteredByTag.length === 0 && <p className="text-sm text-muted-foreground">{t("newsletter.noArticles")} "{activeTag}".</p>}
        </div>
      </section>
      {isLoading ? (
        <>
          <HorizontalScrollSkeleton title={t("newsletter.mostViewed")} count={4} />
          <HorizontalScrollSkeleton title={t("newsletter.mostLiked")} count={4} />
        </>
      ) : (
        <>
          <HorizontalScroll title={t("newsletter.mostViewed")} posts={mostViewed} />
          <HorizontalScroll title={t("newsletter.mostLiked")} posts={mostLiked} />
        </>
      )}
      {!isSubscribed && <SubscribeSection />}
      <Footer />
    </div>
  );
};

export default NewsletterPage;
