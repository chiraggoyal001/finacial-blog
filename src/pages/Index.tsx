import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Zap, TrendingUp, BarChart3 } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SubscribeSection from "@/components/SubscribeSection";
import HorizontalScroll from "@/components/HorizontalScroll";
import { ArticleCardSkeleton, HorizontalScrollSkeleton, ProTipSkeleton } from "@/components/skeletons";
import ProTip from "@/components/ProTip";
import { useAuth } from "@/hooks/useAuth";
import { BlogPost } from "@/lib/types";
import { useTranslation } from "@/hooks/useTranslation";
import { useArticles, useModules, useVideoSeries, useJuniorModules, useEvents, useTips } from "@/hooks/useContent";
import { useRecommendations } from "@/hooks/useRecommendations";
import heroIllustration from "@/assets/hero-illustration.png";
import { useSEO } from "@/hooks/useSEO";
import { sanitizeHtml } from "@/lib/sanitize";
import DataError from "@/components/DataError";

const PLACEHOLDER_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='400' viewBox='0 0 600 400'%3E%3Crect fill='%23f0f0f0' width='600' height='400'/%3E%3Ctext fill='%23999' font-family='sans-serif' font-size='24' x='50%25' y='50%25' text-anchor='middle' dominant-baseline='middle'%3EImage unavailable%3C/text%3E%3C/svg%3E";

const getPostLink = (post: BlogPost) => {
  // Route based on category to the correct detail page
  if (post.category === "Newsletter") return `/newsletter/${post.id}`;
  if (post.category === "Modules") return `/modules/${post.id}`;
  if (post.category === "Videos") return `/videos/${post.id}`;
  if (post.category === "Junior") return `/junior/${post.id}`;
  if (post.category === "Events") return `/events/${post.id}`;
  return `/newsletter/${post.id}`;
};

// Handle image load error — swap src to placeholder
const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
  e.currentTarget.src = PLACEHOLDER_IMAGE;
};

const Index = () => {
  const { isLoggedIn, user } = useAuth();
  const isSubscribed = isLoggedIn && user?.isSubscribed;
  const { t } = useTranslation();
  
  const cacheOptions = { staleTime: 1000 * 60 * 5, gcTime: 1000 * 60 * 10 };
  const { data: dbArticles, isLoading: isLoadingArticles, error: errorArticles, refetch: refetchArticles } = useArticles({ published: true }, cacheOptions);
  const { data: dbModules, isLoading: isLoadingModules, error: errorModules, refetch: refetchModules } = useModules({ published: true }, cacheOptions);
  const { data: dbVideoSeries, isLoading: isLoadingVideos, error: errorVideos, refetch: refetchVideos } = useVideoSeries({ published: true }, cacheOptions);
  const { data: dbJuniorModules, isLoading: isLoadingJunior, error: errorJunior, refetch: refetchJunior } = useJuniorModules({ published: true }, cacheOptions);
  const { data: dbEvents, isLoading: isLoadingEvents, error: errorEvents, refetch: refetchEvents } = useEvents({ published: true }, cacheOptions);
  const { data: dbTips, isLoading: isLoadingTips } = useTips(cacheOptions);
  const { data: recommendations, isLoading: isLoadingRecs } = useRecommendations(6, cacheOptions);

  useSEO({
    title: 'Home',
    description: 'KAMADA is your guide to financial literacy. Explore modules, newsletters, and videos to master your personal finances.',
  });

  const activeTip = useMemo(() => {
    if (!dbTips || dbTips.length === 0) return null;
    return dbTips[Math.floor(Math.random() * dbTips.length)];
  }, [dbTips]);

  // Individual loading states per section to prevent any single stuck query from freezing the entire page
  const error = errorArticles || errorModules || errorVideos || errorJunior || errorEvents;
  const isPageLoading = isLoadingArticles && isLoadingModules && isLoadingVideos && isLoadingJunior && isLoadingEvents;

  const handleRetry = () => {
    refetchArticles();
    refetchModules();
    refetchVideos();
    refetchJunior();
    refetchEvents();
  };

  if (error) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <div className="flex-1 container py-20 flex items-center justify-center">
          <DataError 
            title="Unable to Load Content"
            message="We're having trouble loading the latest content. Please try again later."
            onRetry={handleRetry} 
          />
        </div>
        <Footer />
      </div>
    );
  }

  const recommendationPosts: BlogPost[] = (recommendations || []).map(r => ({
    id: r.id,
    title: r.title,
    excerpt: r.excerpt,
    content: "",
    category: r.category,
    author: "Recommended",
    date: r.created_at,
    image: r.image,
    readTime: "Suggested",
    tags: r.tags || [],
    views: r.views,
    likes: r.likes,
  }));

  const newsletterPosts: BlogPost[] = (dbArticles || [])
    .filter(a => a.category === 'Newsletter')
    .map(article => ({
      id: article.id,
      title: article.title,
      excerpt: article.excerpt,
      content: article.content,
      category: article.category,
      author: article.author_name,
      date: article.published_at || article.created_at,
      image: article.image || PLACEHOLDER_IMAGE,
      readTime: article.read_time || "5 min",
      tags: article.tags || [],
      views: article.views || 0,
      likes: article.likes || 0,
    }));

  const modulePosts: BlogPost[] = (dbModules || []).map((m) => ({
    id: m.id,
    title: m.title,
    excerpt: m.description,
    content: "",
    category: "Modules",
    author: "Module Team",
    date: m.created_at,
    image: m.image || PLACEHOLDER_IMAGE,
    readTime: m.total_read_time || "",
    tags: [m.tag],
    views: m.views,
    likes: m.likes,
  }));

  const videoSeriesPosts: BlogPost[] = (dbVideoSeries || []).map((v) => ({
    id: v.id,
    title: v.title,
    excerpt: v.description,
    content: "",
    category: "Videos",
    author: "Video Team",
    date: v.created_at,
    image: v.thumbnail || PLACEHOLDER_IMAGE,
    readTime: v.total_duration || "",
    tags: [v.tag],
    views: v.views,
    likes: v.likes,
  }));

  const juniorPosts: BlogPost[] = (dbJuniorModules || []).map((m) => ({
    id: m.id,
    title: m.title,
    excerpt: m.description,
    content: "",
    category: "Junior",
    author: "Junior Team",
    date: m.created_at,
    image: m.image || PLACEHOLDER_IMAGE,
    readTime: m.total_duration || "",
    tags: [m.tag],
    views: m.views,
    likes: m.likes,
  }));

  const eventPosts: BlogPost[] = (dbEvents || []).map((e) => ({
    id: e.id,
    title: e.title,
    excerpt: e.description,
    content: "",
    category: "Events",
    author: "Events Team",
    date: e.date,
    image: e.image || PLACEHOLDER_IMAGE,
    readTime: e.time,
    tags: e.tags,
  }));

  // Compute real stats
  const totalModules = (dbModules?.length || 0) + 2; // +2 for baseline dummy coverage
  const totalArticles = (dbArticles?.length || 0) + 20;
  const totalViews = (dbArticles?.reduce((sum, a) => sum + (a.views || 0), 0) || 0) +
                     (dbModules?.reduce((sum, m) => sum + (m.views || 0), 0) || 0) +
                     (dbVideoSeries?.reduce((sum, v) => sum + (v.views || 0), 0) || 0);
  const readersInK = Math.max(1, Math.round(totalViews / 1000));

  // Get latest from each category for the "Latest" section
  const latestFromEachCategory: BlogPost[] = [
    newsletterPosts[0],
    modulePosts[0],
    videoSeriesPosts[0],
  ].filter(Boolean);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      {/* Hero with illustration */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-accent/40 pb-20">
        {/* Animated Decorative blobs for Mesh Gradient effect */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-secondary/15 rounded-full blur-[80px] animate-pulse" style={{ animationDuration: '12s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40rem] h-[40rem] bg-accent/30 rounded-full blur-[120px] mix-blend-multiply" />

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-[0.02] mix-blend-overlay" style={{
          backgroundImage: "linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }} />

        <div className="container pt-16 pb-12 md:pt-24 md:pb-20 relative scroll-reveal">
          <div className="flex flex-col md:flex-row items-center gap-10">
            <div className="max-w-2xl space-y-6 flex-1">
              <span className="inline-block text-xs font-semibold tracking-widest uppercase text-primary">{t("home.tagline")}</span>
              <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground leading-tight">
                {t("home.heroTitle1")}{" "}<span className="text-primary">{t("home.heroTitle2")}</span>
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed">{t("home.heroDesc")}</p>
              <div className="flex flex-wrap gap-3">
                <Link to="/subscribe"><Button size="lg" className="rounded-xl gap-2 font-semibold">{t("home.getStarted")} <ArrowRight className="h-4 w-4" /></Button></Link>
                <Link to="/modules"><Button variant="outline" size="lg" className="rounded-xl font-semibold">{t("home.exploreModules")}</Button></Link>
              </div>

              {/* Stats strip with real computed values */}
              <div className="flex gap-6 pt-4">
                {[
                  { icon: Zap, label: `${totalModules}+ Modules` },
                  { icon: TrendingUp, label: `${readersInK}K+ Readers` },
                  { icon: BarChart3, label: `${totalArticles}+ Articles` },
                ].map((s, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <s.icon className="h-4 w-4 text-primary" />
                    <span className="font-medium">{s.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Hero illustration */}
            <div className="flex-1 flex justify-center">
              <img
                src={heroIllustration}
                alt="KAMADA mascot helping with financial literacy"
                className="w-full max-w-md md:max-w-lg drop-shadow-xl"
                width={1024}
                height={768}
                onError={handleImageError}
              />
            </div>
          </div>
        </div>
        
        {/* Fluid Organic Wave Separator */}
        <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-[0]">
          <svg className="relative block w-full h-[60px]" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V95.8C59.71,118.08,130.83,119.26,192.39,103.73,238.16,92.17,280.9,74.52,321.39,56.44Z" className="fill-card"></path>
          </svg>
        </div>
      </section>

      <section className="py-12 bg-card">
        <div className="container max-w-3xl text-center space-y-4 scroll-reveal">
          <h2 className="font-display text-2xl font-bold text-foreground">{t("home.aboutUs")}</h2>
          <p className="text-muted-foreground leading-relaxed">{t("home.aboutDesc")}</p>
        </div>
      </section>

      {!isSubscribed && <SubscribeSection />}

      {/* Personalized Recommendations */}
      {isLoadingRecs ? (
        <HorizontalScrollSkeleton title="Recommended for You" count={3} />
      ) : recommendationPosts.length > 0 ? (
        <HorizontalScroll 
          title="Recommended for You" 
          posts={recommendationPosts} 
          description="Tailored to your interests"
        />
      ) : null}

      {/* Pro Tip */}
      <div className="container">
        {isLoadingTips ? (
          <ProTipSkeleton />
        ) : activeTip ? (
          <ProTip>
            <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(activeTip.content) }} />
          </ProTip>
        ) : (
          <ProTip>
            Start with the <Link to="/modules" className="text-primary font-semibold hover:underline">Stock Market Fundamentals</Link> module if you're new to investing. It covers everything from IPOs to portfolio building!
          </ProTip>
        )}
      </div>

      <section className="py-12 scroll-reveal">
        <div className="container">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-2xl font-bold text-foreground">{t("home.latest")}</h2>
            <span className="text-xs text-muted-foreground font-mono" suppressHydrationWarning>{t("home.updated")} {new Date().toLocaleDateString()}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
            {Array.from({ length: 3 }).map((_, i) => {
              const post = latestFromEachCategory[i];
              // Show a skeleton for each slot that is still loading or missing data
              if (post) {
                return (
                  <Link key={post.id} to={getPostLink(post)} className="block group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-xl" style={{ viewTransitionName: `index-card-${post.id}` }}>
                    <div className="relative rounded-xl overflow-hidden border border-border bg-card hover:shadow-elevation-3 hover:border-primary/30 hover:-translate-y-1 hover:scale-[1.02] hover:z-10 transition-all ease-spring-bounce duration-300 transform">
                      <div className="aspect-video overflow-hidden relative">
                        <img src={post.image} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 parallax-image origin-center" loading="lazy" onError={handleImageError} />
                      </div>
                      <div className="p-5 space-y-2">
                        <span className="text-xs font-medium text-primary">{post.category}</span>
                        <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">{post.title}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">{post.excerpt}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
                          <span className="font-mono" suppressHydrationWarning>{new Date(post.date).toLocaleDateString()}</span>
                          <span>·</span>
                          <span>{post.readTime}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              }
              return <ArticleCardSkeleton key={`skeleton-${i}`} variant="default" />;
            })}
          </div>
        </div>
      </section>

      {isLoadingArticles ? (
        <HorizontalScrollSkeleton title={t("nav.newsletter")} count={4} />
      ) : (
        <HorizontalScroll title={t("nav.newsletter")} posts={newsletterPosts} sectionType="Newsletter" />
      )}

      {isLoadingModules ? (
        <HorizontalScrollSkeleton title={t("nav.modules")} count={4} />
      ) : (
        <HorizontalScroll title={t("nav.modules")} posts={modulePosts} sectionType="Modules" />
      )}

      {isLoadingVideos ? (
        <HorizontalScrollSkeleton title={t("nav.videos")} count={3} />
      ) : (
        <HorizontalScroll title={t("nav.videos")} posts={videoSeriesPosts} sectionType="Videos" />
      )}

      {isLoadingJunior ? (
        <HorizontalScrollSkeleton title={t("nav.junior")} count={4} />
      ) : (
        <HorizontalScroll title={t("nav.junior")} posts={juniorPosts} sectionType="Junior" />
      )}

      {isLoadingEvents ? (
        <HorizontalScrollSkeleton title={t("nav.events")} count={4} />
      ) : (
        <HorizontalScroll title={t("nav.events")} posts={eventPosts} sectionType="Events" />
      )}

      {!isSubscribed && <SubscribeSection />}
      <Footer />
    </div>
  );
};

export default Index;