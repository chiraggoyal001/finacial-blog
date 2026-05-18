import React, { useState, useRef, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { Search, X, Clock, Eye, Tag, Loader2, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useSearchContent } from "@/hooks/useContent";
import { useTranslation } from "@/hooks/useTranslation";
import { useDebounce } from "@/hooks/useDebounce";

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

const PLACEHOLDER_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='400' viewBox='0 0 600 400'%3E%3Crect fill='%23f0f0f0' width='600' height='400'/%3E%3Ctext fill='%23999' font-family='sans-serif' font-size='24' x='50%25' y='50%25' text-anchor='middle' dominant-baseline='middle'%3EImage unavailable%3C/text%3E%3C/svg%3E";

const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
  e.currentTarget.src = PLACEHOLDER_IMAGE;
};

const SearchOverlay = ({ isOpen, onClose }: SearchOverlayProps) => {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<(HTMLAnchorElement | null)[]>([]);
  const overlayRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();

  // Debounce the raw query by 100ms - fast enough to prevent API spam,
  // slow enough to feel instant to the user (<100ms is imperceptible)
  const debouncedQuery = useDebounce(query, 100);

  // Only pass the debounced value to the API hook
  const { data: searchResults, isLoading, isFetching } = useSearchContent(debouncedQuery);

  const showLoading = isLoading || isFetching;

  // Determine if we should show results or a waiting message
  const showResults = !showLoading && debouncedQuery.trim().length > 0;
  const showEmptyState = !showLoading && debouncedQuery.trim().length > 0 && (!searchResults || searchResults.length === 0);
  const showPrompt = !debouncedQuery.trim();

  // Group results by category for a Postman-like grouped display
  const groupedResults = useMemo(() => {
    if (!searchResults || searchResults.length === 0) return null;
    const groups: Record<string, any[]> = {};
    for (const r of searchResults) {
      const cat = r.category || "Other";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(r);
    }
    return groups;
  }, [searchResults]);

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

  // Focus trap: cycle Tab within the dialog
  useEffect(() => {
    if (!isOpen) return;
    const overlay = overlayRef.current;
    if (!overlay) return;

    const focusableElements = overlay.querySelectorAll<HTMLElement>(
      'input, button, [href], [tabindex]:not([tabindex="-1"])'
    );
    const first = focusableElements[0];
    const last = focusableElements[focusableElements.length - 1];

    const trapFocus = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    };

    document.addEventListener("keydown", trapFocus);
    return () => document.removeEventListener("keydown", trapFocus);
  }, [isOpen]);

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
    <div ref={overlayRef} className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm" onClick={onClose}>
      <div className="container max-w-2xl pt-20" onClick={(e) => e.stopPropagation()}>
        <div className="bg-card rounded-2xl border border-border shadow-2xl overflow-hidden">
          {/* Search input bar */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
            <Search className="h-5 w-5 text-muted-foreground shrink-0" />
            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search articles, modules, videos... (⌘K)"
              className="border-0 shadow-none focus-visible:ring-0 text-base"
            />
            {showLoading ? (
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            ) : (
              <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* Typing in progress — show subtle hint while debouncing */}
          {query.trim() && query !== debouncedQuery && (
            <div className="px-4 py-6 text-center text-xs text-muted-foreground italic">
              Searching...
            </div>
          )}

          {/* Results displayed grouped by category (Postman-like grouping) */}
          {showResults && groupedResults && (
            <div className="max-h-[60vh] overflow-y-auto p-2">
              {Object.entries(groupedResults).map(([category, items]) => (
                <div key={category} className="mb-2">
                  <div className="flex items-center gap-2 px-3 py-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      {category}
                    </span>
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-[9px] text-muted-foreground font-mono">{items.length}</span>
                  </div>
                  <div className="space-y-0.5">
                    {items.map((r: any, index: number) => {
                      // Find the actual global index for keyboard navigation
                      const globalIndex = searchResults.indexOf(r);
                      return (
                        <Link
                          ref={(el) => { resultsRef.current[globalIndex] = el; }}
                          key={`${r.category}-${r.id}`}
                          to={r.link}
                          onClick={onClose}
                          className={`flex items-center gap-4 px-3 py-2.5 rounded-lg hover:bg-accent transition-colors group ${
                            globalIndex === selectedIndex ? "bg-accent ring-2 ring-primary ring-inset" : ""
                          }`}
                        >
                          {r.image && (
                            <div className="shrink-0 w-16 h-10 rounded-md overflow-hidden border border-border">
                              <img src={r.image} alt={r.title} className="w-full h-full object-cover" onError={handleImageError} />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                              {r.title}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                              <Badge variant="secondary" className="text-[9px] h-4 px-1.5 font-bold uppercase tracking-wider">{r.category}</Badge>
                              {r.tags?.slice(0, 2).map((tag: any, ti: number) => (
                                <span key={ti} className="flex items-center gap-0.5 text-[10px] text-muted-foreground font-medium">
                                  <Tag className="h-2.5 w-2.5" />{tag.name || tag}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1 text-[9px] text-muted-foreground font-mono shrink-0">
                            {r.read_time && <span className="flex items-center gap-0.5 whitespace-nowrap"><Clock className="h-2.5 w-2.5" />{r.read_time}</span>}
                            {r.views != null && <span className="flex items-center gap-0.5 whitespace-nowrap"><Eye className="h-2.5 w-2.5" />{r.views.toLocaleString()}</span>}
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty state for debounced query with no results */}
          {showEmptyState && (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-muted-foreground">No results found for "<span className="font-medium text-foreground">{debouncedQuery}</span>"</p>
              <p className="text-xs text-muted-foreground mt-1">Try a different search term or browse categories</p>
            </div>
          )}

          {/* Initial prompt when input is empty */}
          {showPrompt && (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">
              <div className="space-y-2">
                <p>Search by title, tag, or category</p>
                <div className="flex items-center justify-center gap-4 text-xs">
                  <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 rounded border border-border bg-muted text-[10px] font-mono">↓</kbd><kbd className="px-1.5 py-0.5 rounded border border-border bg-muted text-[10px] font-mono">↑</kbd> navigate</span>
                  <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 rounded border border-border bg-muted text-[10px] font-mono">↵</kbd> open</span>
                  <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 rounded border border-border bg-muted text-[10px] font-mono">Esc</kbd> close</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchOverlay;