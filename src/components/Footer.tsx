import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Youtube, Instagram, Facebook, Linkedin, MessageCircle, Calculator, Loader2 } from "lucide-react";
import { NAV_ITEMS, SOCIAL_LINKS, OTHER_PRODUCTS } from "@/lib/data";
import { useTranslation } from "@/hooks/useTranslation";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { triggerEmail } from "@/lib/sendEmail";
import { toast } from "sonner";

const NAV_LABEL_KEYS: Record<string, string> = {
  Newsletter: "nav.newsletter",
  Modules: "nav.modules",
  Videos: "nav.videos",
  Junior: "nav.junior",
  Events: "nav.events",
  "Financial Services": "nav.financialServices",
};

const XIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-label="X">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const AppStoreIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-label="App Store">
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.22.67-2.94 1.51-.62.73-1.16 1.87-1.01 2.98.67.04 1.83-.58 2.96-1.43z"/>
  </svg>
);

const GooglePlayIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-label="Google Play">
    <path d="M3 20.29V3.71c0-.49.27-.79.7-.79.16 0 .31.04.45.12l14.39 8.29c.47.27.76.67.76 1.17s-.29.9-.76 1.17L4.15 21.96c-.14.08-.29.12-.45.12-.43 0-.7-.3-.7-.79z"/>
  </svg>
);

const Footer = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isLoggedIn, user, updateProfile } = useAuth();
  const [footerEmail, setFooterEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isAlreadySubscribed = isLoggedIn && user?.isSubscribed;

  const handleFooterSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailToSubscribe = isLoggedIn && user?.email ? user.email : footerEmail;
    if (!emailToSubscribe) return;

    setIsSubmitting(true);
    try {
      if (isLoggedIn && user) {
        // Save subscription to user's profile in database
        const { error } = await supabase
          .from("profiles")
          .update({
            is_subscribed: true,
            mail_preference: "non-intrusive",
          })
          .eq("id", user.id);

        if (error) {
          console.error("Error saving subscription:", error);
          toast.error("Failed to save subscription. Please try again.");
          setIsSubmitting(false);
          return;
        }

        // Also update local user state
        if (updateProfile) {
          await updateProfile({
            isSubscribed: true,
            mailPreference: "non-intrusive",
          });
        }

        toast.success(t("subscribe.success"), {
          description: `You're now subscribed to updates at ${emailToSubscribe}`,
        });

        // Fire subscription email (fire-and-forget)
        triggerEmail({
          type: 'subscription',
          email: user.email || emailToSubscribe,
          first_name: user.firstName || '',
          last_name: user.lastName || '',
        });
      } else {
        // Anonymous user - save email and redirect to signup
        localStorage.setItem("pendingSubscriptionEmail", emailToSubscribe);
        localStorage.setItem("pendingSubscriptionFrequency", "weekly");
        toast.success("Thanks for your interest!", {
          description: "Please sign up or log in to complete your subscription.",
        });
        navigate("/signup");
      }

      setFooterEmail("");
    } catch (error) {
      console.error("Subscription error:", error);
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const svgRef = useRef<SVGSVGElement>(null);
  const textRef = useRef<SVGTextElement>(null);

  useEffect(() => {
    const fitWatermark = () => {
      if (!svgRef.current || !textRef.current) return;
      try {
        const bbox = textRef.current.getBBox();
        svgRef.current.setAttribute('viewBox', `${bbox.x} ${bbox.y} ${bbox.width} ${bbox.height}`);
      } catch (e) {
        // Safe fallback if bbox sizing is not ready
      }
    };

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(fitWatermark);
    } else {
      window.addEventListener('load', fitWatermark);
    }
    window.addEventListener('resize', fitWatermark);
    fitWatermark();

    // Secondary fallback sizing timer
    const timer = setTimeout(fitWatermark, 1000);

    return () => {
      window.removeEventListener('load', fitWatermark);
      window.removeEventListener('resize', fitWatermark);
      clearTimeout(timer);
    };
  }, []);

  return (
    <footer className="w-full bg-white dark:bg-background pt-6 pb-12 px-6 overflow-hidden relative select-none">
      
      {/* Styles block for non-Tailwind dynamic styles (animations & tip popover tail) */}
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&display=swap');
        
        .font-dm-sans {
          font-family: 'DM Sans', sans-serif;
        }
        
        @keyframes cubeRoll {
          0% { transform: rotate(-10deg) scale(1); }
          30% { transform: rotate(180deg) scale(1.15); }
          100% { transform: rotate(350deg) scale(1); }
        }
        .animate-cube-roll {
          animation: cubeRoll 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }

        .tip-bubble-tail::after {
          content: '';
          position: absolute;
          bottom: -8px;
          right: 58px;
          width: 14px;
          height: 14px;
          background: inherit;
          transform: rotate(45deg);
          border-right: 1px solid rgba(0, 107, 94, 0.15);
          border-bottom: 1px solid rgba(0, 107, 94, 0.15);
        }

        .dark .tip-bubble-tail::after {
          border-right: 1px solid rgba(255, 255, 255, 0.1) !important;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
        }
      `}} />

      <div className="max-w-[1150px] mx-auto grid grid-cols-1 lg:grid-cols-[350px_1fr] gap-4 items-stretch relative z-10 font-dm-sans text-[#2d3148] dark:text-[#f2f5f4]">
        
        {/* Left Card: Autoplay Video + Branding + Social Links */}
        <div className="relative min-h-[340px] rounded-[28px] p-8 overflow-hidden shadow-[0_12px_40px_rgba(0,107,94,0.22)] bg-[#006b5e] flex flex-col justify-between">
          
          {/* Autoplay video background */}
          <video className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none" autoPlay muted loop playsInline preload="auto">
            <source src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260503_104800_bc43ae09-f494-43e3-97d7-2f8c1692cfd7.mp4" type="video/mp4" />
          </video>
          
          {/* Brand Logo */}
          <Link to="/" className="flex flex-row items-center gap-2.5 relative z-10 no-underline group">
            <div className="w-8 h-8 rounded-lg bg-white/15 border-[1.5px] border-white/85 flex items-center justify-center font-dm-sans text-base font-bold text-white tracking-tight transition-transform duration-300 group-hover:scale-110 group-hover:rotate-5">
              K
            </div>
            <span className="font-dm-sans text-2xl font-bold text-white tracking-tight">KAMADA</span>
          </Link>
 
          {/* Tagline - Added shadow to make it contrast beautifully with bright videos */}
          <div className="mt-auto mb-7 relative z-10 drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]">
            <p className="text-[19px] font-normal text-white leading-[1.45]">
              Your trusted source for financial insights,<br />
              <span className="text-white/85 font-medium">market analysis, and education.</span>
            </p>
          </div>

          {/* Social Row */}
          <div className="flex flex-row justify-between items-center gap-3 relative z-10 border-t border-white/10 pt-4">
            <span className="font-sans text-[16px] font-medium text-white/90 tracking-[0.3px]">Stay in touch!</span>
            <div className="flex flex-row gap-[7px]">
              
              {/* YouTube */}
              <a href={SOCIAL_LINKS.youtube} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-[9px] bg-[#0e1014] flex items-center justify-center shadow-[0_6px_18px_rgba(0,0,0,0.35),0_2px_6px_rgba(0,0,0,0.2)] hover:bg-[#f15a3b] hover:-translate-y-[2px] hover:shadow-[0_8px_24px_rgba(241,90,59,0.4),0_3px_8px_rgba(0,0,0,0.3)] transition-all duration-200" aria-label="YouTube">
                <Youtube className="w-4 h-4 text-white" />
              </a>

              {/* Instagram */}
              <a href={SOCIAL_LINKS.instagram} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-[9px] bg-[#0e1014] flex items-center justify-center shadow-[0_6px_18px_rgba(0,0,0,0.35),0_2px_6px_rgba(0,0,0,0.2)] hover:bg-[#f15a3b] hover:-translate-y-[2px] hover:shadow-[0_8px_24px_rgba(241,90,59,0.4),0_3px_8px_rgba(0,0,0,0.3)] transition-all duration-200" aria-label="Instagram">
                <Instagram className="w-4 h-4 text-white" />
              </a>

              {/* X (Twitter) */}
              <a href={SOCIAL_LINKS.twitter} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-[9px] bg-[#0e1014] flex items-center justify-center shadow-[0_6px_18px_rgba(0,0,0,0.35),0_2px_6px_rgba(0,0,0,0.2)] hover:bg-[#f15a3b] hover:-translate-y-[2px] hover:shadow-[0_8px_24px_rgba(241,90,59,0.4),0_3px_8px_rgba(0,0,0,0.3)] transition-all duration-200" aria-label="X (Twitter)">
                <div className="text-white hover:text-white transition-colors">
                  <XIcon />
                </div>
              </a>

              {/* LinkedIn */}
              <a href={SOCIAL_LINKS.linkedin} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-[9px] bg-[#0e1014] flex items-center justify-center shadow-[0_6px_18px_rgba(0,0,0,0.35),0_2px_6px_rgba(0,0,0,0.2)] hover:bg-[#f15a3b] hover:-translate-y-[2px] hover:shadow-[0_8px_24px_rgba(241,90,59,0.4),0_3px_8px_rgba(0,0,0,0.3)] transition-all duration-200" aria-label="LinkedIn">
                <Linkedin className="w-4 h-4 text-white" />
              </a>

              {/* Facebook */}
              <a href={SOCIAL_LINKS.facebook} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-[9px] bg-[#0e1014] flex items-center justify-center shadow-[0_6px_18px_rgba(0,0,0,0.35),0_2px_6px_rgba(0,0,0,0.2)] hover:bg-[#f15a3b] hover:-translate-y-[2px] hover:shadow-[0_8px_24px_rgba(241,90,59,0.4),0_3px_8px_rgba(0,0,0,0.3)] transition-all duration-200" aria-label="Facebook">
                <Facebook className="w-4 h-4 text-white" />
              </a>

              {/* WhatsApp */}
              <a href={SOCIAL_LINKS.whatsapp} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-[9px] bg-[#0e1014] flex items-center justify-center shadow-[0_6px_18px_rgba(0,0,0,0.35),0_2px_6px_rgba(0,0,0,0.2)] hover:bg-[#f15a3b] hover:-translate-y-[2px] hover:shadow-[0_8px_24px_rgba(241,90,59,0.4),0_3px_8px_rgba(0,0,0,0.3)] transition-all duration-200" aria-label="WhatsApp">
                <MessageCircle className="w-4 h-4 text-white" />
              </a>

            </div>
          </div>
        </div>

        {/* Right Card: Nav Grid + Subscription Form */}
        <div className="bg-[#faf6f0] dark:bg-card border border-black/5 dark:border-white/5 rounded-[28px] p-6 sm:p-10 relative overflow-visible shadow-[0_4px_20px_rgba(0,0,0,0.04)] flex flex-col justify-between">
          
          {/* Floating lucky badge */}
          <div className="absolute top-[-36px] right-6 sm:right-10 z-10 flex flex-col items-start gap-1 select-none">
            <Link 
              to="/contact" 
              className="flex flex-col items-start gap-1 group/kbadge no-underline"
            >
              <div 
                className="w-18 h-18 sm:w-24 sm:h-24 rounded-[16px] sm:rounded-[22px] rotate-[-10deg] bg-gradient-to-br from-[#00bfa5] via-[#006b5e] to-[#004d43] dark:from-[#00e5ff] dark:via-[#00bfa5] dark:to-[#006b5e] shadow-[inset_3px_3px_8px_rgba(255,255,255,0.35),inset_-3px_-3px_12px_rgba(0,0,0,0.18),0_12px_28px_rgba(0,107,94,0.3)] flex items-center justify-center cursor-pointer transition-all duration-400 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover/kbadge:rotate-[5deg] group-hover/kbadge:scale-108 group-hover/kbadge:shadow-[inset_4px_4px_10px_rgba(255,255,255,0.45),inset_-4px_-4px_14px_rgba(0,0,0,0.22),0_16px_36px_rgba(0,107,94,0.45)] active:rotate-[-25deg] active:scale-95"
                title="Click to give feedback, suggestions or request content/events!"
              >
                <span className="font-dm-sans text-3xl sm:text-[42px] font-bold text-white rotate-[10deg] text-shadow-[0_3px_6px_rgba(0,0,0,0.25)] leading-none pointer-events-none">K</span>
              </div>
              
              <div className="flex flex-row gap-1.5 items-center rotate-[-4deg] mt-1 pl-2">
                <div className="w-[18px] h-[18px] sm:w-[22px] sm:h-[22px] text-gray-500 dark:text-gray-400 group-hover/kbadge:text-primary dark:group-hover/kbadge:text-[#00bfa5] transition-colors">
                  <svg viewBox="0 0 24 24" className="w-full h-full stroke-current fill-none stroke-2 stroke-linecap-round stroke-linejoin-round" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 20 C 6 14, 10 9, 18 5" />
                    <path d="M18 5 L 12 5" />
                    <path d="M18 5 L 18 11" />
                  </svg>
                </div>
                <span className="font-sans text-sm sm:text-[15px] font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap group-hover/kbadge:text-primary dark:group-hover/kbadge:text-[#00bfa5] transition-colors">
                  {t("footer.shareFeedback")}
                </span>
              </div>
            </Link>
          </div>

          {/* Navigation links grid */}
          <div className="pt-10 sm:pt-14 w-full">
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
              
              {/* Col 1: Explore */}
              <div className="flex flex-col">
                <h4 className="font-display text-[20px] font-bold text-gray-800 dark:text-gray-200 mb-4 tracking-tight leading-none">{t("footer.explore")}</h4>
                {NAV_ITEMS.filter(i => !i.badge).map((item) => (
                  <Link key={item.label} to={item.href} className="block font-dm-sans text-[14px] font-semibold text-[#111827] dark:text-gray-200 mb-3.5 no-underline hover:text-[#006b5e] dark:hover:text-[#00bfa5] hover:translate-x-[3px] transition-all duration-200">
                    {t(NAV_LABEL_KEYS[item.label] || item.label)}
                  </Link>
                ))}
                <Link to="/calculators" className="block font-dm-sans text-[14px] font-semibold text-[#111827] dark:text-gray-200 mb-3.5 no-underline hover:text-[#006b5e] dark:hover:text-[#00bfa5] hover:translate-x-[3px] transition-all duration-200">
                  <span className="flex items-center gap-1.5">
                    <Calculator className="h-3.5 w-3.5" />
                    Calculators
                  </span>
                </Link>
              </div>

              {/* Col 2: Other Services */}
              <div className="flex flex-col">
                <h4 className="font-display text-[20px] font-bold text-gray-800 dark:text-gray-200 mb-4 tracking-tight leading-none">{t("footer.otherProducts")}</h4>
                {OTHER_PRODUCTS.map((product) => (
                  <a key={product.name} href={product.href} className="block font-dm-sans text-[14px] font-semibold text-[#111827] dark:text-gray-200 mb-3.5 no-underline hover:text-[#006b5e] dark:hover:text-[#00bfa5] hover:translate-x-[3px] transition-all duration-200">
                    {product.name}
                  </a>
                ))}
              </div>

              {/* Col 3: Our Info */}
              <div className="flex flex-col">
                <h4 className="font-display text-[20px] font-bold text-gray-800 dark:text-gray-200 mb-4 tracking-tight leading-none">{t("footer.ourInfo")}</h4>
                <Link to="/privacy" className="block font-dm-sans text-[14px] font-semibold text-[#111827] dark:text-gray-200 mb-3.5 no-underline hover:text-[#006b5e] dark:hover:text-[#00bfa5] hover:translate-x-[3px] transition-all duration-200">{t("footer.privacy")}</Link>
                <Link to="/grievance" className="block font-dm-sans text-[14px] font-semibold text-[#111827] dark:text-gray-200 mb-3.5 no-underline hover:text-[#006b5e] dark:hover:text-[#00bfa5] hover:translate-x-[3px] transition-all duration-200">{t("footer.grievance")}</Link>
                <Link to="/terms" className="block font-dm-sans text-[14px] font-semibold text-[#111827] dark:text-gray-200 mb-3.5 no-underline hover:text-[#006b5e] dark:hover:text-[#00bfa5] hover:translate-x-[3px] transition-all duration-200">{t("footer.terms")}</Link>
                <Link to="/disclaimer" className="block font-dm-sans text-[14px] font-semibold text-[#111827] dark:text-gray-200 mb-3.5 no-underline hover:text-[#006b5e] dark:hover:text-[#00bfa5] hover:translate-x-[3px] transition-all duration-200">{t("footer.disclaimer")}</Link>
                <Link to="/license" className="block font-dm-sans text-[14px] font-semibold text-[#111827] dark:text-gray-200 mb-3.5 no-underline hover:text-[#006b5e] dark:hover:text-[#00bfa5] hover:translate-x-[3px] transition-all duration-200">{t("footer.license")}</Link>
              </div>

              {/* Col 4: Contact Us & App Store buttons */}
              <div className="flex flex-col">
                <h4 className="font-display text-[20px] font-bold text-gray-800 dark:text-gray-200 mb-4 tracking-tight leading-none">{t("footer.contactUs")}</h4>
                <a href="mailto:goyalchirag721@gmail.com" className="block font-dm-sans text-[14px] font-medium text-gray-600 dark:text-gray-300 mb-2.5 break-all hover:text-[#006b5e] dark:hover:text-[#00bfa5] transition-colors">goyalchirag721@gmail.com</a>
                <span className="block font-dm-sans text-[14px] font-medium text-gray-600 dark:text-gray-300 mb-2.5">
                  123 Finance Street, Mumbai
                </span>
                <a href="tel:+919871963032" className="block font-dm-sans text-[14px] font-medium text-gray-600 dark:text-gray-300 mb-2.5 hover:text-[#006b5e] dark:hover:text-[#00bfa5] transition-colors">9871963032</a>
                
                <div className="flex flex-col gap-2 mt-4 max-w-[140px]">
                  {/* App Store */}
                  <a href="https://apps.apple.com/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-[9px] bg-[#111214] dark:bg-[#1a2327] text-white text-[12px] font-semibold px-3 py-2.5 shadow-[0_4px_10px_rgba(0,0,0,0.15)] hover:bg-black dark:hover:bg-[#006b5e] hover:-translate-y-[1px] hover:shadow-[0_6px_14px_rgba(0,0,0,0.25)] transition-all duration-200">
                    <AppStoreIcon />
                    App Store
                  </a>
                  {/* Google Play */}
                  <a href="https://play.google.com/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-[9px] bg-[#111214] dark:bg-[#1a2327] text-white text-[12px] font-semibold px-3 py-2.5 shadow-[0_4px_10px_rgba(0,0,0,0.15)] hover:bg-black dark:hover:bg-[#006b5e] hover:-translate-y-[1px] hover:shadow-[0_6px_14px_rgba(0,0,0,0.25)] transition-all duration-200">
                    <GooglePlayIcon />
                    Google Play
                  </a>
                </div>
              </div>

            </div>
          </div>

          {/* Bottom Copyright & Subscription Row */}
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between mt-12 border-t border-black/5 dark:border-white/5 pt-6 gap-6">
            <div className="font-dm-sans text-[12.5px] font-medium text-gray-500 dark:text-gray-400">
              <span>© {new Date().getFullYear()} KAMADA. All rights reserved.</span>
              <div className="mt-1 flex flex-row gap-2">
                <Link to="/privacy" className="text-gray-500 dark:text-gray-400 no-underline hover:text-[#006b5e] dark:hover:text-[#00bfa5] transition-colors">{t("footer.privacy")}</Link>
                <span>•</span>
                <Link to="/terms" className="text-gray-500 dark:text-gray-400 no-underline hover:text-[#006b5e] dark:hover:text-[#00bfa5] transition-colors">{t("footer.terms")}</Link>
                <span>•</span>
                <Link to="/license" className="text-gray-500 dark:text-gray-400 no-underline hover:text-[#006b5e] dark:hover:text-[#00bfa5] transition-colors">Compliance</Link>
              </div>
            </div>

            <div className="flex flex-col gap-3 w-full md:w-auto">
              <h4 className="text-[14px] font-normal text-gray-500 dark:text-gray-400 leading-normal">
                Finance moves fast.
                <strong className="block text-[19px] font-bold text-[#111827] dark:text-white mt-0.5">Stay ahead with KAMADA.</strong>
              </h4>
              <form onSubmit={handleFooterSubscribe} className={`flex flex-row w-full md:w-[310px] bg-white dark:bg-[#1a2327] border border-gray-200 dark:border-gray-700 rounded-xl p-1 shadow-[0_2px_10px_rgba(0,0,0,0.03)] focus-within:border-[#006b5e] dark:focus-within:border-[#00bfa5] focus-within:shadow-[0_4px_12px_rgba(0,107,94,0.08)] transition-all duration-200 ${isLoggedIn ? 'justify-center border-none bg-transparent dark:bg-transparent shadow-none p-0' : ''}`}>
                {!isLoggedIn && (
                  <input 
                    type="email" 
                    placeholder="Enter email address" 
                    aria-label="Enter email address" 
                    required
                    value={footerEmail}
                    onChange={(e) => setFooterEmail(e.target.value)}
                    className="flex-1 px-3 py-2 bg-transparent border-none outline-none font-dm-sans text-[13.5px] text-[#111827] dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500" 
                  />
                )}
                <button 
                  type="submit" 
                  disabled={isSubmitting || isAlreadySubscribed}
                  className={`px-4 py-2 bg-[#111214] dark:bg-primary dark:text-primary-foreground text-white font-dm-sans text-[13.5px] font-semibold border-none rounded-lg cursor-pointer shadow-[0_4px_12px_rgba(0,0,0,0.2)] hover:bg-black dark:hover:bg-[#00bfa5] hover:-translate-y-[1px] hover:shadow-[0_6px_16px_rgba(0,0,0,0.3)] transition-all duration-200 flex items-center justify-center gap-1.5 ${isLoggedIn ? 'w-full py-2.5 h-11 text-[14px]' : ''}`}
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : isAlreadySubscribed ? (
                    t("subscribe.subscribed") || "Subscribed"
                  ) : (
                    "Subscribe"
                  )}
                </button>
              </form>
            </div>
          </div>

        </div>

      </div>

      {/* Background massive fluid scaling wordmark */}
      <div className="max-w-[1150px] mx-auto mt-[-30px] sm:mt-[-60px] pointer-events-none select-none relative z-0 leading-none" aria-hidden="true">
        <svg id="watermarkSvg" ref={svgRef} viewBox="0 0 1150 250" preserveAspectRatio="xMidYMid meet" className="display-block w-full h-auto overflow-visible">
          <text id="watermarkText" ref={textRef} x="575" y="200" textAnchor="middle" fontWeight="700" letterSpacing="-0.03em" className="font-dm-sans text-[280px] fill-black/[0.04] dark:fill-white/[0.03]">KAMADA</text>
        </svg>
      </div>

    </footer>
  );
};

export default Footer;