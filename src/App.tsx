import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect, Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { HelmetProvider } from "react-helmet-async";
import { Loader2 } from "lucide-react";

// Lazy load all pages to drastically reduce the initial bundle size (Core Web Vitals SEO optimization)
const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const WidgetDemo = lazy(() => import("./pages/WidgetDemo"));
const WidgetEmbed = lazy(() => import("./pages/WidgetEmbed"));
const Documentation = lazy(() => import("./pages/Documentation"));
const NewDocumentation = lazy(() => import("./pages/NewDocumentation"));
const Pricing = lazy(() => import("./pages/Pricing"));
const Billing = lazy(() => import("./pages/Billing"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const AcceptInvite = lazy(() => import("./pages/AcceptInvite"));
const Profile = lazy(() => import("./pages/Profile"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const DataDeletion = lazy(() => import("./pages/DataDeletion"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Launch = lazy(() => import("./pages/Launch"));
const Admin = lazy(() => import("./pages/Admin"));

const AuthListener = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        navigate("/reset-password");
      } else if (session && (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "INITIAL_SESSION")) {
        const currentPath = window.location.pathname;
        const hasAuthParams = window.location.hash.includes("access_token") || window.location.search.includes("code");
        if (currentPath === "/" || currentPath === "/auth" || hasAuthParams) {
          navigate("/onboarding");
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  return null;
};

// Global loading fallback for lazy loaded routes
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes cache
      gcTime: 15 * 60 * 1000, // 15 minutes garbage collection
      refetchOnWindowFocus: false,
      retry: (failureCount, error: any) => {
        if (error?.status === 429) return false;
        return failureCount < 2;
      },
    },
  },
});

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthListener />
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/launch" element={<Launch />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/accept-invite" element={<AcceptInvite />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/billing" element={<Billing />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/widget-demo/:businessId" element={<WidgetDemo />} />
            <Route path="/widget/:businessId" element={<WidgetEmbed />} />
            <Route path="/embed/:businessId" element={<WidgetEmbed />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:id" element={<BlogPost />} />
            <Route path="/docs" element={<NewDocumentation />} />
            <Route path="/docs-old" element={<Documentation />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<TermsOfService />} />
            <Route path="/delete" element={<DataDeletion />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/admin" element={<Admin />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  </HelmetProvider>
);

export default App;
