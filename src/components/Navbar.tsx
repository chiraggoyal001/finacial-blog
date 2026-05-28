import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Search, Menu, X, User, Shield, LayoutDashboard, LogOut, Settings as SettingsIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { NAV_ITEMS } from "@/lib/data";
import { useAuth } from "@/hooks/useAuth";
import { getAvatarUrl } from "@/lib/avatar";
import { useTheme } from "@/contexts/ThemeContext";
import { useTranslation } from "@/hooks/useTranslation";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import SearchOverlay from "@/components/SearchOverlay";
import SystemBanner from "@/components/SystemBanner";
import { useNavigate } from "react-router-dom";

const NAV_LABEL_KEYS: Record<string, string> = {
  Newsletter: "nav.newsletter",
  Modules: "nav.modules",
  Videos: "nav.videos",
  Junior: "nav.junior",
  Events: "nav.events",
  "Financial Services": "nav.financialServices",
};

const Navbar = () => {
  const [searchOpen, setSearchOpen] = useState(false);
  const { isLoggedIn, user, needsOnboarding, isAdmin, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { t } = useTranslation();
  const location = useLocation();

  const navigate = useNavigate();

  // Keyboard shortcut: Cmd+K or Ctrl+K to open search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const isActive = (href: string) => {
    if (href === "/") return location.pathname === "/";
    const pathname = location.pathname;
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <>
      <SystemBanner />
      <header 
        style={{ top: "var(--banner-height, 0px)" }}
        className="sticky z-50 w-full border-b border-border/50 bg-background/40 backdrop-blur-xl supports-[backdrop-filter]:bg-background/40"
      >
        <div className="container flex h-16 items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2">
            <img src="/logo.svg" alt="KAMADA Logo" className="h-12 w-auto dark:brightness-110" />
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.label}
                to={item.href}
                className={`px-3 py-2 text-sm font-medium transition-colors rounded-lg ${isActive(item.href) ? "text-primary bg-accent font-semibold" : "text-muted-foreground hover:text-foreground hover:bg-accent"}`}
              >
                {t(NAV_LABEL_KEYS[item.label] || item.label)}
                {item.badge && (
                  <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5 py-0">
                    {item.badge}
                  </Badge>
                )}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => setSearchOpen(true)} aria-label="Open search (Cmd+K)" className="gap-2">
              <Search className="h-4 w-4" />
              <kbd className="hidden sm:inline-flex text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded border border-border font-mono">
                ⌘K
              </kbd>
            </Button>

            <div className="hidden md:flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{isDark ? "🌙" : "☀️"}</span>
              <Switch checked={isDark} onCheckedChange={toggleTheme} />
            </div>



            {isLoggedIn && isAdmin && (
              <Link to="/admin">
                <Button variant="ghost" size="icon" aria-label="Admin Dashboard" className="text-primary hover:bg-primary/10">
                  <Shield className="h-5 w-5" />
                </Button>
              </Link>
            )}

            {isLoggedIn ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div className="relative">
                    <Avatar className={`h-9 w-9 cursor-pointer bg-primary transition-all ${needsOnboarding ? 'ring-2 ring-amber-500 ring-offset-2' : 'hover:ring-2 hover:ring-primary/50'}`}>
                      <AvatarImage 
                        src={user?.avatarUrl || (user?.id ? getAvatarUrl(user.id) : undefined)} 
                        alt={`${user?.firstName} ${user?.lastName}`}
                        className="object-cover"
                      />
                      <AvatarFallback className="text-sm font-medium text-primary-foreground bg-primary">
                        {(user?.firstName?.[0] || "").toUpperCase()}
                        {(user?.lastName?.[0] || "").toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {needsOnboarding && (
                      <span className="absolute -top-0.5 -right-0.5 h-3 w-3 bg-amber-500 rounded-full border-2 border-background" />
                    )}
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user?.firstName} {user?.lastName}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate("/learning")}>
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    <span>My Learning</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/profile")}>
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/onboarding")}>
                    <SettingsIcon className="mr-2 h-4 w-4" />
                    <span>Preferences</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign Out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login">
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <User className="h-3.5 w-3.5" />
                    {t("nav.login")}
                  </Button>
                </Link>
                <Link to="/signup" className="hidden sm:inline-flex">
                  <Button size="sm" className="gap-1.5">
                    {t("nav.signup")}
                  </Button>
                </Link>
              </div>
            )}

            <Sheet>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon" aria-label="Open navigation menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72">
                <div className="flex flex-col gap-4 mt-8">
                  <Link to="/" className="mb-4">
                    <img src="/logo.svg" alt="KAMADA Logo" className="h-14 w-auto dark:brightness-110" />
                  </Link>
                  {NAV_ITEMS.map((item) => (
                    <Link
                      key={item.label}
                      to={item.href}
                      className={`flex items-center justify-between py-2 transition-colors ${isActive(item.href) ? "text-primary font-semibold" : "text-foreground hover:text-primary"}`}
                    >
                      {t(NAV_LABEL_KEYS[item.label] || item.label)}
                      {item.badge && <Badge variant="secondary" className="text-[10px]">{item.badge}</Badge>}
                    </Link>
                  ))}
                  {isLoggedIn && isAdmin && (
                    <Link
                      to="/admin"
                      className={`flex items-center justify-between py-2 transition-colors ${isActive('/admin') ? "text-primary font-semibold" : "text-foreground hover:text-primary"}`}
                    >
                      <span className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Admin
                      </span>
                    </Link>
                  )}
                  <div className="border-t border-border pt-4 mt-2 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">{t("nav.darkMode")}</span>
                      <Switch checked={isDark} onCheckedChange={toggleTheme} />
                    </div>
                  </div>
                  {!isLoggedIn && (
                    <div className="flex flex-col gap-2 mt-4">
                      <Link to="/login">
                        <Button variant="outline" className="w-full justify-center gap-1.5">
                          <User className="h-3.5 w-3.5" />
                          {t("nav.login")}
                        </Button>
                      </Link>
                      <Link to="/signup">
                        <Button className="w-full justify-center">
                          {t("nav.signup")}
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>
      <SearchOverlay isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
};

export default Navbar;
