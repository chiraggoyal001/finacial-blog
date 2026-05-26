import React, { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useTranslation } from "@/hooks/useTranslation";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { motion } from "motion/react";
import { 
  MessageSquare, 
  Send, 
  Star, 
  Mail, 
  Phone, 
  MapPin, 
  Lightbulb, 
  FileText, 
  Calendar, 
  Loader2,
  Youtube,
  Instagram,
  Facebook,
  Linkedin,
  MessageCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SOCIAL_LINKS } from "@/lib/data";

const XIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current text-white" aria-label="X">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const getSocialIcon = (name: string) => {
  switch (name.toLowerCase()) {
    case "youtube":
      return <Youtube className="h-4 w-4 text-white" />;
    case "instagram":
      return <Instagram className="h-4 w-4 text-white" />;
    case "twitter":
      return <XIcon />;
    case "linkedin":
      return <Linkedin className="h-4 w-4 text-white" />;
    case "facebook":
      return <Facebook className="h-4 w-4 text-white" />;
    case "whatsapp":
      return <MessageCircle className="h-4 w-4 text-white" />;
    default:
      return null;
  }
};

const ContactPage = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  
  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [purpose, setPurpose] = useState<string>("");
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [category, setCategory] = useState<string>("");
  const [requestType, setRequestType] = useState<string>("");
  const [requestTopic, setRequestTopic] = useState("");
  const [message, setMessage] = useState("");
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !purpose || !message) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    if (purpose === "feedback" && rating === 0) {
      toast({
        title: "Rating Required",
        description: "Please provide a rating.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      let dbSuccess = false;

      // Try inserting into contact_submissions table first
      try {
        const { error: contactError } = await supabase
          .from("contact_submissions")
          .insert({
            name,
            email,
            purpose,
            rating: purpose === "feedback" ? rating : null,
            suggestion_category: purpose === "suggestion" ? category : null,
            request_type: purpose === "request" ? requestType : null,
            request_topic: purpose === "request" ? requestTopic : null,
            message,
            created_at: new Date().toISOString(),
          });

        if (!contactError) {
          dbSuccess = true;
        } else {
          // Fallback: try inserting to feedback table if contact_submissions does not exist
          const { error: feedbackError } = await supabase
            .from("feedback")
            .insert({
              rating: purpose === "feedback" ? rating : 5,
              comment: `[Purpose: ${purpose}] ${category ? `[Category: ${category}] ` : ""}${requestType ? `[ReqType: ${requestType}] ` : ""}${requestTopic ? `[ReqTopic: ${requestTopic}] ` : ""}Message: ${message} (From: ${name} <${email}>)`,
              variant: `contact_${purpose}`,
              created_at: new Date().toISOString(),
            });

          if (!feedbackError) {
            dbSuccess = true;
          }
        }
      } catch (dbErr) {
        console.warn("Database submission warning, falling back to localStorage:", dbErr);
      }

      // If database write failed, store in localStorage
      if (!dbSuccess) {
        const existingSubmissions = JSON.parse(localStorage.getItem("contact_submissions") || "[]");
        existingSubmissions.push({
          id: crypto.randomUUID(),
          name,
          email,
          purpose,
          rating: purpose === "feedback" ? rating : null,
          category: purpose === "suggestion" ? category : null,
          requestType: purpose === "request" ? requestType : null,
          requestTopic: purpose === "request" ? requestTopic : null,
          message,
          timestamp: new Date().toISOString(),
        });
        localStorage.setItem("contact_submissions", JSON.stringify(existingSubmissions));
      }

      toast({
        title: t("contact.successTitle"),
        description: t("contact.successDesc"),
      });

      setSubmitted(true);
      
      // Reset form
      setName("");
      setEmail("");
      setPurpose("");
      setRating(0);
      setCategory("");
      setRequestType("");
      setRequestTopic("");
      setMessage("");
    } catch (error) {
      console.error("Submission error:", error);
      toast({
        title: t("contact.errorTitle"),
        description: t("contact.errorDesc"),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 container max-w-6xl py-12 px-4 sm:px-6">
        {/* Header Section */}
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-4">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-block px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary bg-primary/10 rounded-full mb-3">
              {t("footer.contactUs")}
            </span>
            <h1 className="font-display text-4xl sm:text-5xl font-extrabold text-foreground tracking-tight">
              {t("contact.title")}
            </h1>
            <p className="text-muted-foreground mt-3 leading-relaxed">
              {t("contact.subtitle")}
            </p>
          </motion.div>
        </div>

        {/* Two Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-8 items-start">
          
          {/* Left Column: Details & Info */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="space-y-6"
          >
            <Card className="overflow-hidden border-none shadow-[0_12px_40px_rgba(0,107,94,0.15)] bg-[#006b5e] text-white p-8 space-y-8 min-h-[460px] flex flex-col justify-between rounded-3xl relative">
              {/* Decorative radial overlay */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.08),transparent)] pointer-events-none" />
              
              <div className="space-y-4 relative z-10">
                <h3 className="font-display text-2xl font-bold tracking-tight">Connect with KAMADA</h3>
                <p className="text-white/80 leading-relaxed text-sm">
                  We are building the future of financial literacy. Tell us what modules you'd like to read next, give suggestions for events, or send us your feedback.
                </p>
              </div>

              {/* Info Items */}
              <div className="space-y-5 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center border border-white/10">
                    <Mail className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-white/65 font-medium">Email Address</p>
                    <a href="mailto:goyalchirag721@gmail.com" className="text-sm font-semibold hover:underline">
                      goyalchirag721@gmail.com
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center border border-white/10">
                    <Phone className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-white/65 font-medium">Phone Support</p>
                    <a href="tel:+919871963032" className="text-sm font-semibold hover:underline">
                      +91 9871963032
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center border border-white/10">
                    <MapPin className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-white/65 font-medium">Our Head Office</p>
                    <p className="text-sm font-semibold">123 Finance Street, Mumbai</p>
                  </div>
                </div>
              </div>

              {/* Social Channels */}
              <div className="pt-6 border-t border-white/10 flex flex-col gap-3 relative z-10">
                <span className="font-sans text-[15px] font-semibold text-white/90">Stay updated via socials!</span>
                <div className="flex gap-2.5">
                  {Object.entries(SOCIAL_LINKS).map(([name, url]) => (
                    <a 
                      key={name}
                      href={url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="w-9 h-9 rounded-[9px] bg-[#0e1014]/65 flex items-center justify-center shadow-[0_6px_18px_rgba(0,0,0,0.15),0_2px_6px_rgba(0,0,0,0.1)] hover:bg-[#f15a3b] hover:-translate-y-[2px] transition-all duration-200 border border-white/5"
                      aria-label={name}
                    >
                      {getSocialIcon(name)}
                    </a>
                  ))}
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Right Column: Dynamic Form Card */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="border border-border/40 shadow-xl bg-card/70 backdrop-blur-md rounded-3xl overflow-hidden">
              <CardHeader className="pb-4">
                <CardTitle className="font-display text-xl font-bold">Submit Your Message</CardTitle>
                <CardDescription>Fill out the details below and we will get back to you.</CardDescription>
              </CardHeader>
              <CardContent>
                {submitted ? (
                  <motion.div 
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-center py-12 px-6 space-y-4"
                  >
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                      <Send className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="font-display text-2xl font-bold">{t("contact.successTitle")}</h3>
                    <p className="text-muted-foreground max-w-md mx-auto text-sm leading-relaxed">
                      {t("contact.successDesc")}
                    </p>
                    <Button 
                      onClick={() => setSubmitted(false)} 
                      variant="outline" 
                      className="rounded-xl mt-4 font-semibold"
                    >
                      Send Another Message
                    </Button>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Name & Email Group */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-sm font-semibold text-foreground/80">
                          {t("contact.fullName")} <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="name"
                          type="text"
                          required
                          placeholder="Your Name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="rounded-xl border-border/50 focus-visible:ring-primary font-dm-sans"
                          disabled={isSubmitting}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm font-semibold text-foreground/80">
                          {t("contact.email")} <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          required
                          placeholder="your.email@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="rounded-xl border-border/50 focus-visible:ring-primary font-dm-sans"
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>

                    {/* Purpose Select dropdown */}
                    <div className="space-y-2">
                      <Label htmlFor="purpose" className="text-sm font-semibold text-foreground/80">
                        {t("contact.purpose")} <span className="text-destructive">*</span>
                      </Label>
                      <Select 
                        value={purpose} 
                        onValueChange={(val) => {
                          setPurpose(val);
                          // Clear dynamic states on purpose change
                          setRating(0);
                          setCategory("");
                          setRequestType("");
                          setRequestTopic("");
                        }}
                        disabled={isSubmitting}
                      >
                        <SelectTrigger className="rounded-xl border-border/50 focus:ring-primary font-dm-sans">
                          <SelectValue placeholder={t("contact.purpose.placeholder")} />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          <SelectItem value="feedback">{t("contact.purpose.feedback")}</SelectItem>
                          <SelectItem value="suggestion">{t("contact.purpose.suggestion")}</SelectItem>
                          <SelectItem value="request">{t("contact.purpose.request")}</SelectItem>
                          <SelectItem value="other">{t("contact.purpose.other")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* DYNAMIC FIELDS: Overall Feedback (Rating stars) */}
                    {purpose === "feedback" && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="space-y-3 p-4 bg-primary/5 rounded-2xl border border-primary/10"
                      >
                        <Label className="text-sm font-semibold text-primary/95 flex items-center gap-1.5">
                          <MessageSquare className="h-4 w-4" />
                          {t("contact.rating")} <span className="text-destructive">*</span>
                        </Label>
                        <div className="flex gap-1.5 items-center mt-1">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <button
                              type="button"
                              key={s}
                              onClick={() => setRating(s)}
                              onMouseEnter={() => setHoverRating(s)}
                              onMouseLeave={() => setHoverRating(0)}
                              className="p-1 transition-transform duration-100 hover:scale-125"
                              disabled={isSubmitting}
                            >
                              <Star 
                                className={`h-8 w-8 transition-colors ${
                                  s <= (hoverRating || rating) 
                                    ? "fill-amber-500 text-amber-500" 
                                    : "text-muted-foreground/60"
                                }`} 
                              />
                            </button>
                          ))}
                          {rating > 0 && (
                            <span className="text-xs font-bold font-mono ml-2 text-amber-600 bg-amber-100 dark:bg-amber-950/40 px-2 py-0.5 rounded-full">
                              {rating} / 5
                            </span>
                          )}
                        </div>
                      </motion.div>
                    )}

                    {/* DYNAMIC FIELDS: Suggestion Category dropdown */}
                    {purpose === "suggestion" && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="space-y-2 p-4 bg-orange-500/5 rounded-2xl border border-orange-500/10"
                      >
                        <Label htmlFor="category" className="text-sm font-semibold text-orange-600 flex items-center gap-1.5">
                          <Lightbulb className="h-4 w-4" />
                          {t("contact.suggestionCategory")}
                        </Label>
                        <Select value={category} onValueChange={setCategory} disabled={isSubmitting}>
                          <SelectTrigger className="rounded-xl border-orange-500/20 bg-background font-dm-sans">
                            <SelectValue placeholder={t("contact.suggestionCategory.placeholder")} />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl">
                            <SelectItem value="ui">{t("contact.suggestionCategory.ui")}</SelectItem>
                            <SelectItem value="features">{t("contact.suggestionCategory.features")}</SelectItem>
                            <SelectItem value="content">{t("contact.suggestionCategory.content")}</SelectItem>
                            <SelectItem value="other">{t("contact.suggestionCategory.other")}</SelectItem>
                          </SelectContent>
                        </Select>
                      </motion.div>
                    )}

                    {/* DYNAMIC FIELDS: Content/Event Request (Request Type + Topic Theme) */}
                    {purpose === "request" && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="space-y-4 p-4 bg-indigo-500/5 rounded-2xl border border-indigo-500/10"
                      >
                        <div className="space-y-2">
                          <Label htmlFor="requestType" className="text-sm font-semibold text-indigo-600 flex items-center gap-1.5">
                            <Calendar className="h-4 w-4" />
                            {t("contact.requestType")}
                          </Label>
                          <Select value={requestType} onValueChange={setRequestType} disabled={isSubmitting}>
                            <SelectTrigger className="rounded-xl border-indigo-500/20 bg-background font-dm-sans">
                              <SelectValue placeholder={t("contact.requestType.placeholder")} />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                              <SelectItem value="article">{t("contact.requestType.article")}</SelectItem>
                              <SelectItem value="video">{t("contact.requestType.video")}</SelectItem>
                              <SelectItem value="calculator">{t("contact.requestType.calculator")}</SelectItem>
                              <SelectItem value="event">{t("contact.requestType.event")}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="requestTopic" className="text-sm font-semibold text-indigo-600 flex items-center gap-1.5">
                            <FileText className="h-4 w-4" />
                            {t("contact.requestTopic")}
                          </Label>
                          <Input
                            id="requestTopic"
                            type="text"
                            placeholder={t("contact.requestTopic.placeholder")}
                            value={requestTopic}
                            onChange={(e) => setRequestTopic(e.target.value)}
                            className="rounded-xl border-indigo-500/20 bg-background focus-visible:ring-indigo-600 font-dm-sans"
                            disabled={isSubmitting}
                          />
                        </div>
                      </motion.div>
                    )}

                    {/* Message Details */}
                    <div className="space-y-2">
                      <Label htmlFor="message" className="text-sm font-semibold text-foreground/80">
                        {t("contact.message")} <span className="text-destructive">*</span>
                      </Label>
                      <Textarea
                        id="message"
                        required
                        placeholder={t("contact.message.placeholder")}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        rows={5}
                        className="rounded-xl border-border/50 focus-visible:ring-primary resize-none font-dm-sans"
                        disabled={isSubmitting}
                      />
                    </div>

                    {/* Submit Button */}
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full rounded-xl py-6 font-semibold flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-95 transition-all shadow-[0_8px_20px_rgba(0,107,94,0.2)]"
                    >
                      {isSubmitting ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                      {isSubmitting ? t("contact.submitting") : t("contact.submit")}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </motion.div>

        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ContactPage;
