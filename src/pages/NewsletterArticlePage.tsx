import React, { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Clock, Eye, Heart, Share2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SubscribeSection from "@/components/SubscribeSection";
import ArticleCard from "@/components/ArticleCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useArticle, useArticles } from "@/hooks/useContent";
import { ArticlePageSkeleton } from "@/components/skeletons";
import { useSEO } from "@/hooks/useSEO";
import { BookmarkButton } from "@/components/BookmarkButton";
import { sanitizeHtml } from "@/lib/sanitize";
import { useAuth } from "@/hooks/useAuth";
import { useReadingProgress } from "@/contexts/ReadingProgressContext";
import DataError from "@/components/DataError";
import { SOCIAL_LINKS } from "@/lib/data";

const XIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-label="X">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const NewsletterArticlePage = () => {
  const { id } = useParams<{ id: string }>();
  const { isLoggedIn, user } = useAuth();
  const { getProgress, setProgress } = useReadingProgress();
  const isSubscribed = isLoggedIn && user?.isSubscribed;

  const contentRef = useRef<HTMLDivElement>(null);
  const [scrollPercent, setScrollPercent] = useState(0);

  const { data: dbArticle, isLoading, error, refetch } = useArticle(id || '', { publishedOnly: true });
  const { data: dbArticles } = useArticles({ published: true });

  const allArticles = (dbArticles || []).map(article => ({
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

  const readPercent = id ? getProgress(id) : 0;

  useEffect(() => {
    if (!id || !isLoggedIn || !contentRef.current) return;

    const handleScroll = () => {
      const el = contentRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const totalHeight = el.scrollHeight;
      const visibleBottom = window.innerHeight - rect.top;
      const percent = Math.round(Math.min(100, Math.max(0, (visibleBottom / totalHeight) * 100)));
      setScrollPercent(percent);
      setProgress(id, percent);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [id, isLoggedIn, setProgress]);

  if (isLoading) {
    return <ArticlePageSkeleton />;
  }

  if (error || !dbArticle) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <div className="flex-1 container py-20 flex items-center justify-center">
          <DataError 
            title="Article Not Found"
            message="The article you are looking for might have been moved or is not yet published."
            onRetry={() => refetch()} 
          />
        </div>
        <Footer />
      </div>
    );
  }

  const post = {
    id: dbArticle.id,
    title: dbArticle.title,
    excerpt: dbArticle.excerpt,
    content: dbArticle.content,
    category: dbArticle.category,
    author: dbArticle.author_name,
    date: dbArticle.published_at || dbArticle.created_at,
    image: dbArticle.image || "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600&h=400&fit=crop",
    readTime: dbArticle.read_time || "5 min",
    tags: dbArticle.tags || [],
    views: dbArticle.views || 0,
    likes: dbArticle.likes || 0,
    seoTitle: dbArticle.seo_title,
    seoDescription: dbArticle.seo_description,
  };

  // Recommendations: same tags, excluding current
  const recommendations = allArticles
    .filter((p) => p.id !== post.id && p.tags.some((t) => post.tags.some((pt) => pt.name === t.name)))
    .slice(0, 3);

  // Other articles from same category
  const otherArticles = allArticles
    .filter((p) => p.id !== post.id && p.category === post.category)
    .slice(0, 3);

  const currentPercent = isLoggedIn ? Math.max(readPercent, scrollPercent) : scrollPercent;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      {/* Reading progress bar - sticky */}
      <div className="sticky top-16 z-40 w-full">
        <Progress value={currentPercent} className="h-1 rounded-none" />
      </div>


      {/* Article */}
      <article className="py-8">
        <div className="container max-w-3xl">
          {/* Header */}
          <div className="space-y-4 mb-8">
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <Badge key={tag.name} variant={tag.type === "major" ? "default" : "secondary"} className="text-xs">
                  {tag.name}
                </Badge>
              ))}
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground leading-tight">
              {post.title}
            </h1>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="font-mono">{new Date(post.date).toLocaleDateString()}</span>
                <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{post.readTime}</span>
                {post.views && <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" />{post.views.toLocaleString()}</span>}
                {post.likes && <span className="flex items-center gap-1"><Heart className="h-3.5 w-3.5" />{post.likes}</span>}
              </div>
              <BookmarkButton contentType="article" contentId={post.id} showText />
            </div>
            {isLoggedIn && readPercent > 0 && (
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span>{readPercent >= 100 ? "✓ Read" : `${readPercent}% read`}</span>
                <Progress value={readPercent} className="h-1.5 flex-1 max-w-[200px]" />
              </div>
            )}
          </div>

          {/* Hero Image */}
          <div className="rounded-xl overflow-hidden mb-8">
            <img src={post.image} alt={post.title} className="w-full aspect-video object-cover" />
          </div>

          {/* Content */}
          <div
            ref={contentRef}
            className="prose prose-lg dark:prose-invert max-w-none prose-headings:font-display prose-headings:text-foreground prose-p:text-muted-foreground prose-a:text-primary"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.content) }}
          />

          {/* Social Share */}
          <div className="flex items-center gap-3 pt-8 mt-8 border-t border-border">
            <span className="text-sm text-muted-foreground flex items-center gap-1.5"><Share2 className="h-4 w-4" /> Share</span>
            <a href={SOCIAL_LINKS.twitter} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary"><XIcon /></a>
            <a href={SOCIAL_LINKS.linkedin} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
            </a>
            <a href={SOCIAL_LINKS.whatsapp} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            </a>
          </div>
        </div>
      </article>

      {/* Other Articles */}
      {otherArticles.length > 0 && (
        <section className="py-8 bg-card">
          <div className="container">
            <h2 className="font-display text-lg font-bold text-foreground mb-4">More from {post.category}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {otherArticles.map((p) => (
                <ArticleCard key={p.id} post={p} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Subscribe */}
      {!isSubscribed && <SubscribeSection />}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <section className="py-8">
          <div className="container">
            <h2 className="font-display text-lg font-bold text-foreground mb-4">Recommended for You</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {recommendations.map((p) => (
                <ArticleCard key={p.id} post={p} />
              ))}
            </div>
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
};

export default NewsletterArticlePage;
