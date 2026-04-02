import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const GrievancePage = () => (
  <div className="min-h-screen flex flex-col bg-background">
    <Navbar />
    <main className="flex-1 container py-12 max-w-3xl space-y-6">
      <h1 className="font-display text-3xl font-bold text-foreground">Grievance Resolution</h1>
      <p className="text-sm text-muted-foreground">Last updated: January 1, 2025</p>
      <div className="space-y-4">
        <h2 className="font-display text-xl font-semibold text-foreground">How to File a Grievance</h2>
        <p className="text-muted-foreground">If you have any concerns or complaints regarding our content, services, or policies, please reach out to our Grievance Officer.</p>
        <div className="bg-card border border-border rounded-xl p-6 space-y-2">
          <p className="font-semibold text-foreground">Grievance Officer</p>
          <p className="text-muted-foreground">Name: Blog Grievance Desk</p>
          <p className="text-muted-foreground">Email: <a href="mailto:grievance@blog.com" className="text-primary hover:underline">grievance@blog.com</a></p>
          <p className="text-muted-foreground">Response Time: Within 48 hours</p>
        </div>
        <h2 className="font-display text-xl font-semibold text-foreground">Resolution Process</h2>
        <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
          <li>Submit your grievance via email with relevant details.</li>
          <li>Receive an acknowledgement within 24 hours.</li>
          <li>Our team will investigate and respond within 7 business days.</li>
          <li>If unresolved, the matter will be escalated to senior management.</li>
        </ol>
      </div>
    </main>
    <Footer />
  </div>
);

export default GrievancePage;
