import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export function ProtectedRoute({ children, requireAdmin = true }: ProtectedRouteProps) {
  const { isLoggedIn, isAdmin, isLoading, isCheckingRole, user } = useAuth();
  const location = useLocation();

  // Show loading while auth is initializing or role is being fetched
  if (isLoading || isCheckingRole) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Checking permissions...</p>
        </div>
      </div>
    );
  }

  // Not logged in - redirect to login
  if (!isLoggedIn || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Logged in but not admin - redirect to home
  // (We removed the email fallback since we wait for role check to complete)
  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  // All checks passed
  return <>{children}</>;
}
