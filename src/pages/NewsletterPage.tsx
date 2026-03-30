import React, { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SubscribeSection from "@/components/SubscribeSection";
import ArticleCard from "@/components/ArticleCard";
import HorizontalScroll from "@/components/HorizontalScroll";
import { DUMMY_POSTS, MAJOR_TAGS, MINOR_TAGS } from "@/lib/data";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";

const NewsletterPage = () => {
  const { isLoggedIn, user } = useAuth();
  const isSubscribed = isLoggedIn && user?.isSubscribed;
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const newsletterPosts = DUMMY_POSTS.filter((p) => p.category === "Newsletter")
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const latestPost = newsletterPosts[0];
  const pastPosts = newsletterPosts.slice(1);

  const mostViewed = [...newsletterPosts].sort((a, b) => (b.views || 0) - (a.views || 0));
  const mostLiked = [...newsletterPosts].sort((a, b) => (b.likes || 0) - (a.likes || 0));

  const filteredByTag = activeTag
    ? newsletterPosts.filter((p) => p.tags.some((t) => t.name === activeTag))
    : [];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      {/* Hero Banner */}
      <section className="bg-gradient-to-br from-primary/5 via-background to-accent/30">
        <div className="container py-10 md:py-16">
          <span className="inline-block text-xs font-semibold tracking-widest uppercase text-primary mb-2">
            Newsletter
          </span>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">
            Stay Ahead of the <span className="text-primary">Markets</span>
          </h1>
          <p className="text-muted-foreground mt-2 max-w-xl">
            Weekly insights, market analysis, and expert commentary delivered to you.
          </p>
        </div>
      </section>

      {/* Latest Article Hero */}
      {latestPost && (
        <section className="py-8">
          <div className="container">
            <h2 className="font-display text-lg font-bold text-foreground mb-4">Latest Issue</h2>
            <ArticleCard post={latestPost} variant="hero" />
          </div>
        </section>
      )}

      {/* Past Articles */}
      {pastPosts.length > 0 && (
        <section className="py-8">
          <div className="container">
            <h2 className="font-display text-lg font-bold text-foreground mb-4">Past Issues</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pastPosts.map((post) => (
                <ArticleCard key={post.id} post={post} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Filter by Tags */}
      <section className="py-8">
        <div className="container space-y-4">
          <h2 className="font-display text-lg font-bold text-foreground">Browse by Tag</h2>
          <div className="flex flex-wrap gap-2">
            {MAJOR_TAGS.map((tag) => (
              <Badge
                key={tag}
                variant={activeTag === tag ? "default" : "outline"}
                className="cursor-pointer text-xs"
                onClick={() => setActiveTag(activeTag === tag ? null : tag)}
              >
                {tag}
              </Badge>
            ))}
            {MINOR_TAGS.map((tag) => (
              <Badge
                key={tag}
                variant={activeTag === tag ? "secondary" : "outline"}
                className="cursor-pointer text-xs"
                onClick={() => setActiveTag(activeTag === tag ? null : tag)}
              >
                {tag}
              </Badge>
            ))}
          </div>
          {activeTag && filteredByTag.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
              {filteredByTag.map((post) => (
                <ArticleCard key={post.id} post={post} />
              ))}
            </div>
          )}
          {activeTag && filteredByTag.length === 0 && (
            <p className="text-sm text-muted-foreground">No newsletter articles found for "{activeTag}".</p>
          )}
        </div>
      </section>

      {/* Horizontal Scroll: Most Viewed */}
      <HorizontalScroll title="Most Viewed" posts={mostViewed} />

      {/* Horizontal Scroll: Most Liked */}
      <HorizontalScroll title="Most Liked" posts={mostLiked} />

      {/* Subscribe */}
      {!isSubscribed && <SubscribeSection />}

      <Footer />
    </div>
  );
};

export default NewsletterPage;
