import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Search, Menu, X, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { NAV_ITEMS } from "@/lib/data";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Badge } from "@/components/ui/badge";

const Navbar = () => {
  const [searchOpen, setSearchOpen] = useState(false);
  const { isLoggedIn, user, logout } = useAuth();
  const { isDark, toggleTheme, language, toggleLanguage } = useTheme();
  const location = useLocation();

  const isActive = (href: string) => {
    if (href === "/") return location.pathname === "/";
    return location.pathname.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between gap-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <span className="font-display text-2xl font-bold text-primary">Blog</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.label}
              to={item.href}
              className={`px-3 py-2 text-sm font-medium transition-colors rounded-lg ${isActive(item.href) ? "text-primary bg-accent font-semibold" : "text-muted-foreground hover:text-foreground hover:bg-accent"}`}
            >
              {item.label}
              {item.badge && (
                <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5 py-0">
                  {item.badge}
                </Badge>
              )}
            </Link>
          ))}
        </nav>

        {/* Right Controls */}
        <div className="flex items-center gap-3">
          {/* Search */}
          {searchOpen ? (
            <div className="flex items-center gap-2">
              <Input placeholder="Search..." className="w-40 md:w-64 h-9" autoFocus />
              <Button variant="ghost" size="icon" onClick={() => setSearchOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button variant="ghost" size="icon" onClick={() => setSearchOpen(true)}>
              <Search className="h-4 w-4" />
            </Button>
          )}

          {/* Theme Toggle */}
          <div className="hidden md:flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{isDark ? "🌙" : "☀️"}</span>
            <Switch checked={isDark} onCheckedChange={toggleTheme} />
          </div>

          {/* Language Toggle */}
          <div className="hidden md:flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{language === "en" ? "EN" : "हि"}</span>
            <Switch checked={language === "hi"} onCheckedChange={toggleLanguage} />
          </div>

          {/* Auth */}
          {isLoggedIn ? (
            <div className="flex items-center gap-2">
              <span className="hidden md:inline text-sm text-muted-foreground">{user?.firstName || user?.email}</span>
              <Button variant="ghost" size="icon" onClick={logout}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Link to="/login">
              <Button variant="outline" size="sm" className="gap-1.5">
                <User className="h-3.5 w-3.5" />
                Login
              </Button>
            </Link>
          )}

          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72">
              <div className="flex flex-col gap-4 mt-8">
                <Link to="/" className="font-display text-2xl font-bold text-primary mb-4">Blog</Link>
                {NAV_ITEMS.map((item) => (
                  <Link
                    key={item.label}
                    to={item.href}
                    className={`flex items-center justify-between py-2 transition-colors ${isActive(item.href) ? "text-primary font-semibold" : "text-foreground hover:text-primary"}`}
                  >
                    {item.label}
                    {item.badge && <Badge variant="secondary" className="text-[10px]">{item.badge}</Badge>}
                  </Link>
                ))}
                <div className="border-t border-border pt-4 mt-2 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Dark Mode</span>
                    <Switch checked={isDark} onCheckedChange={toggleTheme} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">हिंदी</span>
                    <Switch checked={language === "hi"} onCheckedChange={toggleLanguage} />
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
