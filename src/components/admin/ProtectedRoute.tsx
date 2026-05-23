import React, { useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children?: React.ReactNode;
  requireAdmin?: boolean;
}

export function ProtectedRoute({ children, requireAdmin = true }: ProtectedRouteProps) {
  const { isLoggedIn, isAdmin, isLoading, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading) {
      if (!isLoggedIn || !user) {
        navigate('/login', { state: { from: location }, replace: true });
      } else if (requireAdmin && !isAdmin) {
        navigate('/', { replace: true });
      }
    }
  }, [isLoading, isLoggedIn, user, isAdmin, requireAdmin, navigate, location]);

  // Show loading while auth is initializing or before navigation happens
  if (isLoading || !isLoggedIn || !user || (requireAdmin && !isAdmin)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Checking permissions...</p>
        </div>
      </div>
    );
  }

  // All checks passed
  return children ? <>{children}</> : <Outlet />;
}

export default ProtectedRoute;
