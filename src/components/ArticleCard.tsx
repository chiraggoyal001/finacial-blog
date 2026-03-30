import React from "react";
import { Link } from "react-router-dom";
import { Clock, Eye, Heart, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BlogPost } from "@/lib/types";
import { useAuth } from "@/contexts/AuthContext";
import { useReadingProgress } from "@/contexts/ReadingProgressContext";

interface ArticleCardProps {
  post: BlogPost;
  variant?: "default" | "compact" | "hero";
}

const ArticleCard = ({ post, variant = "default" }: ArticleCardProps) => {
  const { isLoggedIn } = useAuth();
  const { getProgress, isRead } = useReadingProgress();
  const readPercent = getProgress(post.id);

  if (variant === "hero") {
    return (
      <Link to={`/newsletter/${post.id}`} className="group block">
        <div className="relative rounded-2xl overflow-hidden border border-border bg-card">
          <div className="grid md:grid-cols-2 gap-0">
            <div className="aspect-video md:aspect-auto overflow-hidden">
              <img
                src={post.image}
                alt={post.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
            <div className="p-6 md:p-8 flex flex-col justify-center space-y-4">
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <Badge
                    key={tag.name}
                    variant={tag.type === "major" ? "default" : "secondary"}
                    className="text-[10px]"
                  >
                    {tag.name}
                  </Badge>
                ))}
              </div>
              <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground group-hover:text-primary transition-colors">
                {post.title}
              </h2>
              <p className="text-muted-foreground leading-relaxed">{post.excerpt}</p>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="font-mono">{new Date(post.date).toLocaleDateString()}</span>
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{post.readTime}</span>
                {post.views && <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{post.views.toLocaleString()}</span>}
                {post.likes && <span className="flex items-center gap-1"><Heart className="h-3 w-3" />{post.likes}</span>}
              </div>
              {isLoggedIn && readPercent > 0 && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      {isRead(post.id) ? <><CheckCircle2 className="h-3 w-3 text-primary" /> Read</> : `Read ${readPercent}%`}
                    </span>
                  </div>
                  <Progress value={readPercent} className="h-1.5" />
                </div>
              )}
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link to={`/newsletter/${post.id}`} className="group block">
      <div className="rounded-xl overflow-hidden border border-border bg-card hover:shadow-lg transition-all">
        <div className="aspect-video overflow-hidden relative">
          <img
            src={post.image}
            alt={post.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
          {isLoggedIn && isRead(post.id) && (
            <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
              <CheckCircle2 className="h-3.5 w-3.5" />
            </div>
          )}
        </div>
        <div className="p-4 space-y-2">
          <div className="flex flex-wrap gap-1.5">
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
          <h4 className="font-semibold text-sm text-card-foreground line-clamp-2 group-hover:text-primary transition-colors">
            {post.title}
          </h4>
          {variant === "default" && (
            <p className="text-xs text-muted-foreground line-clamp-2">{post.excerpt}</p>
          )}
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
            <div className="space-y-1 pt-1">
              <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                <span>{isRead(post.id) ? "Completed" : `${readPercent}% read`}</span>
              </div>
              <Progress value={readPercent} className="h-1" />
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};

export default ArticleCard;
