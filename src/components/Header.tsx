import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
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
  parent_id: string | null;
  is_active?: boolean;
}

interface CategoryItem {
  id: string;
  key: string;
  label_en: string;
  label_ar: string;
  sort_order: number;
  is_active?: boolean;
}

export default function Header() {
  const { t, language, setLanguage, isRTL } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { logoUrl, brandName, logoSize, ready: brandReady } = useBranding();
  const [scrolled, setScrolled] = useState(false);
  const [pastHero, setPastHero] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);
  const [mobileProductsOpen, setMobileProductsOpen] = useState(false);
  const [pdfOpen, setPdfOpen] = useState(false);
  const [pdfSrc, setPdfSrc] = useState("");
  const [productItems, setProductItems] = useState<ProductItem[]>([]);
  const [productCategories, setProductCategories] = useState<CategoryItem[]>([]);
  const [expandedParents, setExpandedParents] = useState<Set<string>>(new Set());
  const [expandedMobileParents, setExpandedMobileParents] = useState<Set<string>>(new Set());

  // Fetch product items and categories from Supabase
  useEffect(() => {
    supabase
      .from("product_items")
      .select("*")
      .order("category_key")
      .order("sort_order")
      .then(({ data }) => {
        if (data && data.length > 0) setProductItems(data as ProductItem[]);
      });
    supabase
      .from("product_categories")
      .select("*")
      .order("sort_order")
      .then(({ data }) => {
        if (data && data.length > 0) setProductCategories(data as CategoryItem[]);
      });
  }, []);

  // Top-level items (no parent) grouped by category
  const categoriesWithItems = productCategories
    .filter((cat) => cat.is_active !== false)
    .map((cat) => ({
      key: cat.key,
      label_en: cat.label_en,
      label_ar: cat.label_ar,
      items: productItems.filter((item) => item.category_key === cat.key && !item.parent_id && item.is_active !== false),
    }))
    .filter((cat) => cat.items.length > 0);

  // Get children of a parent item
  const getChildren = (parentId: string) =>
    productItems.filter((item) => item.parent_id === parentId && item.is_active !== false);

  const hasChildren = (parentId: string) =>
    productItems.some((item) => item.parent_id === parentId);

  const toggleExpanded = (id: string) => {
    setExpandedParents((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleMobileExpanded = (id: string) => {
    setExpandedMobileParents((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

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
    { label: isAr ? "الوظائف" : "Careers", href: "/careers", isRoute: true },
    { label: t("nav.contact"), href: "#contact" },
  ];

  const scrollToSection = (href: string) => {
    setMobileOpen(false);
    setProductsOpen(false);
    if (href.startsWith("/")) {
      navigate(href);
      return;
    }
    // If on a sub-page, navigate home first
    if (location.pathname !== "/") {
      navigate("/");
      setTimeout(() => {
        const el = document.querySelector(href);
        if (el) el.scrollIntoView({ behavior: "smooth" });
      }, 300);
      return;
    }
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  const textColor = "text-foreground";
  const borderColor = "border-border";
  const hoverBg = "hover:bg-muted";

  const isAr = language === "ar";

  // Split categories into rows for mega menu
  const row1 = categoriesWithItems.slice(0, 3);
  const row2 = categoriesWithItems.slice(3);

  // Render a single item (parent or leaf) for desktop mega menu
  const renderDesktopItem = (pi: ProductItem) => {
    const children = getChildren(pi.id);
    const isExpanded = expandedParents.has(pi.id);

    if (children.length > 0) {
      return (
        <li key={pi.id}>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); toggleExpanded(pi.id); }}
            className="text-[13.5px] font-semibold text-card-foreground hover:bg-accent/25 hover:text-red-500 px-2 py-1 rounded transition-colors flex items-center gap-1 group bg-transparent border-0 cursor-pointer w-full text-start"
          >
            <ChevronRight className={`w-3 h-3 shrink-0 transition-transform ${isExpanded ? 'rotate-90' : ''} ${isRTL ? 'rotate-180' : ''}`} />
            {isAr ? pi.name_ar : pi.name_en}
          </button>
          {isExpanded && (
            <ul className="ml-4 mt-1 space-y-1 border-l-2 border-accent/20 pl-2">
              {children.map((child) => {
                const grandChildren = getChildren(child.id);
                if (grandChildren.length > 0) {
                  return renderDesktopItem(child);
                }
                return (
                  <li key={child.id}>
                    <button
                      type="button"
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleItemClick(child); }}
                      className="text-[12.5px] font-medium text-muted-foreground hover:text-red-500 hover:bg-accent/15 px-2 py-1 rounded transition-colors flex items-center gap-1 group bg-transparent border-0 cursor-pointer w-full text-start"
                    >
                      {isAr ? child.name_ar : child.name_en}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </li>
      );
    }

    return (
      <li key={pi.id}>
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); handleItemClick(pi); }}
          className="text-[13.5px] font-semibold text-card-foreground hover:bg-accent/25 hover:text-red-500 px-2 py-1 rounded transition-colors flex items-center gap-1 group bg-transparent border-0 cursor-pointer w-full text-start"
        >
          {isAr ? pi.name_ar : pi.name_en}
        </button>
      </li>
    );
  };

  // Render a single item for mobile menu
  const renderMobileItem = (pi: ProductItem) => {
    const children = getChildren(pi.id);
    const isExpanded = expandedMobileParents.has(pi.id);

    if (children.length > 0) {
      return (
        <div key={pi.id}>
          <button
            onClick={() => toggleMobileExpanded(pi.id)}
            className="w-full text-start px-4 py-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors flex items-center justify-between"
          >
            {isAr ? pi.name_ar : pi.name_en}
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </button>
          {isExpanded && (
            <div className="ml-4 border-l-2 border-accent/20 pl-2 mt-1 space-y-0.5">
              {children.map((child) => (
                <button
                  key={child.id}
                  onClick={() => handleItemClick(child)}
                  className="w-full text-start px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  {isAr ? child.name_ar : child.name_en}
                </button>
              ))}
            </div>
          )}
        </div>
      );
    }

    return (
      <button
        key={pi.id}
        onClick={() => handleItemClick(pi)}
        className="w-full text-start px-4 py-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
      >
        {isAr ? pi.name_ar : pi.name_en}
      </button>
    );
  };

  return (
    <>
      {/* Navigation Bar */}
      <header
        className={`fixed top-0 left-0 z-50 w-full bg-card transition-all duration-300 ${
          scrolled ? "shadow-md" : ""
        }`}
      >
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 md:px-6">
          {/* Logo */}
          <a href="#home" onClick={() => scrollToSection("#home")} className="flex items-center shrink-0 py-1.5">
            {brandReady && <img src={logoUrl} alt={brandName} className="w-auto object-contain" style={{ height: `${Math.round(logoSize * 0.8)}px` }} />}
          </a>

          {/* Desktop Nav - centered */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <div key={item.href} className="relative"
                onMouseEnter={() => item.hasDropdown && setProductsOpen(true)}
                onMouseLeave={() => item.hasDropdown && setProductsOpen(false)}
                onClick={() => item.hasDropdown && setProductsOpen((prev) => !prev)}
              >
                <button
                  onClick={() => scrollToSection(item.href)}
                  className={`px-3 py-1 text-[15px] font-medium ${textColor} transition-colors duration-300 flex items-center gap-1 relative after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:w-0 hover:after:w-3/4 after:h-[3px] after:bg-red-500 after:transition-all after:duration-500`}
                >
                  {item.label}
                  {item.hasDropdown && <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                {item.hasDropdown && productsOpen && categoriesWithItems.length > 0 && (
                  <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2" style={{ width: "750px" }}>
                    <div className="bg-card rounded-2xl shadow-xl border border-border p-6 animate-slide-down max-h-[70vh] overflow-y-auto mega-menu-scroll">
                      {row1.length > 0 && (
                        <div className="grid grid-cols-3 gap-x-8 gap-y-6">
                          {row1.map((cat) => (
                            <div key={cat.key}>
                              <h4 className="text-sm font-bold uppercase tracking-wider text-accent mb-3">{language === "ar" ? cat.label_ar : cat.label_en}</h4>
                              <ul className="space-y-1.5">{cat.items.map((pi) => renderDesktopItem(pi))}</ul>
                            </div>
                          ))}
                        </div>
                      )}
                      {row2.length > 0 && (
                        <div className="grid grid-cols-3 gap-x-8 mt-6">
                          {row2.map((cat) => (
                            <div key={cat.key}>
                              <h4 className="text-sm font-bold uppercase tracking-wider text-accent mb-3">{language === "ar" ? cat.label_ar : cat.label_en}</h4>
                              <ul className="space-y-1.5">{cat.items.map((pi) => renderDesktopItem(pi))}</ul>
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
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-full border border-border ${textColor} hover:bg-muted hover:border-red-500 hover:text-red-500 transition-all duration-300`}
              aria-label="Toggle theme"
            >
              {theme === "light" ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>

            <button
              onClick={() => setLanguage(language === "en" ? "ar" : "en")}
              className={`px-3 py-1.5 text-sm font-semibold rounded-full border border-border ${textColor} hover:bg-muted hover:border-red-500 hover:text-red-500 transition-all duration-300`}
            >
              {language === "en" ? "عربي" : "EN"}
            </button>

            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className={`md:hidden p-2 rounded-full ${textColor} hover:bg-muted transition-colors duration-300`}
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          <Button
            onClick={() => scrollToSection("#contact")}
            className="hidden md:inline-flex gradient-accent text-accent-foreground rounded-full px-5 text-[15px] font-semibold transition-all border-0 shrink-0"
          >
            {t("nav.contact")}
          </Button>
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
                              <h4 className="text-sm font-bold uppercase tracking-wider text-accent px-4 mb-1">
                                {language === "ar" ? cat.label_ar : cat.label_en}
                              </h4>
                              {cat.items.map((pi) => renderMobileItem(pi))}
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
