import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { BrandingProvider } from "@/contexts/BrandingContext";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import Careers from "./pages/Careers.tsx";
import ProductPageView from "./pages/ProductPage.tsx";
import SubProductsPage from "./pages/SubProductsPage.tsx";
import CookieConsent from "@/components/CookieConsent";

const Admin = lazy(() => import("./pages/Admin.tsx"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ThemeProvider>
        <LanguageProvider>
          <BrandingProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/careers" element={<Careers />} />
              <Route path="/products/:productId" element={<SubProductsPage />} />
              <Route path="/product/:id" element={<ProductPageView />} />
              <Route path="/admin" element={<Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading…</div>}><Admin /></Suspense>} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
          <CookieConsent />
          </BrandingProvider>
        </LanguageProvider>
      </ThemeProvider>
    </TooltipProvider>
  </QueryClientProvider>
  </HelmetProvider>
);

export default App;
