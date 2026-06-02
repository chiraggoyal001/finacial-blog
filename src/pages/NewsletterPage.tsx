import React, { useState, useMemo } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SubscribeSection from "@/components/SubscribeSection";
import ArticleCard from "@/components/ArticleCard";
import HorizontalScroll from "@/components/HorizontalScroll";
import { ArticleCardSkeleton, HorizontalScrollSkeleton } from "@/components/skeletons";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "@/hooks/useTranslation";
import { useArticles } from "@/hooks/useContent";

const NewsletterPage = () => {
  const { isLoggedIn, user } = useAuth();
  const isSubscribed = isLoggedIn && user?.isSubscribed;
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const { t } = useTranslation();

  const { data: dbArticles, isLoading } = useArticles({ category: ['Newsletter', 'Blog'], published: true });

  const mappedDbPosts = (dbArticles || []).map(article => ({
    id: article.id,
    title: article.title,
    excerpt: article.excerpt,
    content: article.content,
    category: article.category,
    author: article.author_name,
    date: article.published_at || article.created_at,
    image: article.image || "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600&h=400&fit=crop",
    readTime: article.read_time || "5 min",
    tags: article.tags || [],
    views: article.views || 0,
    likes: article.likes || 0,
  }));

  const newsletterPosts = mappedDbPosts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  // Dynamically extract unique tags from the articles
  const availableTags = useMemo(() => {
    const tags = new Set<string>();
    newsletterPosts.forEach(post => {
      post.tags.forEach(tag => tags.add(tag.name));
    });
    return Array.from(tags).sort();
  }, [newsletterPosts]);

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
            {availableTags.map((tag) => (
              <Badge 
                key={tag} 
                variant={activeTag === tag ? "default" : "outline"} 
                className="cursor-pointer text-xs" 
                onClick={() => setActiveTag(activeTag === tag ? null : tag)}
              >
                {tag}
              </Badge>
            ))}
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
