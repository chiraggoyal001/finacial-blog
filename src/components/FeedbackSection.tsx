import React, { useState } from "react";
import { MessageSquare, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useTranslation } from "@/hooks/useTranslation";

interface FeedbackSectionProps {
  variant?: "default" | "junior";
  placeholder?: string;
}

const FeedbackSection: React.FC<FeedbackSectionProps> = ({ variant = "default", placeholder }) => {
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const { t } = useTranslation();
  const isJunior = variant === "junior";

  if (submitted) {
    return (
      <div className="space-y-3">
        <h3 className="font-display text-lg font-bold text-foreground flex items-center gap-2">
          <MessageSquare className={`h-5 w-5 ${isJunior ? "text-secondary" : "text-primary"}`} />
          {t("feedback.title")}
        </h3>
        <div className={`p-4 rounded-xl text-sm ${isJunior ? "bg-secondary/10 border border-secondary/20 text-foreground text-center" : "bg-primary/5 border border-primary/20 text-foreground"}`}>
          {isJunior ? (
            <><span className="text-2xl">🎉</span><p className="font-display font-semibold mt-1">{t("feedback.thanks")}</p></>
          ) : (
            `${t("feedback.thanks")} ${t("feedback.yourRating")} ${rating}/5`
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="font-display text-lg font-bold text-foreground flex items-center gap-2">
        <MessageSquare className={`h-5 w-5 ${isJunior ? "text-secondary" : "text-primary"}`} />
        {t("feedback.title")}
      </h3>
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground font-medium">{isJunior ? t("feedback.rateChapter") : t("feedback.rateThis")}</p>
        {isJunior ? (
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <button key={s} onClick={() => setRating(s)} className="p-1 transition-colors">
                <Star className={`h-6 w-6 ${s <= rating ? "fill-secondary text-secondary" : "text-muted-foreground"}`} />
              </button>
            ))}
          </div>
        ) : (
          <RadioGroup value={rating ? String(rating) : ""} onValueChange={(v) => setRating(Number(v))} className="flex gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center space-x-1">
                <RadioGroupItem value={String(i)} id={`fb-rating-${i}`} />
                <Label htmlFor={`fb-rating-${i}`} className="text-sm cursor-pointer">{i}</Label>
              </div>
            ))}
          </RadioGroup>
        )}
      </div>
      <div className="space-y-2">
        <Label className="text-sm text-muted-foreground">{t("feedback.comments")}</Label>
        <Textarea placeholder={placeholder || t("feedback.sharePlaceholder")} value={feedback} onChange={(e) => setFeedback(e.target.value)} className="resize-none" rows={3} />
      </div>
      <Button onClick={() => setSubmitted(true)} disabled={rating === 0} size="sm" className={isJunior ? "bg-secondary hover:bg-secondary/90" : ""}>
        {t("feedback.submit")}
      </Button>
    </div>
  );
};

export default FeedbackSection;
