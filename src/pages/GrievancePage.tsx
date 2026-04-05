import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useTranslation } from "@/hooks/useTranslation";

const GrievancePage = () => {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container py-12 max-w-3xl space-y-6">
        <h1 className="font-display text-3xl font-bold text-foreground">{t("grievance.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("grievance.lastUpdated")}</p>
        <div className="space-y-4">
          <h2 className="font-display text-xl font-semibold text-foreground">{t("grievance.howToFile")}</h2>
          <p className="text-muted-foreground">{t("grievance.howDesc")}</p>
          <div className="bg-card border border-border rounded-xl p-6 space-y-2">
            <p className="font-semibold text-foreground">{t("grievance.officer")}</p>
            <p className="text-muted-foreground">{t("grievance.name")}</p>
            <p className="text-muted-foreground">Email: <a href="mailto:grievance@blog.com" className="text-primary hover:underline">grievance@blog.com</a></p>
            <p className="text-muted-foreground">{t("grievance.responseTime")}</p>
          </div>
          <h2 className="font-display text-xl font-semibold text-foreground">{t("grievance.process")}</h2>
          <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
            <li>{t("grievance.step1")}</li>
            <li>{t("grievance.step2")}</li>
            <li>{t("grievance.step3")}</li>
            <li>{t("grievance.step4")}</li>
          </ol>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default GrievancePage;
