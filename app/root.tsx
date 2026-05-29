import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLocation,
} from "react-router";
import { useState, lazy, Suspense, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider, useTheme } from "@/contexts/ThemeContext";
import { ReadingProgressProvider } from "@/contexts/ReadingProgressContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";

import "../src/index.css"; // Moved from main.tsx

// Lazy load ChatbotWidget to reduce initial bundle size
const ChatbotWidget = lazy(() => import("@/components/ChatbotWidget"));

const ChatbotWrapper = () => {
  const location = useLocation();
  const authPaths = ["/login", "/signup", "/forgot-password", "/auth/callback"];
  const isAuthPage = authPaths.some((path) =>
    location.pathname.startsWith(path)
  );

  if (isAuthPage) return null;

  return (
    <ErrorBoundary>
      <Suspense fallback={null}>
        <ChatbotWidget />
      </Suspense>
    </ErrorBoundary>
  );
};

const HtmlLangSetter = () => {
  const { language } = useTheme();
  useEffect(() => {
    document.documentElement.lang = language === "hi" ? "hi" : "en";
  }, [language]);
  return null;
};

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="UTF-8" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <Meta />
        <Links />
        
        {/* Microsoft Clarity */}
        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `
              (function(c,l,a,r,i,t,y){
                  c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                  t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                  y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
              })(window, document, "clarity", "script", "wt4vr8iqvb");
            `,
          }}
        />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 2,
            retryDelay: (attemptIndex) =>
              Math.min(1000 * 2 ** attemptIndex, 10000),
            staleTime: 1000 * 60 * 2, // 2 minutes
            gcTime: 1000 * 60 * 10, // 10 minutes
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <ReadingProgressProvider>
            <TooltipProvider>
              <HtmlLangSetter />
              <Toaster />
              <Sonner />
              <ErrorBoundary>
                <Outlet />
              </ErrorBoundary>
              <ChatbotWrapper />
            </TooltipProvider>
          </ReadingProgressProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
