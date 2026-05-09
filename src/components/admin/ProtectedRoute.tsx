import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export function ProtectedRoute({ children, requireAdmin = true }: ProtectedRouteProps) {
  const { isLoggedIn, isAdmin, isLoading, user } = useAuth();
  const location = useLocation();

  // Show loading while auth is initializing
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Not logged in - redirect to login
  if (!isLoggedIn || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Logged in but not admin - redirect to home
  // Also check by email as a fallback while role is being fetched
  const isAdminEmail = ['goyalchirag721@gmail.com', 'anuraggoyal231@gmail.com'].includes(user.email);
  if (requireAdmin && !isAdmin && !isAdminEmail) {
    return <Navigate to="/" replace />;
  }

  // All checks passed
  return <>{children}</>;
}
