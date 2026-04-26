import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ReadingProgressProvider } from "@/contexts/ReadingProgressContext";
import ScrollToTop from "@/components/ScrollToTop";
import ChatbotWidget from "@/components/ChatbotWidget";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Index from "./pages/Index";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ProfilePage from "./pages/ProfilePage";
import SubscribePage from "./pages/SubscribePage";
import NewsletterPage from "./pages/NewsletterPage";
import NewsletterArticlePage from "./pages/NewsletterArticlePage";
import ModulesPage from "./pages/ModulesPage";
import ModuleArticlePage from "./pages/ModuleArticlePage";
import VideosPage from "./pages/VideosPage";
import VideoArticlePage from "./pages/VideoArticlePage";
import EventsPage from "./pages/EventsPage";
import EventDetailPage from "./pages/EventDetailPage";
import JuniorPage from "./pages/JuniorPage";
import JuniorArticlePage from "./pages/JuniorArticlePage";
import PrivacyPage from "./pages/PrivacyPage";
import GrievancePage from "./pages/GrievancePage";
import TermsPage from "./pages/TermsPage";
import DisclaimerPage from "./pages/DisclaimerPage";
import LicensePage from "./pages/LicensePage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <ReadingProgressProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <ScrollToTop />
              <ErrorBoundary>
                <Routes>
                  <Route path="/" element={<Index />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                <Route path="/subscribe" element={<SubscribePage />} />
                <Route path="/newsletter" element={<NewsletterPage />} />
                <Route path="/newsletter/:id" element={<NewsletterArticlePage />} />
                <Route path="/modules" element={<ModulesPage />} />
                <Route path="/modules/:moduleId" element={<ModuleArticlePage />} />
                <Route path="/modules/:moduleId/:chapterId" element={<ModuleArticlePage />} />
                <Route path="/videos" element={<VideosPage />} />
                <Route path="/videos/:seriesId" element={<VideoArticlePage />} />
                <Route path="/videos/:seriesId/:chapterId" element={<VideoArticlePage />} />
                <Route path="/events" element={<EventsPage />} />
                <Route path="/events/:eventId" element={<EventDetailPage />} />
                <Route path="/junior" element={<JuniorPage />} />
                <Route path="/junior/:moduleId" element={<JuniorArticlePage />} />
                <Route path="/junior/:moduleId/:chapterId" element={<JuniorArticlePage />} />
                <Route path="/privacy" element={<PrivacyPage />} />
                <Route path="/grievance" element={<GrievancePage />} />
                <Route path="/terms" element={<TermsPage />} />
                <Route path="/disclaimer" element={<DisclaimerPage />} />
                <Route path="/license" element={<LicensePage />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
                </Routes>
              </ErrorBoundary>
              <ErrorBoundary>
                <ChatbotWidget />
              </ErrorBoundary>
            </BrowserRouter>
          </TooltipProvider>
        </ReadingProgressProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
