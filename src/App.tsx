import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ReadingProgressProvider } from "@/contexts/ReadingProgressContext";
import Index from "./pages/Index";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import SubscribePage from "./pages/SubscribePage";
import NewsletterPage from "./pages/NewsletterPage";
import NewsletterArticlePage from "./pages/NewsletterArticlePage";
import ModulesPage from "./pages/ModulesPage";
import ModuleArticlePage from "./pages/ModuleArticlePage";
import VideosPage from "./pages/VideosPage";
import VideoArticlePage from "./pages/VideoArticlePage";
import EventsPage from "./pages/EventsPage";
import EventDetailPage from "./pages/EventDetailPage";
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
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />
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
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </ReadingProgressProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
