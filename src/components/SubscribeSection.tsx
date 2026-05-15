import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Mail, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/useTranslation";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";

interface SubscribeSectionProps {
  variant?: "inline" | "full";
}

const SubscribeSection = ({ variant = "inline" }: SubscribeSectionProps) => {
  const [email, setEmail] = useState("");
  const [frequency, setFrequency] = useState("weekly");
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useTranslation();
  const { isLoggedIn, user, updateProfile } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);

    try {
      if (isLoggedIn && user) {
        // Save subscription to user's profile in database
        const { error } = await supabase
          .from("profiles")
          .update({
            is_subscribed: true,
            mail_preference: frequency === "daily" ? "intrusive" : "non-intrusive",
          })
          .eq("id", user.id);

        if (error) {
          console.error("Error saving subscription:", error);
          toast.error("Failed to save subscription. Please try again.");
          setIsLoading(false);
          return;
        }

        // Also update local user state
        if (updateProfile) {
          await updateProfile({
            isSubscribed: true,
            mailPreference: frequency === "daily" ? "intrusive" : "non-intrusive",
          });
        }

        toast.success(t("subscribe.success"), {
          description: `You're now subscribed to ${frequency} updates at ${email}`,
        });
      } else {
        // Anonymous user - save email and redirect to signup
        localStorage.setItem("pendingSubscriptionEmail", email);
        localStorage.setItem("pendingSubscriptionFrequency", frequency);
        toast.success("Thanks for your interest!", {
          description: "Please sign up or log in to complete your subscription.",
        });
        navigate("/signup");
      }

      setEmail("");
    } catch (error) {
      console.error("Subscription error:", error);
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (variant === "full") {
    return (
      <section className="py-16">
        <div className="container max-w-lg mx-auto text-center space-y-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-2">
            <Mail className="h-8 w-8 text-primary" />
          </div>
          <h2 className="font-display text-3xl font-bold text-foreground">{t("subscribe.fullTitle")}</h2>
          <p className="text-muted-foreground">{t("subscribe.fullDesc")}</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input type="email" placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 rounded-xl" required />
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">{t("subscribe.frequency")}</Label>
              <RadioGroup value={frequency} onValueChange={setFrequency} className="flex justify-center gap-6">
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="daily" id="daily" />
                  <Label htmlFor="daily" className="text-sm">{t("subscribe.daily")}</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="weekly" id="weekly" />
                  <Label htmlFor="weekly" className="text-sm">{t("subscribe.weekly")}</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="monthly" id="monthly" />
                  <Label htmlFor="monthly" className="text-sm">{t("subscribe.monthly")}</Label>
                </div>
              </RadioGroup>
            </div>
            <Button type="submit" disabled={isLoading} className="w-full h-12 rounded-xl text-base font-semibold">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Subscribing...
                </>
              ) : (
                t("subscribe.button")
              )}
            </Button>
          </form>
          <p className="text-xs text-muted-foreground">
            {t("subscribe.joinTribe")}{" "}
            <a href="https://whatsapp.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{t("subscribe.whatsapp")}</a>
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 bg-accent/50">
      <div className="container max-w-2xl mx-auto text-center space-y-4">
        <h3 className="font-display text-xl font-bold text-foreground">{t("subscribe.title")}</h3>
        <form onSubmit={handleSubmit} className="flex gap-2 max-w-md mx-auto">
          <Input type="email" placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className="h-10 rounded-lg flex-1" required />
          <Button type="submit" disabled={isLoading} className="rounded-lg px-6">
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              t("subscribe.button")
            )}
          </Button>
        </form>
      </div>
    </section>
  );
};

export default SubscribeSection;
