import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useTranslation } from "@/hooks/useTranslation";

const TermsPage = () => {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container py-12 max-w-3xl space-y-6">
        <h1 className="font-display text-3xl font-bold text-foreground">{t("terms.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("terms.lastUpdated")}</p>
        <div className="space-y-4">
          <h2 className="font-display text-xl font-semibold text-foreground">{t("terms.s1title")}</h2>
          <p className="text-muted-foreground">{t("terms.s1desc")}</p>
          <h2 className="font-display text-xl font-semibold text-foreground">{t("terms.s2title")}</h2>
          <p className="text-muted-foreground">{t("terms.s2desc")}</p>
          <h2 className="font-display text-xl font-semibold text-foreground">{t("terms.s3title")}</h2>
          <p className="text-muted-foreground">{t("terms.s3desc")}</p>
          <h2 className="font-display text-xl font-semibold text-foreground">{t("terms.s4title")}</h2>
          <p className="text-muted-foreground">{t("terms.s4desc")}</p>
          <h2 className="font-display text-xl font-semibold text-foreground">{t("terms.s5title")}</h2>
          <p className="text-muted-foreground">{t("terms.s5desc")}</p>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default TermsPage;
