import { type RouteConfig, index, route, layout, prefix } from "@react-router/dev/routes";

export default [
  index("../src/pages/Index.tsx"),
  route("login", "../src/pages/LoginPage.tsx"),
  route("signup", "../src/pages/SignupPage.tsx"),
  route("forgot-password", "../src/pages/ForgotPasswordPage.tsx"),
  route("reset-password", "../src/pages/ResetPasswordPage.tsx"),
  
  layout("../src/components/ProtectedRoute.tsx", [
    route("profile", "../src/pages/ProfilePage.tsx"),
    route("onboarding", "../src/pages/OnboardingPage.tsx"),
    route("learning", "../src/pages/MyLearningPage.tsx"),
  ]),

  route("auth/callback", "../src/pages/AuthCallback.tsx"),
  route("calculators", "../src/pages/CalculatorsPage.tsx"),
  route("subscribe", "../src/pages/SubscribePage.tsx"),
  route("newsletter", "../src/pages/NewsletterPage.tsx"),
  route("newsletter/:id", "../src/pages/NewsletterArticlePage.tsx"),
  
  route("modules", "../src/pages/ModulesPage.tsx"),
  route("modules/:moduleId", "../src/pages/ModuleArticlePage.tsx", { id: "module-article" }),
  route("modules/:moduleId/:chapterId", "../src/pages/ModuleArticlePage.tsx", { id: "module-chapter" }),
  
  route("videos", "../src/pages/VideosPage.tsx"),
  route("videos/:seriesId", "../src/pages/VideoArticlePage.tsx", { id: "video-series" }),
  route("videos/:seriesId/:chapterId", "../src/pages/VideoArticlePage.tsx", { id: "video-chapter" }),
  
  route("events", "../src/pages/EventsPage.tsx"),
  route("events/:eventId", "../src/pages/EventDetailPage.tsx"),
  
  route("junior", "../src/pages/JuniorPage.tsx"),
  route("junior/:moduleId", "../src/pages/JuniorArticlePage.tsx", { id: "junior-article" }),
  route("junior/:moduleId/:chapterId", "../src/pages/JuniorArticlePage.tsx", { id: "junior-chapter" }),
  
  route("privacy", "../src/pages/PrivacyPage.tsx"),
  route("grievance", "../src/pages/GrievancePage.tsx"),
  route("terms", "../src/pages/TermsPage.tsx"),
  route("disclaimer", "../src/pages/DisclaimerPage.tsx"),
  route("license", "../src/pages/LicensePage.tsx"),
  route("contact", "../src/pages/ContactPage.tsx"),

  layout("../src/components/admin/ProtectedRoute.tsx", [
    layout("../src/components/admin/AdminLayout.tsx", [
      ...prefix("admin", [
        index("../src/pages/admin/AdminDashboard.tsx"),
        route("articles", "../src/pages/admin/AdminArticles.tsx"),
        route("articles/new", "../src/pages/admin/ArticleEditor.tsx", { id: "admin-article-new" }),
        route("articles/:id", "../src/pages/admin/ArticleEditor.tsx", { id: "admin-article-edit" }),
        route("modules", "../src/pages/admin/AdminModules.tsx"),
        route("modules/new", "../src/pages/admin/ModuleEditor.tsx", { id: "admin-module-new" }),
        route("modules/:id", "../src/pages/admin/ModuleEditor.tsx", { id: "admin-module-edit" }),
        route("videos", "../src/pages/admin/AdminVideos.tsx"),
        route("videos/new", "../src/pages/admin/VideoSeriesEditor.tsx", { id: "admin-video-new" }),
        route("videos/:id", "../src/pages/admin/VideoSeriesEditor.tsx", { id: "admin-video-edit" }),
        route("events", "../src/pages/admin/AdminEvents.tsx"),
        route("events/new", "../src/pages/admin/EventEditor.tsx", { id: "admin-event-new" }),
        route("events/:id", "../src/pages/admin/EventEditor.tsx", { id: "admin-event-edit" }),
        route("junior", "../src/pages/admin/AdminJunior.tsx"),
        route("junior/new", "../src/pages/admin/JuniorModuleEditor.tsx", { id: "admin-junior-new" }),
        route("junior/:id", "../src/pages/admin/JuniorModuleEditor.tsx", { id: "admin-junior-edit" }),
        route("users", "../src/pages/admin/AdminUsers.tsx"),
        route("ab-tests", "../src/pages/admin/AdminABTests.tsx"),
        route("affiliates", "../src/pages/admin/AdminAffiliates.tsx"),
        route("settings", "../src/pages/admin/AdminSettings.tsx"),
      ]),
    ]),
  ]),

  // Catch-all
  route("*", "../src/pages/NotFound.tsx"),
] satisfies RouteConfig;
