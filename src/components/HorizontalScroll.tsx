import React, { useRef } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, Clock, Eye, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BlogPost } from "@/lib/types";
import { useAuth } from "@/contexts/AuthContext";
import { useReadingProgress } from "@/contexts/ReadingProgressContext";

interface HorizontalScrollProps {
  title: string;
  posts: BlogPost[];
}

const HorizontalScroll = ({ title, posts }: HorizontalScrollProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { isLoggedIn } = useAuth();
  const { getProgress, isRead } = useReadingProgress();

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
    <section className="py-8">
      <div className="container">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-xl font-bold text-foreground">{title}</h3>
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
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-full w-10 rounded-none bg-background/60 backdrop-blur-sm opacity-0 group-hover/carousel:opacity-100 transition-opacity"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => scroll("right")}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-full w-10 rounded-none bg-background/60 backdrop-blur-sm opacity-0 group-hover/carousel:opacity-100 transition-opacity"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
          <div
            ref={scrollRef}
            className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 -mx-2 px-2 snap-x"
          >
          {posts.map((post) => {
            const readPercent = getProgress(post.id);
            return (
              <Link
                key={post.id}
                to={getPostLink(post)}
                className="flex-shrink-0 w-72 snap-start"
              >
                <div className="rounded-xl overflow-hidden border border-border bg-card hover:shadow-lg transition-shadow">
                  <div className="aspect-video overflow-hidden relative">
                    <img
                      src={post.image}
                      alt={post.title}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      loading="lazy"
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
