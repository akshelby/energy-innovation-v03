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
import CookieConsent from "@/components/CookieConsent";

const NotFound = lazy(() => import("./pages/NotFound.tsx"));
const Careers = lazy(() => import("./pages/Careers.tsx"));
const ProductPageView = lazy(() => import("./pages/ProductPage.tsx"));
const SubProductsPage = lazy(() => import("./pages/SubProductsPage.tsx"));
const Admin = lazy(() => import("./pages/Admin.tsx"));

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
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
              <Route path="/index" element={<Index />} />
              <Route path="/careers" element={<Suspense fallback={null}><Careers /></Suspense>} />
              <Route path="/products/:productId" element={<Suspense fallback={null}><SubProductsPage /></Suspense>} />
              <Route path="/products/item/:itemId" element={<Suspense fallback={null}><SubProductsPage /></Suspense>} />
              <Route path="/product/:id" element={<Suspense fallback={null}><ProductPageView /></Suspense>} />
              <Route path="/admin" element={<Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading…</div>}><Admin /></Suspense>} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<Suspense fallback={null}><NotFound /></Suspense>} />
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
