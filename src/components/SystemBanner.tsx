import React from 'react';
import { useSystemSettings } from '@/hooks/useAdmin';
import { Megaphone } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { Banner, BannerVariant } from '@/components/ui/banner';

const SystemBanner = () => {
  const { data: settings } = useSystemSettings();
  const location = useLocation();
  const banner = settings?.system_banner;

  if (!banner || !banner.isActive || !banner.text) {
    return null;
  }

  // Logic to determine visibility based on pages
  const visiblePages = banner.visiblePages || ['all'];
  const isAllPages = visiblePages.includes('all');
  
  const isCurrentPageVisible = isAllPages || visiblePages.some(pagePath => {
    if (pagePath === '/') return location.pathname === '/';
    return location.pathname.startsWith(pagePath);
  });

  if (!isCurrentPageVisible) {
    return null;
  }

  // Create a unique banner ID based on the content so that changing the message 
  // resets the dismissed state (allowing users to see new announcements).
  const bannerId = `sys-banner-${banner.text.replace(/[^a-zA-Z0-9]/g, '').slice(0, 20)}`;

  // Map backend classes to premium BannerVariant styles
  let variant: BannerVariant = "normal";
  let extraClassName = "";

  if (banner.backgroundColor === 'rainbow' || banner.backgroundColor?.includes('rainbow')) {
    variant = "rainbow";
  } else if (banner.backgroundColor?.includes('bg-primary')) {
    variant = "teal";
  } else if (banner.backgroundColor?.includes('bg-secondary')) {
    variant = "coral";
  } else if (banner.backgroundColor?.includes('bg-accent')) {
    variant = "normal";
  } else if (banner.backgroundColor?.includes('bg-destructive')) {
    variant = "normal";
    extraClassName = "bg-destructive text-destructive-foreground";
  } else {
    // Custom/fallback classes
    extraClassName = banner.backgroundColor || "";
  }

  return (
    <Banner
      id={bannerId}
      variant={variant}
      className={cn(
        "z-[60] border-b border-border/20 shadow-sm",
        extraClassName
      )}
      changeLayout={true}
    >
      <Megaphone className="h-4 w-4 hidden sm:block animate-bounce shrink-0" />
      <span className="text-center text-xs sm:text-sm font-medium">
        {banner.text}
      </span>
    </Banner>
  );
};

// Helper for cn if not imported, wait we can just import cn from '@/lib/utils'
import { cn } from '@/lib/utils';

export default SystemBanner;
