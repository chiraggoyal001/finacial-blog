import React from "react";
import { Link } from "react-router-dom";
import { Youtube, Instagram, Facebook, Linkedin, MessageCircle } from "lucide-react";
import { NAV_ITEMS, SOCIAL_LINKS, OTHER_PRODUCTS } from "@/lib/data";
import { Separator } from "@/components/ui/separator";
import { useTranslation } from "@/hooks/useTranslation";

const NAV_LABEL_KEYS: Record<string, string> = {
  Newsletter: "nav.newsletter",
  Modules: "nav.modules",
  Videos: "nav.videos",
  Junior: "nav.junior",
  Events: "nav.events",
  "Financial Services": "nav.financialServices",
};

const XIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-label="X">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const Footer = () => {
  const { t } = useTranslation();

  return (
    <footer className="bg-card border-t border-border">
      <div className="container py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="font-display text-2xl font-bold text-primary">Blog</Link>
            <p className="text-sm text-muted-foreground max-w-xs">{t("footer.desc")}</p>
            <div className="flex items-center gap-3 pt-2">
              <a href={SOCIAL_LINKS.youtube} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors"><Youtube className="h-5 w-5" /></a>
              <a href={SOCIAL_LINKS.instagram} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors"><Instagram className="h-5 w-5" /></a>
              <a href={SOCIAL_LINKS.twitter} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors"><XIcon /></a>
              <a href={SOCIAL_LINKS.linkedin} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors"><Linkedin className="h-5 w-5" /></a>
              <a href={SOCIAL_LINKS.facebook} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors"><Facebook className="h-5 w-5" /></a>
              <a href={SOCIAL_LINKS.whatsapp} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors"><MessageCircle className="h-5 w-5" /></a>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-sm text-foreground">{t("footer.explore")}</h4>
            {NAV_ITEMS.filter(i => !i.badge).map((item) => (
              <Link key={item.label} to={item.href} className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                {t(NAV_LABEL_KEYS[item.label] || item.label)}
              </Link>
            ))}
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-sm text-foreground">{t("footer.ourInfo")}</h4>
            <Link to="/privacy" className="block text-sm text-muted-foreground hover:text-primary transition-colors">{t("footer.privacy")}</Link>
            <Link to="/grievance" className="block text-sm text-muted-foreground hover:text-primary transition-colors">{t("footer.grievance")}</Link>
            <Link to="/terms" className="block text-sm text-muted-foreground hover:text-primary transition-colors">{t("footer.terms")}</Link>
            <Link to="/disclaimer" className="block text-sm text-muted-foreground hover:text-primary transition-colors">{t("footer.disclaimer")}</Link>
            <Link to="/license" className="block text-sm text-muted-foreground hover:text-primary transition-colors">{t("footer.license")}</Link>
          </div>

          <div className="space-y-6">
            <div className="space-y-3">
              <h4 className="font-semibold text-sm text-foreground">{t("footer.contactUs")}</h4>
              <a href="mailto:goyalchirag721@gmail.com" className="block text-sm text-muted-foreground hover:text-primary transition-colors">goyalchirag721@gmail.com</a>
              <a href="https://maps.google.com/?q=123+Finance+Street,+Mumbai" target="_blank" rel="noopener noreferrer" className="block text-sm text-muted-foreground hover:text-primary transition-colors">123 Finance Street, Mumbai</a>
              <a href="tel:+919871963032" className="block text-sm text-muted-foreground hover:text-primary transition-colors">9871963032</a>
            </div>
            <div className="space-y-3">
              <h4 className="font-semibold text-sm text-foreground">{t("footer.getApp")}</h4>
              <div className="flex gap-2">
                <a href="#" className="inline-block rounded-lg bg-foreground text-background text-xs font-medium px-3 py-2 hover:opacity-90 transition-opacity">App Store</a>
                <a href="#" className="inline-block rounded-lg bg-foreground text-background text-xs font-medium px-3 py-2 hover:opacity-90 transition-opacity">Google Play</a>
              </div>
            </div>
          </div>
        </div>

        <Separator className="my-8" />

        <div className="space-y-3 mb-8">
          <h4 className="font-semibold text-sm text-foreground">{t("footer.otherProducts")}</h4>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            {OTHER_PRODUCTS.map((product) => (
              <a key={product.name} href={product.href} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                {product.name}
              </a>
            ))}
          </div>
        </div>

        <Separator className="mb-6" />
        <p className="text-xs text-muted-foreground text-center">
          © {new Date().getFullYear()} Blog. {t("footer.rights")}
        </p>
      </div>
    </footer>
  );
};

export default Footer;
