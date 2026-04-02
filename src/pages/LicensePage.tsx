import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const LicensePage = () => (
  <div className="min-h-screen flex flex-col bg-background">
    <Navbar />
    <main className="flex-1 container py-12 max-w-3xl space-y-6">
      <h1 className="font-display text-3xl font-bold text-foreground">License Compliance</h1>
      <p className="text-sm text-muted-foreground">Last updated: January 1, 2025</p>
      <div className="space-y-4">
        <h2 className="font-display text-xl font-semibold text-foreground">Content License</h2>
        <p className="text-muted-foreground">All original content, including articles, modules, videos, and graphics, is owned by Blog and protected under applicable copyright laws.</p>
        <h2 className="font-display text-xl font-semibold text-foreground">Open Source</h2>
        <p className="text-muted-foreground">This platform uses open-source software components. We comply with all relevant licenses including MIT, Apache 2.0, and BSD.</p>
        <h2 className="font-display text-xl font-semibold text-foreground">Third-Party Assets</h2>
        <p className="text-muted-foreground">Images sourced from Unsplash are used under the Unsplash License. Icons are provided by Lucide under the ISC License.</p>
        <h2 className="font-display text-xl font-semibold text-foreground">User-Generated Content</h2>
        <p className="text-muted-foreground">By submitting feedback or comments, you grant us a non-exclusive, royalty-free license to use such content for platform improvement.</p>
      </div>
    </main>
    <Footer />
  </div>
);

export default LicensePage;
