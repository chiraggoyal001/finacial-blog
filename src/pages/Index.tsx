import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SubscribeSection from "@/components/SubscribeSection";
import HorizontalScroll from "@/components/HorizontalScroll";
import { DUMMY_POSTS } from "@/lib/data";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const { isLoggedIn, user } = useAuth();
  const isSubscribed = isLoggedIn && user?.isSubscribed;

  const latestPosts = [...DUMMY_POSTS].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const newsletterPosts = DUMMY_POSTS.filter((p) => p.category === "Newsletter");
  const modulePosts = DUMMY_POSTS.filter((p) => p.category === "Modules");
  const videoPosts = DUMMY_POSTS.filter((p) => p.category === "Videos");

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      {/* Hero / Banner */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-accent/30">
        <div className="container py-16 md:py-24">
          <div className="max-w-2xl space-y-6">
            <span className="inline-block text-xs font-semibold tracking-widest uppercase text-primary">
              Financial Insights & More
            </span>
            <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground leading-tight">
              Empowering You With{" "}
              <span className="text-primary">Knowledge</span>
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Curated newsletters, learning modules, and video content — your one-stop platform for financial literacy and beyond.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/subscribe">
                <Button size="lg" className="rounded-xl gap-2 font-semibold">
                  Get Started <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/modules">
                <Button variant="outline" size="lg" className="rounded-xl font-semibold">
                  Explore Modules
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* About Us */}
      <section className="py-12 bg-card">
        <div className="container max-w-3xl text-center space-y-4">
          <h2 className="font-display text-2xl font-bold text-foreground">About Us</h2>
          <p className="text-muted-foreground leading-relaxed">
            We are a team of financial enthusiasts, educators, and market analysts committed to making complex financial topics accessible to everyone.
            From weekly market wraps to in-depth learning modules and engaging video content, we help you make smarter decisions.
          </p>
        </div>
      </section>

      {/* Subscribe CTA (unless already subscribed) */}
      {!isSubscribed && <SubscribeSection />}

      {/* Latest */}
      <section className="py-12">
        <div className="container">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-2xl font-bold text-foreground">Latest</h2>
            <span className="text-xs text-muted-foreground font-mono">
              Updated {new Date().toLocaleDateString()}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {latestPosts.slice(0, 3).map((post) => (
              <Link key={post.id} to={`/post/${post.id}`} className="group">
                <div className="rounded-xl overflow-hidden border border-border bg-card hover:shadow-lg transition-all">
                  <div className="aspect-video overflow-hidden">
                    <img
                      src={post.image}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  </div>
                  <div className="p-5 space-y-2">
                    <span className="text-xs font-medium text-primary">{post.category}</span>
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                      {post.title}
                    </h3>
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

      {/* Horizontal Scroll Sections (Hotstar-style) */}
      <HorizontalScroll title="Newsletter" posts={newsletterPosts} />
      <HorizontalScroll title="Modules" posts={modulePosts} />
      <HorizontalScroll title="Videos" posts={videoPosts} />

      {/* Subscribe CTA 2 (unless already subscribed) */}
      {!isSubscribed && <SubscribeSection />}

      <Footer />
    </div>
  );
};

export default Index;
