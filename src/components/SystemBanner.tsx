import React from 'react';
import { useSystemSettings } from '@/hooks/useAdmin';
import { Megaphone, X } from 'lucide-react';
import { useLocation } from 'react-router-dom';

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

  return (
    <div className={`${banner.backgroundColor} py-2 px-4 relative flex items-center justify-center gap-3 animate-in fade-in slide-in-from-top duration-500 z-[60]`}>
      <Megaphone className="h-4 w-4 hidden sm:block animate-bounce" />
      <p className="text-center text-xs sm:text-sm font-medium">
        {banner.text}
      </p>
    </div>
  );
};

export default SystemBanner;
