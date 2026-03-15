import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Menu, X, ChevronDown, ChevronRight, Sun, Moon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useBranding } from "@/contexts/BrandingContext";
import PdfViewerDialog from "@/components/PdfViewerDialog";
import { supabase } from "@/integrations/supabase/client";
interface ProductItem {
  id: string;
  category_key: string;
  name_en: string;
  name_ar: string;
  pdf_url: string | null;
  sort_order: number;
}

const CATEGORY_ORDER = ["cat.fire", "cat.roller", "cat.oil", "cat.hvac", "cat.loading"];

export default function Header() {
  const { t, language, setLanguage, isRTL } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const { logoUrl, brandName } = useBranding();
  const [scrolled, setScrolled] = useState(false);
  const [pastHero, setPastHero] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);
  const [mobileProductsOpen, setMobileProductsOpen] = useState(false);
  const [pdfOpen, setPdfOpen] = useState(false);
  const [pdfSrc, setPdfSrc] = useState("");
  const [productItems, setProductItems] = useState<ProductItem[]>([]);

  // Fetch product items from Supabase
  useEffect(() => {
    supabase
      .from("product_items")
      .select("*")
      .order("category_key")
      .order("sort_order")
      .then(({ data }) => {
        if (data && data.length > 0) setProductItems(data as ProductItem[]);
      });
  }, []);

  // Group items by category
  const categoriesWithItems = CATEGORY_ORDER
    .map((key) => ({
      key,
      items: productItems.filter((item) => item.category_key === key),
    }))
    .filter((cat) => cat.items.length > 0);

  const handleItemClick = (item: ProductItem) => {
    if (item.pdf_url) {
      setPdfSrc(item.pdf_url);
      setPdfOpen(true);
      setProductsOpen(false);
      setMobileOpen(false);
      setMobileProductsOpen(false);
      return;
    }
    scrollToSection("#products");
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
      setPastHero(window.scrollY > window.innerHeight - 100);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const navItems = [
    { label: t("nav.home"), href: "#home" },
    { label: t("nav.about"), href: "#about" },
    { label: t("nav.products"), href: "#products", hasDropdown: true },
    { label: t("nav.services"), href: "#services" },
    { label: t("nav.contact"), href: "#contact" },
  ];

  const scrollToSection = (href: string) => {
    setMobileOpen(false);
    setProductsOpen(false);
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  const textColor = pastHero ? "text-foreground" : "text-white";
  const borderColor = pastHero ? "border-border" : "border-white/30";
  const hoverBg = pastHero ? "hover:bg-secondary/50" : "hover:bg-white/10";

  const isAr = language === "ar";

  // Split categories into rows for mega menu
  const row1 = categoriesWithItems.slice(0, 3);
  const row2 = categoriesWithItems.slice(3);

  return (
    <>
      {/* Navigation Bar */}
      <header
        className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-6xl transition-all duration-300 rounded-xl ${
          scrolled
            ? "glass shadow-lg border border-border/50"
            : "glass shadow-md border border-border/30"
        }`}
      >
        <div className="flex items-center justify-between px-4 md:px-6 py-2.5">
          {/* Logo on the left */}
          <a href="#home" onClick={() => scrollToSection("#home")} className="flex items-center shrink-0">
            <img src={logoUrl} alt={brandName} className="h-10 w-auto object-contain" />
          </a>

          {/* Desktop Nav - centered */}
          {/* Desktop Nav - centered */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <div key={item.href} className="relative"
                onMouseEnter={() => item.hasDropdown && setProductsOpen(true)}
                onMouseLeave={() => item.hasDropdown && setProductsOpen(false)}
              >
                <button
                  onClick={() => scrollToSection(item.href)}
                  className={`px-3 py-2 text-[15px] font-medium ${textColor} transition-colors duration-300 flex items-center gap-1 relative after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:w-0 hover:after:w-3/4 after:h-[3px] after:bg-red-500 after:transition-all after:duration-500`}
                >
                  {item.label}
                  {item.hasDropdown && <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                {/* Mega Menu Dropdown */}
                {item.hasDropdown && productsOpen && categoriesWithItems.length > 0 && (
                  <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2" style={{ width: "750px" }}>
                    <div className="bg-card rounded-2xl shadow-xl border border-border p-6 animate-slide-down">
                      {row1.length > 0 && (
                        <div className="grid grid-cols-3 gap-x-8 gap-y-6">
                          {row1.map((cat) => (
                            <div key={cat.key}>
                              <h4 className="text-xs font-bold uppercase tracking-wider text-accent mb-3">
                                {t(cat.key)}
                              </h4>
                              <ul className="space-y-1.5">
                                {cat.items.map((pi) => (
                                  <li key={pi.id}>
                                    <button
                                      type="button"
                                      onClick={(e) => { e.preventDefault(); handleItemClick(pi); }}
                                      className="text-sm text-muted-foreground hover:text-red-500 transition-colors flex items-center gap-1 group bg-transparent border-0 cursor-pointer"
                                    >
                                      <ChevronRight className={`w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity ${isRTL ? 'rotate-180' : ''}`} />
                                      {isAr ? pi.name_ar : pi.name_en}
                                    </button>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      )}
                      {row2.length > 0 && (
                        <div className="grid grid-cols-3 gap-x-8 mt-6">
                          {row2.map((cat) => (
                            <div key={cat.key}>
                              <h4 className="text-xs font-bold uppercase tracking-wider text-accent mb-3">
                                {t(cat.key)}
                              </h4>
                              <ul className="space-y-1.5">
                                {cat.items.map((pi) => (
                                  <li key={pi.id}>
                                    <button
                                      type="button"
                                      onClick={(e) => { e.preventDefault(); handleItemClick(pi); }}
                                      className="text-sm text-muted-foreground hover:text-red-500 transition-colors flex items-center gap-1 group bg-transparent border-0 cursor-pointer"
                                    >
                                      <ChevronRight className={`w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity ${isRTL ? 'rotate-180' : ''}`} />
                                      {isAr ? pi.name_ar : pi.name_en}
                                    </button>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-full border ${borderColor} ${textColor} ${hoverBg} transition-colors duration-300`}
              aria-label="Toggle theme"
            >
              {theme === "light" ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>

            <button
              onClick={() => setLanguage(language === "en" ? "ar" : "en")}
              className={`px-3 py-1.5 text-sm font-semibold rounded-full border ${borderColor} ${textColor} ${hoverBg} transition-colors duration-300`}
            >
              {language === "en" ? "عربي" : "EN"}
            </button>

            <Button
              onClick={() => scrollToSection("#contact")}
              className="hidden md:inline-flex gradient-accent text-accent-foreground rounded-full px-5 text-[15px] font-semibold transition-all border-0"
            >
              {t("nav.contact")}
            </Button>

            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className={`md:hidden p-2 rounded-full ${textColor} ${hoverBg} transition-colors duration-300`}
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className={`absolute top-0 ${isRTL ? 'left-0' : 'right-0'} h-full w-80 bg-card shadow-xl p-6 pt-20 overflow-y-auto animate-slide-down`}>
            <nav className="space-y-2">
              {navItems.map((item) => (
                <div key={item.href}>
                  {item.hasDropdown ? (
                    <>
                      <button
                        onClick={() => setMobileProductsOpen(!mobileProductsOpen)}
                        className="w-full flex items-center justify-between px-4 py-3 text-base font-medium rounded-xl hover:bg-secondary transition-colors"
                      >
                        {item.label}
                        <ChevronDown className={`w-4 h-4 transition-transform ${mobileProductsOpen ? 'rotate-180' : ''}`} />
                      </button>
                      {mobileProductsOpen && (
                        <div className="ml-4 mt-1 space-y-3 pb-2">
                          {categoriesWithItems.map((cat) => (
                            <div key={cat.key}>
                              <h4 className="text-xs font-bold uppercase tracking-wider text-accent px-4 mb-1">
                                {t(cat.key)}
                              </h4>
                              {cat.items.map((pi) => (
                                <button
                                  key={pi.id}
                                  onClick={() => handleItemClick(pi)}
                                  className="w-full text-start px-4 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                                >
                                  {isAr ? pi.name_ar : pi.name_en}
                                </button>
                              ))}
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <button
                      onClick={() => scrollToSection(item.href)}
                      className="w-full text-start px-4 py-3 text-base font-medium rounded-xl hover:bg-secondary transition-colors"
                    >
                      {item.label}
                    </button>
                  )}
                </div>
              ))}
            </nav>
            <Button
              onClick={() => scrollToSection("#contact")}
              className="w-full mt-6 gradient-accent text-accent-foreground rounded-full font-semibold border-0"
            >
              {t("nav.contact")}
            </Button>
          </div>
        </div>
      )}

      <PdfViewerDialog open={pdfOpen} onOpenChange={setPdfOpen} src={pdfSrc} />
    </>
  );
}
