import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const DisclaimerPage = () => (
  <div className="min-h-screen flex flex-col bg-background">
    <Navbar />
    <main className="flex-1 container py-12 max-w-3xl space-y-6">
      <h1 className="font-display text-3xl font-bold text-foreground">Disclaimer</h1>
      <p className="text-sm text-muted-foreground">Last updated: January 1, 2025</p>
      <div className="space-y-4">
        <h2 className="font-display text-xl font-semibold text-foreground">General Disclaimer</h2>
        <p className="text-muted-foreground">The content provided on this platform is for educational and informational purposes only. It should not be construed as professional financial, investment, tax, or legal advice.</p>
        <h2 className="font-display text-xl font-semibold text-foreground">No Investment Advice</h2>
        <p className="text-muted-foreground">Nothing on this site constitutes a recommendation to buy, sell, or hold any financial instrument. Always consult a qualified financial advisor before making investment decisions.</p>
        <h2 className="font-display text-xl font-semibold text-foreground">Accuracy of Information</h2>
        <p className="text-muted-foreground">While we strive for accuracy, we make no warranties regarding the completeness, reliability, or timeliness of any information presented.</p>
        <h2 className="font-display text-xl font-semibold text-foreground">Third-Party Links</h2>
        <p className="text-muted-foreground">Our platform may contain links to third-party websites. We are not responsible for their content or practices.</p>
      </div>
    </main>
    <Footer />
  </div>
);

export default DisclaimerPage;
