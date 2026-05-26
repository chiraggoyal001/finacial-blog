import React, { useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";

interface ProtectedRouteProps {
  children?: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, isLoading, isSigningOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [isBot, setIsBot] = React.useState(false);
  useEffect(() => {
    const AI_BOT_REGEX = /gptbot|chatgpt|claudebot|claude-web|google-extended|applebot-extended|perplexitybot|cohere-cohere-ai|facebookbot|bytesspider/i;
    if (typeof navigator !== "undefined" && AI_BOT_REGEX.test(navigator.userAgent)) {
      setIsBot(true);
    }
  }, []);

  useEffect(() => {
    if (!isBot && !isLoading && !isSigningOut && !user) {
      navigate('/login', { state: { from: location }, replace: true });
    }
  }, [isLoading, isSigningOut, user, navigate, location, isBot]);

  if (isBot) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-4">
        <div className="text-center space-y-2">
          <h1 className="text-xl font-bold">403 Forbidden</h1>
          <p className="text-sm text-muted-foreground">Access denied for automated agents.</p>
        </div>
      </div>
    );
  }

  if (isLoading || isSigningOut || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="space-y-4 w-full max-w-md px-4">
          <Skeleton className="h-8 w-3/4 mx-auto" />
          <Skeleton className="h-4 w-1/2 mx-auto" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;
