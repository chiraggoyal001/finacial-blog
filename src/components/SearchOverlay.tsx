import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { Search, X, Clock, Eye, Tag, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useSearchContent } from "@/hooks/useContent";
import { useTranslation } from "@/hooks/useTranslation";

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

const SearchOverlay = ({ isOpen, onClose }: SearchOverlayProps) => {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<(HTMLAnchorElement | null)[]>([]);
  const { t } = useTranslation();

  const { data: searchResults, isLoading } = useSearchContent(query);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setQuery("");
      setSelectedIndex(-1);
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedIndex >= 0 && resultsRef.current[selectedIndex]) {
      resultsRef.current[selectedIndex]?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [selectedIndex]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (!searchResults?.length) return;
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex(prev => (prev < searchResults.length - 1 ? prev + 1 : prev));
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
          break;
        case "Enter":
          e.preventDefault();
          if (selectedIndex >= 0 && resultsRef.current[selectedIndex]) {
            resultsRef.current[selectedIndex]?.click();
          } else if (searchResults && searchResults.length > 0) {
            resultsRef.current[0]?.click();
          }
          break;
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose, searchResults, selectedIndex]);

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
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            ) : (
              <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="h-5 w-5" />
              </button>
            )}
          </div>

          {query.length > 0 && query.length <= 2 && (
            <div className="px-4 py-6 text-center text-xs text-muted-foreground italic">
              Type at least 3 characters to search...
            </div>
          )}

          {query.length > 2 && (
            <div className="max-h-[60vh] overflow-y-auto p-2">
              {!isLoading && searchResults?.length === 0 ? (
                <p className="text-center text-muted-foreground py-8 text-sm">No results found for "{query}"</p>
              ) : (
                <div className="space-y-1">
                  {searchResults?.map((r: any, index: number) => (
                    <Link
                      ref={(el) => { resultsRef.current[index] = el; }}
                      key={`${r.category}-${r.id}`}
                      to={r.link}
                      onClick={onClose}
                      className={`flex items-center gap-4 px-3 py-2.5 rounded-lg hover:bg-accent transition-colors group ${
                        index === selectedIndex ? "bg-accent ring-2 ring-primary ring-inset" : ""
                      }`}
                    >
                      {r.image && (
                        <div className="shrink-0 w-16 h-10 rounded-md overflow-hidden border border-border">
                          <img src={r.image} alt={r.title} className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                          {r.title}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant="secondary" className="text-[9px] h-4 px-1.5 font-bold uppercase tracking-wider">{r.category}</Badge>
                          {r.tags?.slice(0, 1).map((tag: any) => (
                            <span key={tag.name} className="flex items-center gap-0.5 text-[10px] text-muted-foreground font-medium">
                              <Tag className="h-2.5 w-2.5" />{tag.name}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 text-[9px] text-muted-foreground font-mono shrink-0">
                        {r.read_time && <span className="flex items-center gap-0.5 whitespace-nowrap"><Clock className="h-2.5 w-2.5" />{r.read_time}</span>}
                        {r.views && <span className="flex items-center gap-0.5 whitespace-nowrap"><Eye className="h-2.5 w-2.5" />{r.views.toLocaleString()}</span>}
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
