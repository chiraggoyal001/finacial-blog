import React, { useRef } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BlogPost } from "@/lib/types";

interface HorizontalScrollProps {
  title: string;
  posts: BlogPost[];
}

const HorizontalScroll = ({ title, posts }: HorizontalScrollProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = 320;
    scrollRef.current.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
  };

  if (posts.length === 0) return null;

  return (
    <section className="py-8">
      <div className="container">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-xl font-bold text-foreground">{title}</h3>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" onClick={() => scroll("left")} className="h-8 w-8">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => scroll("right")} className="h-8 w-8">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div ref={scrollRef} className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 -mx-2 px-2 snap-x">
          {posts.map((post) => (
            <Link
              key={post.id}
              to={`/post/${post.id}`}
              className="flex-shrink-0 w-72 snap-start group"
            >
              <div className="rounded-xl overflow-hidden border border-border bg-card hover:shadow-lg transition-shadow">
                <div className="aspect-video overflow-hidden">
                  <img
                    src={post.image}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                </div>
                <div className="p-4 space-y-2">
                  <span className="text-xs font-medium text-primary">{post.category}</span>
                  <h4 className="font-semibold text-sm text-card-foreground line-clamp-2 group-hover:text-primary transition-colors">
                    {post.title}
                  </h4>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
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
  );
};

export default HorizontalScroll;
