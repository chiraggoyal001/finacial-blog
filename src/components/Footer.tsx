import React from "react";
import { Link } from "react-router-dom";
import { Youtube, Instagram, Facebook, Linkedin, MessageCircle, Calculator } from "lucide-react";
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

const AppStoreIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-label="App Store">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
  </svg>
);

const GooglePlayIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-label="Google Play">
    <path d="M3 2l18 10-18 10V2zm3 4v12l9-6-9-6z"/>
  </svg>
);

const Footer = () => {
  const { t } = useTranslation();

  return (
    <footer className="bg-card border-t border-border">
      <div className="container py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="font-display text-2xl font-bold text-primary">KAMADA</Link>
            <p className="text-sm text-muted-foreground max-w-xs">{t("footer.desc")}</p>
            <div className="flex items-center gap-3 pt-2">
              <a href={SOCIAL_LINKS.youtube} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors" aria-label="YouTube"><Youtube className="h-5 w-5" /></a>
              <a href={SOCIAL_LINKS.instagram} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors" aria-label="Instagram"><Instagram className="h-5 w-5" /></a>
              <a href={SOCIAL_LINKS.twitter} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors" aria-label="X (Twitter)"><XIcon /></a>
              <a href={SOCIAL_LINKS.linkedin} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors" aria-label="LinkedIn"><Linkedin className="h-5 w-5" /></a>
              <a href={SOCIAL_LINKS.facebook} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors" aria-label="Facebook"><Facebook className="h-5 w-5" /></a>
              <a href={SOCIAL_LINKS.whatsapp} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors" aria-label="WhatsApp"><MessageCircle className="h-5 w-5" /></a>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-sm text-foreground">{t("footer.explore")}</h4>
            {NAV_ITEMS.filter(i => !i.badge).map((item) => (
              <Link key={item.label} to={item.href} className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                {t(NAV_LABEL_KEYS[item.label] || item.label)}
              </Link>
            ))}
            <Link to="/calculators" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
              <span className="flex items-center gap-1.5">
                <Calculator className="h-3.5 w-3.5" />
                Calculators
              </span>
            </Link>
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
                <a href="https://apps.apple.com/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg bg-foreground text-background text-xs font-medium px-3 py-2 hover:opacity-90 transition-opacity">
                  <AppStoreIcon />
                  App Store
                </a>
                <a href="https://play.google.com/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg bg-foreground text-background text-xs font-medium px-3 py-2 hover:opacity-90 transition-opacity">
                  <GooglePlayIcon />
                  Google Play
                </a>
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
          © {new Date().getFullYear()} KAMADA. {t("footer.rights")}
        </p>
      </div>
    </footer>
  );
};

export default Footer;