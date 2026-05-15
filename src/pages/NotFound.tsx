import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Search, Home, ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const { t } = useTranslation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-md text-center space-y-6">
          {/* Large 404 graphic */}
          <div className="relative">
            <h1 className="text-9xl font-display font-bold text-primary/10 select-none">404</h1>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="space-y-2">
                <p className="text-2xl font-display font-bold text-foreground">{t("notFound.title")}</p>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                  The page you're looking for doesn't exist or has been moved.
                </p>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link to="/">
              <Button className="rounded-xl gap-2">
                <Home className="h-4 w-4" />
                {t("notFound.home")}
              </Button>
            </Link>
            <Button variant="outline" className="rounded-xl gap-2" onClick={() => window.history.back()}>
              <ArrowLeft className="h-4 w-4" />
              Go Back
            </Button>
          </div>

          {/* Quick links */}
          <div className="pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground mb-3">Try these popular sections:</p>
            <div className="flex flex-wrap justify-center gap-2">
              <Link to="/modules" className="text-xs text-primary hover:underline">Modules</Link>
              <span className="text-xs text-muted-foreground">·</span>
              <Link to="/newsletter" className="text-xs text-primary hover:underline">Newsletter</Link>
              <span className="text-xs text-muted-foreground">·</span>
              <Link to="/videos" className="text-xs text-primary hover:underline">Videos</Link>
              <span className="text-xs text-muted-foreground">·</span>
              <Link to="/events" className="text-xs text-primary hover:underline">Events</Link>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default NotFound;