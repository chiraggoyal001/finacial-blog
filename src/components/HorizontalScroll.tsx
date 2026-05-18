import React, { useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, Clock, Eye, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BlogPost } from "@/lib/types";
import { useAuth } from "@/hooks/useAuth";
import { useReadingProgress } from "@/contexts/ReadingProgressContext";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export type HorizontalScrollSection = "Newsletter" | "Modules" | "Videos" | "Junior" | "Events";

interface HorizontalScrollProps {
  title: string;
  posts: BlogPost[];
  description?: string;
  sectionType?: HorizontalScrollSection;
}

const PLACEHOLDER_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='400' viewBox='0 0 600 400'%3E%3Crect fill='%23f0f0f0' width='600' height='400'/%3E%3Ctext fill='%23999' font-family='sans-serif' font-size='24' x='50%25' y='50%25' text-anchor='middle' dominant-baseline='middle'%3EImage unavailable%3C/text%3E%3C/svg%3E";

const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
  e.currentTarget.src = PLACEHOLDER_IMAGE;
};

const HorizontalScroll = ({ title, posts, description, sectionType }: HorizontalScrollProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  const { isLoggedIn } = useAuth();
  const { getProgress, isRead } = useReadingProgress();

  useEffect(() => {
    if (!sectionRef.current) return;
    
    const cards = sectionRef.current.querySelectorAll('.scroll-card');
    if (cards.length === 0) return;
    
    // Only animate if the cards haven't been animated yet
    if (cards[0].getAttribute('data-animated') === 'true') return;

    const isMobile = window.innerWidth < 768;

    if (isMobile) {
      // Simple fade-in for mobile to preserve performance
      gsap.from(cards, {
        opacity: 0,
        stagger: 0.05,
        duration: 0.5,
        ease: "power1.out",
        onComplete: () => {
          cards.forEach(c => c.setAttribute('data-animated', 'true'));
        }
      });
    } else {
      // Full scroll-triggered stagger for desktop
      gsap.from(cards, {
        opacity: 0,
        y: 30,
        stagger: 0.1,
        duration: 0.8,
        ease: "power2.out",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 85%",
          toggleActions: "play none none none",
          once: true,
        },
        onComplete: () => {
          cards.forEach(c => c.setAttribute('data-animated', 'true'));
        }
      });
    }
  }, [posts]);

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = 320;
    scrollRef.current.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
  };

  if (posts.length === 0) return null;

  const getPostLink = (post: BlogPost) => {
    if (post.category === "Newsletter") return `/newsletter/${post.id}`;
    if (post.category === "Modules") return `/modules/${post.id}`;
    if (post.category === "Videos") return `/videos/${post.id}`;
    if (post.category === "Junior") return `/junior/${post.id}`;
    if (post.category === "Events") return `/events/${post.id}`;
    return `/post/${post.id}`;
  };

  const getSectionLink = () => {
    // Use sectionType prop if provided (avoiding broken i18n key lookup)
    if (sectionType) {
      const map: Record<HorizontalScrollSection, string> = {
        Newsletter: "/newsletter",
        Modules: "/modules",
        Videos: "/videos",
        Junior: "/junior",
        Events: "/events",
      };
      return map[sectionType] || "/";
    }
    // Fallback: try to match against category labels
    const map: Record<string, string> = {
      Newsletter: "/newsletter",
      Modules: "/modules",
      Videos: "/videos",
      Junior: "/junior",
      Events: "/events",
    };
    return map[title] || "/";
  };

  return (
    <section className="py-8" ref={sectionRef}>
      <div className="container">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-display text-xl font-bold text-foreground">{title}</h3>
            {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
          </div>
          <Link to={getSectionLink()}>
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-primary gap-1">
              View All <ChevronRight className="h-3 w-3" />
            </Button>
          </Link>
        </div>
        <div className="relative group/carousel">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => scroll("left")}
            className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-background/80 backdrop-blur-sm border border-border opacity-0 group-hover/carousel:opacity-100 transition-opacity shadow-lg hover:bg-background hover:scale-110"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => scroll("right")}
            className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-background/80 backdrop-blur-sm border border-border opacity-0 group-hover/carousel:opacity-100 transition-opacity shadow-lg hover:bg-background hover:scale-110"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
          <div
            ref={scrollRef}
            className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 px-4 -mx-4 snap-x"
          >
          {posts.map((post) => {
            const readPercent = getProgress(post.id);
            return (
              <Link
                key={post.id}
                to={getPostLink(post)}
                className="flex-shrink-0 w-72 snap-start scroll-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-xl"
              >
                <div className="relative rounded-xl overflow-hidden border border-border bg-card hover:shadow-2xl hover:shadow-primary/20 hover:scale-105 hover:z-10 transition-all duration-300 transform">
                  <div className="aspect-video overflow-hidden relative">
                    <img
                      src={post.image}
                      alt={post.title}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                      onError={handleImageError}
                    />
                    {isLoggedIn && isRead(post.id) && (
                      <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      </div>
                    )}
                  </div>
                  <div className="p-4 space-y-2">
                    <div className="flex flex-wrap gap-1">
                      {post.tags.map((tag) => (
                        <Badge
                          key={tag.name}
                          variant={tag.type === "major" ? "default" : "outline"}
                          className="text-[10px] px-1.5 py-0"
                        >
                          {tag.name}
                        </Badge>
                      ))}
                    </div>
                    <h4 className="font-semibold text-sm text-card-foreground line-clamp-2 hover:text-primary transition-colors">
                      {post.title}
                    </h4>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="font-mono">{new Date(post.date).toLocaleDateString()}</span>
                      <span>·</span>
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{post.readTime}</span>
                      {post.views && (
                        <>
                          <span>·</span>
                          <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{post.views.toLocaleString()}</span>
                        </>
                      )}
                    </div>
                    {isLoggedIn && readPercent > 0 && (
                      <div className="space-y-0.5 pt-1">
                        <span className="text-[10px] text-muted-foreground">
                          {isRead(post.id) ? "Completed" : `${readPercent}% read`}
                        </span>
                        <Progress value={readPercent} className="h-1" />
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HorizontalScroll;
