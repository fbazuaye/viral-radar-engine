import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { lazy, Suspense } from "react";

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
const ContentGaps = lazy(() => import("./pages/ContentGaps"));
const Pricing = lazy(() => import("./pages/Pricing"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const Loading = () => (
  <div className="flex h-screen items-center justify-center bg-background">
    <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
  </div>
);

const LayoutRoute = ({ children }: { children: React.ReactNode }) => (
  <AppLayout>{children}</AppLayout>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<Loading />}>
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/dashboard" element={<LayoutRoute><Dashboard /></LayoutRoute>} />
              <Route path="/viral-radar" element={<LayoutRoute><ViralRadar /></LayoutRoute>} />
              <Route path="/trending" element={<LayoutRoute><TrendingTopics /></LayoutRoute>} />
              <Route path="/keywords" element={<LayoutRoute><KeywordExplorer /></LayoutRoute>} />
              <Route path="/title-optimizer" element={<LayoutRoute><TitleOptimizer /></LayoutRoute>} />
              <Route path="/idea-generator" element={<LayoutRoute><IdeaGenerator /></LayoutRoute>} />
              <Route path="/competitors" element={<LayoutRoute><Competitors /></LayoutRoute>} />
              <Route path="/thumbnails" element={<LayoutRoute><Thumbnails /></LayoutRoute>} />
              <Route path="/feed" element={<LayoutRoute><CreatorFeed /></LayoutRoute>} />
              <Route path="/scripts" element={<LayoutRoute><ScriptGenerator /></LayoutRoute>} />
              <Route path="/content-gaps" element={<LayoutRoute><ContentGaps /></LayoutRoute>} />
              <Route path="/pricing" element={<LayoutRoute><Pricing /></LayoutRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
