import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const TermsPage = () => (
  <div className="min-h-screen flex flex-col bg-background">
    <Navbar />
    <main className="flex-1 container py-12 max-w-3xl space-y-6">
      <h1 className="font-display text-3xl font-bold text-foreground">Terms of Service</h1>
      <p className="text-sm text-muted-foreground">Last updated: January 1, 2025</p>
      <div className="space-y-4">
        <h2 className="font-display text-xl font-semibold text-foreground">1. Acceptance of Terms</h2>
        <p className="text-muted-foreground">By accessing or using our platform, you agree to be bound by these Terms of Service and our Privacy Policy.</p>
        <h2 className="font-display text-xl font-semibold text-foreground">2. User Accounts</h2>
        <p className="text-muted-foreground">You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account.</p>
        <h2 className="font-display text-xl font-semibold text-foreground">3. Content Usage</h2>
        <p className="text-muted-foreground">All content on this platform is for informational purposes only and does not constitute financial advice. Reproduction without permission is prohibited.</p>
        <h2 className="font-display text-xl font-semibold text-foreground">4. Subscription</h2>
        <p className="text-muted-foreground">Subscriptions are billed as per the chosen plan. Cancellations take effect at the end of the current billing cycle.</p>
        <h2 className="font-display text-xl font-semibold text-foreground">5. Limitation of Liability</h2>
        <p className="text-muted-foreground">We shall not be liable for any losses arising from decisions made based on our content.</p>
      </div>
    </main>
    <Footer />
  </div>
);

export default TermsPage;
