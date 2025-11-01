import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import WidgetDemo from "./pages/WidgetDemo";
import WidgetEmbed from "./pages/WidgetEmbed";
import Documentation from "./pages/Documentation";
import NewDocumentation from "./pages/NewDocumentation";
import FeaturesList from "./pages/FeaturesList";
import FeaturesTestingCenter from "./pages/FeaturesTestingCenter";
import Pricing from "./pages/Pricing";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/widget/:businessId" element={<WidgetDemo />} />
          <Route path="/embed/:businessId" element={<WidgetEmbed />} />
          <Route path="/docs" element={<NewDocumentation />} />
          <Route path="/docs-old" element={<Documentation />} />
          <Route path="/features" element={<FeaturesList />} />
          <Route path="/features-testing" element={<FeaturesTestingCenter />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
