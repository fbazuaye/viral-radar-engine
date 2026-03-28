import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import { lazy, Suspense } from "react";

const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const ViralRadar = lazy(() => import("./pages/ViralRadar"));
const TrendingTopics = lazy(() => import("./pages/TrendingTopics"));
const KeywordExplorer = lazy(() => import("./pages/KeywordExplorer"));
const TitleOptimizer = lazy(() => import("./pages/TitleOptimizer"));
const IdeaGenerator = lazy(() => import("./pages/IdeaGenerator"));
const Competitors = lazy(() => import("./pages/Competitors"));
const Thumbnails = lazy(() => import("./pages/Thumbnails"));
const CreatorFeed = lazy(() => import("./pages/CreatorFeed"));
const ScriptGenerator = lazy(() => import("./pages/ScriptGenerator"));
const DescriptionGenerator = lazy(() => import("./pages/DescriptionGenerator"));
const ContentGaps = lazy(() => import("./pages/ContentGaps"));
const Pricing = lazy(() => import("./pages/Pricing"));
const AdminUsers = lazy(() => import("./pages/AdminUsers"));
const AdminAnalytics = lazy(() => import("./pages/AdminAnalytics"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const Loading = () => (
  <div className="flex h-screen items-center justify-center bg-background">
    <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
  </div>
);

const Protected = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute>
    <AppLayout>{children}</AppLayout>
  </ProtectedRoute>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Suspense fallback={<Loading />}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
                <Route path="/viral-radar" element={<Protected><ViralRadar /></Protected>} />
                <Route path="/trending" element={<Protected><TrendingTopics /></Protected>} />
                <Route path="/keywords" element={<Protected><KeywordExplorer /></Protected>} />
                <Route path="/title-optimizer" element={<Protected><TitleOptimizer /></Protected>} />
                <Route path="/idea-generator" element={<Protected><IdeaGenerator /></Protected>} />
                <Route path="/competitors" element={<Protected><Competitors /></Protected>} />
                <Route path="/thumbnails" element={<Protected><Thumbnails /></Protected>} />
                <Route path="/feed" element={<Protected><CreatorFeed /></Protected>} />
                <Route path="/scripts" element={<Protected><ScriptGenerator /></Protected>} />
                <Route path="/content-gaps" element={<Protected><ContentGaps /></Protected>} />
                <Route path="/pricing" element={<Protected><Pricing /></Protected>} />
                <Route path="/admin/users" element={<Protected><AdminUsers /></Protected>} />
                <Route path="/admin/analytics" element={<Protected><AdminAnalytics /></Protected>} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
