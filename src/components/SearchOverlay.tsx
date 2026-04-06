import React, { useState, useMemo, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { Search, X, Clock, Eye, Tag } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DUMMY_POSTS, DUMMY_MODULES, DUMMY_VIDEO_SERIES, DUMMY_EVENTS, DUMMY_JUNIOR_MODULES } from "@/lib/data";
import { useTranslation } from "@/hooks/useTranslation";

interface SearchResult {
  id: string;
  title: string;
  category: string;
  tags: { name: string; type: string }[];
  link: string;
  readTime?: string;
  views?: number;
}

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

const SearchOverlay = ({ isOpen, onClose }: SearchOverlayProps) => {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const { t } = useTranslation();

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setQuery("");
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  const allResults = useMemo<SearchResult[]>(() => {
    const results: SearchResult[] = [];

    // Blog posts
    DUMMY_POSTS.forEach((p) => {
      results.push({
        id: p.id, title: p.title, category: p.category,
        tags: p.tags, link: p.category === "Newsletter" ? `/newsletter/${p.id}` : p.category === "Modules" ? `/modules/${p.id}` : p.category === "Videos" ? `/videos/${p.id}` : `/post/${p.id}`,
        readTime: p.readTime, views: p.views,
      });
    });

    // Modules + chapters
    DUMMY_MODULES.forEach((m) => {
      results.push({ id: m.id, title: m.title, category: "Modules", tags: [m.tag], link: `/modules/${m.id}`, readTime: m.totalReadTime, views: m.views });
      m.chapters.forEach((c) => {
        results.push({ id: c.id, title: `${m.title} → ${c.title}`, category: "Module Chapter", tags: c.tags, link: `/modules/${m.id}/${c.id}`, readTime: c.readTime });
      });
    });

    // Video series + chapters
    DUMMY_VIDEO_SERIES.forEach((v) => {
      results.push({ id: v.id, title: v.title, category: "Videos", tags: [v.tag], link: `/videos/${v.id}`, readTime: v.totalDuration, views: v.views });
      v.chapters.forEach((c) => {
        results.push({ id: c.id, title: `${v.title} → ${c.title}`, category: "Video Chapter", tags: c.tags, link: `/videos/${v.id}/${c.id}`, readTime: c.duration });
      });
    });

    // Events
    DUMMY_EVENTS.forEach((e) => {
      results.push({ id: e.id, title: e.title, category: "Events", tags: e.tags, link: `/events/${e.id}`, readTime: e.time });
    });

    // Junior modules + chapters
    DUMMY_JUNIOR_MODULES.forEach((m) => {
      results.push({ id: m.id, title: m.title, category: "Junior", tags: [m.tag], link: `/junior/${m.id}`, readTime: m.totalReadTime || m.totalDuration });
      m.chapters.forEach((c) => {
        results.push({ id: c.id, title: `${m.title} → ${c.title}`, category: "Junior Chapter", tags: c.tags, link: `/junior/${m.id}/${c.id}`, readTime: c.readTime || c.duration });
      });
    });

    return results;
  }, []);

  const filtered = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return allResults.filter((r) =>
      r.title.toLowerCase().includes(q) ||
      r.category.toLowerCase().includes(q) ||
      r.tags.some((tag) => tag.name.toLowerCase().includes(q))
    ).slice(0, 12);
  }, [query, allResults]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm" onClick={onClose}>
      <div className="container max-w-2xl pt-20" onClick={(e) => e.stopPropagation()}>
        <div className="bg-card rounded-2xl border border-border shadow-2xl overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
            <Search className="h-5 w-5 text-muted-foreground shrink-0" />
            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("nav.search")}
              className="border-0 shadow-none focus-visible:ring-0 text-base"
            />
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>

          {query.trim() && (
            <div className="max-h-[60vh] overflow-y-auto p-2">
              {filtered.length === 0 ? (
                <p className="text-center text-muted-foreground py-8 text-sm">No results found for "{query}"</p>
              ) : (
                <div className="space-y-1">
                  {filtered.map((r) => (
                    <Link
                      key={`${r.category}-${r.id}`}
                      to={r.link}
                      onClick={onClose}
                      className="flex items-start gap-3 px-3 py-2.5 rounded-lg hover:bg-accent transition-colors group"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors line-clamp-1">
                          {r.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">{r.category}</Badge>
                          {r.tags.slice(0, 2).map((tag) => (
                            <span key={tag.name} className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                              <Tag className="h-2.5 w-2.5" />{tag.name}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground shrink-0 mt-1">
                        {r.readTime && <span className="flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" />{r.readTime}</span>}
                        {r.views && <span className="flex items-center gap-0.5"><Eye className="h-2.5 w-2.5" />{r.views.toLocaleString()}</span>}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {!query.trim() && (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">
              Search by title, tag, or category
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchOverlay;
