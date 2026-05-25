import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ReadingProgressProvider } from "@/contexts/ReadingProgressContext";
import ScrollToTop from "@/components/ScrollToTop";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ProtectedRoute as AdminProtectedRoute } from "@/components/admin/ProtectedRoute";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { lazy, Suspense, useEffect } from "react";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Index from "./pages/Index";
import { useTheme } from "@/contexts/ThemeContext";

// Lazy load ChatbotWidget to reduce initial bundle size
const ChatbotWidget = lazy(() => import("@/components/ChatbotWidget"));

// Component to conditionally render ChatbotWidget (hidden on auth pages)
const ChatbotWrapper = () => {
  const location = useLocation();
  const authPaths = ["/login", "/signup", "/forgot-password", "/auth/callback"];
  const isAuthPage = authPaths.some((path) =>
    location.pathname.startsWith(path),
  );

  if (isAuthPage) return null;

  return (
    <ErrorBoundary>
      <Suspense fallback={null}>
        <ChatbotWidget />
      </Suspense>
    </ErrorBoundary>
  );
};

// Admin pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminArticles from "./pages/admin/AdminArticles";
import ArticleEditor from "./pages/admin/ArticleEditor";
import AdminModules from "./pages/admin/AdminModules";
import ModuleEditor from "./pages/admin/ModuleEditor";
import AdminVideos from "./pages/admin/AdminVideos";
import VideoSeriesEditor from "./pages/admin/VideoSeriesEditor";
import AdminEvents from "./pages/admin/AdminEvents";
import EventEditor from "./pages/admin/EventEditor";
import AdminJunior from "./pages/admin/AdminJunior";
import JuniorModuleEditor from "./pages/admin/JuniorModuleEditor";
import AdminABTests from "./pages/admin/AdminABTests";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminAffiliates from "./pages/admin/AdminAffiliates";

import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import ProfilePage from "./pages/ProfilePage";
import CalculatorsPage from "./pages/CalculatorsPage";
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
import ContactPage from "./pages/ContactPage";
import OnboardingPage from "./pages/OnboardingPage";
import MyLearningPage from "./pages/MyLearningPage";
import AuthCallback from "./pages/AuthCallback";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
      staleTime: 1000 * 60 * 2, // 2 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes
      refetchOnWindowFocus: false,
    },
  },
});

// Component to dynamically set <html lang> attribute
const HtmlLangSetter = () => {
  const { language } = useTheme();
  useEffect(() => {
    document.documentElement.lang = language === "hi" ? "hi" : "en";
  }, [language]);
  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <ReadingProgressProvider>
          <TooltipProvider>
            <HtmlLangSetter />
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <ScrollToTop />
              <ErrorBoundary>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/signup" element={<SignupPage />} />
                  <Route
                    path="/forgot-password"
                    element={<ForgotPasswordPage />}
                  />
                  <Route
                    path="/reset-password"
                    element={<ResetPasswordPage />}
                  />
                  <Route
                    path="/profile"
                    element={
                      <ProtectedRoute>
                        <ProfilePage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/onboarding"
                    element={
                      <ProtectedRoute>
                        <OnboardingPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/learning"
                    element={
                      <ProtectedRoute>
                        <MyLearningPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="/auth/callback" element={<AuthCallback />} />
                  <Route path="/calculators" element={<CalculatorsPage />} />
                  <Route path="/subscribe" element={<SubscribePage />} />
                  <Route path="/newsletter" element={<NewsletterPage />} />
                  <Route
                    path="/newsletter/:id"
                    element={<NewsletterArticlePage />}
                  />
                  <Route path="/modules" element={<ModulesPage />} />
                  <Route
                    path="/modules/:moduleId"
                    element={<ModuleArticlePage />}
                  />
                  <Route
                    path="/modules/:moduleId/:chapterId"
                    element={<ModuleArticlePage />}
                  />
                  <Route path="/videos" element={<VideosPage />} />
                  <Route
                    path="/videos/:seriesId"
                    element={<VideoArticlePage />}
                  />
                  <Route
                    path="/videos/:seriesId/:chapterId"
                    element={<VideoArticlePage />}
                  />
                  <Route path="/events" element={<EventsPage />} />
                  <Route
                    path="/events/:eventId"
                    element={<EventDetailPage />}
                  />
                  <Route path="/junior" element={<JuniorPage />} />
                  <Route
                    path="/junior/:moduleId"
                    element={<JuniorArticlePage />}
                  />
                  <Route
                    path="/junior/:moduleId/:chapterId"
                    element={<JuniorArticlePage />}
                  />
                  <Route path="/privacy" element={<PrivacyPage />} />
                  <Route path="/grievance" element={<GrievancePage />} />
                  <Route path="/terms" element={<TermsPage />} />
                  <Route path="/disclaimer" element={<DisclaimerPage />} />
                  <Route path="/license" element={<LicensePage />} />
                  <Route path="/contact" element={<ContactPage />} />

                  {/* Admin Routes */}
                  <Route
                    path="/admin"
                    element={
                      <AdminProtectedRoute>
                        <AdminLayout />
                      </AdminProtectedRoute>
                    }
                  >
                    <Route index element={<AdminDashboard />} />
                    <Route path="articles" element={<AdminArticles />} />
                    <Route path="articles/new" element={<ArticleEditor />} />
                    <Route path="articles/:id" element={<ArticleEditor />} />
                    <Route path="modules" element={<AdminModules />} />
                    <Route path="modules/new" element={<ModuleEditor />} />
                    <Route path="modules/:id" element={<ModuleEditor />} />
                    <Route path="videos" element={<AdminVideos />} />
                    <Route path="videos/new" element={<VideoSeriesEditor />} />
                    <Route path="videos/:id" element={<VideoSeriesEditor />} />
                    <Route path="events" element={<AdminEvents />} />
                    <Route path="events/new" element={<EventEditor />} />
                    <Route path="events/:id" element={<EventEditor />} />
                    <Route path="junior" element={<AdminJunior />} />
                    <Route path="junior/new" element={<JuniorModuleEditor />} />
                    <Route path="junior/:id" element={<JuniorModuleEditor />} />
                    <Route path="users" element={<AdminUsers />} />
                    <Route path="ab-tests" element={<AdminABTests />} />
                    <Route path="affiliates" element={<AdminAffiliates />} />
                    <Route path="settings" element={<AdminSettings />} />
                  </Route>

                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </ErrorBoundary>
              <ChatbotWrapper />
            </BrowserRouter>
          </TooltipProvider>
        </ReadingProgressProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;