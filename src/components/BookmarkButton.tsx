import React, { useState } from 'react';
import { Bookmark, BookmarkCheck, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useBookmarks, useToggleBookmark } from '@/hooks/useAffiliates';
import { toast } from 'sonner';

interface BookmarkButtonProps {
  contentType: 'article' | 'module' | 'video';
  contentId: string;
  className?: string;
  showText?: boolean;
}

export const BookmarkButton = ({ contentType, contentId, className, showText = false }: BookmarkButtonProps) => {
  const { user, isLoggedIn } = useAuth();
  const { data: bookmarks, isLoading } = useBookmarks(user?.id || '');
  const toggleBookmark = useToggleBookmark();

  const isBookmarked = bookmarks?.some(b => b.content_id === contentId && b.content_type === contentType) || false;

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isLoggedIn) {
      toast.error('Please log in to bookmark content');
      return;
    }

    try {
      await toggleBookmark.mutateAsync({
        user_id: user!.id,
        content_type: contentType,
        content_id: contentId,
        isBookmarked
      });
      toast.success(isBookmarked ? 'Removed from bookmarks' : 'Added to bookmarks');
    } catch {
      toast.error('Failed to update bookmark');
    }
  };

  if (isLoading && isLoggedIn) {
    return <Button variant="ghost" size="icon" disabled className={className}><Loader2 className="h-4 w-4 animate-spin" /></Button>;
  }

  return (
    <Button 
      variant={isBookmarked ? "secondary" : "ghost"} 
      size={showText ? "default" : "icon"}
      className={`${isBookmarked ? "text-primary" : "text-muted-foreground hover:text-primary"} ${className}`}
      onClick={handleToggle}
      disabled={toggleBookmark.isPending}
    >
      {isBookmarked ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
      {showText && <span className="ml-2">{isBookmarked ? 'Bookmarked' : 'Bookmark'}</span>}
    </Button>
  );
};
