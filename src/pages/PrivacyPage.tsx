import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const PrivacyPage = () => (
  <div className="min-h-screen flex flex-col bg-background">
    <Navbar />
    <main className="flex-1 container py-12 max-w-3xl space-y-6">
      <h1 className="font-display text-3xl font-bold text-foreground">Privacy Policy</h1>
      <p className="text-sm text-muted-foreground">Last updated: January 1, 2025</p>
      <div className="prose prose-sm text-foreground space-y-4">
        <h2 className="font-display text-xl font-semibold">1. Information We Collect</h2>
        <p className="text-muted-foreground">We collect information you provide directly, such as your name, email address, and preferences when you create an account or subscribe to our newsletter.</p>
        <h2 className="font-display text-xl font-semibold">2. How We Use Your Information</h2>
        <p className="text-muted-foreground">Your information is used to deliver personalized content, send newsletters, and improve our platform experience.</p>
        <h2 className="font-display text-xl font-semibold">3. Data Sharing</h2>
        <p className="text-muted-foreground">We do not sell your personal data. We may share anonymized, aggregated data with partners for analytics purposes.</p>
        <h2 className="font-display text-xl font-semibold">4. Cookies</h2>
        <p className="text-muted-foreground">We use essential cookies for site functionality and optional analytics cookies with your consent.</p>
        <h2 className="font-display text-xl font-semibold">5. Your Rights</h2>
        <p className="text-muted-foreground">You have the right to access, correct, or delete your personal data at any time by contacting us.</p>
      </div>
    </main>
    <Footer />
  </div>
);

export default PrivacyPage;
