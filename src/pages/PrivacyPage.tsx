import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useTranslation } from "@/hooks/useTranslation";

const PrivacyPage = () => {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container py-12 max-w-3xl space-y-6">
        <h1 className="font-display text-3xl font-bold text-foreground">{t("privacy.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("privacy.lastUpdated")}</p>
        <div className="prose prose-sm text-foreground space-y-4">
          <h2 className="font-display text-xl font-semibold">{t("privacy.s1title")}</h2>
          <p className="text-muted-foreground">{t("privacy.s1desc")}</p>
          <h2 className="font-display text-xl font-semibold">{t("privacy.s2title")}</h2>
          <p className="text-muted-foreground">{t("privacy.s2desc")}</p>
          <h2 className="font-display text-xl font-semibold">{t("privacy.s3title")}</h2>
          <p className="text-muted-foreground">{t("privacy.s3desc")}</p>
          <h2 className="font-display text-xl font-semibold">{t("privacy.s4title")}</h2>
          <p className="text-muted-foreground">{t("privacy.s4desc")}</p>
          <h2 className="font-display text-xl font-semibold">{t("privacy.s5title")}</h2>
          <p className="text-muted-foreground">{t("privacy.s5desc")}</p>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PrivacyPage;
