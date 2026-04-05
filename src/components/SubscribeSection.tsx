import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Mail } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/useTranslation";

interface SubscribeSectionProps {
  variant?: "inline" | "full";
}

const SubscribeSection = ({ variant = "inline" }: SubscribeSectionProps) => {
  const [email, setEmail] = useState("");
  const [frequency, setFrequency] = useState("weekly");
  const { t } = useTranslation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    toast.success(t("subscribe.success"), { description: `You'll receive ${frequency} updates at ${email}` });
    setEmail("");
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
            <Button type="submit" className="w-full h-12 rounded-xl text-base font-semibold">{t("subscribe.button")}</Button>
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
          <Button type="submit" className="rounded-lg px-6">{t("subscribe.button")}</Button>
        </form>
      </div>
    </section>
  );
};

export default SubscribeSection;
