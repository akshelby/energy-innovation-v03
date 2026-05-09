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
  has_page?: boolean;
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
  const { logoUrl, brandName, logoSize } = useBranding();
  const [scrolled, setScrolled] = useState(false);
  const [pastHero, setPastHero] = useState(false);
  const [headerVisible, setHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);
  const [mobileProductsOpen, setMobileProductsOpen] = useState(false);
  const [pdfOpen, setPdfOpen] = useState(false);
  const [pdfSrc, setPdfSrc] = useState("");
  const [productItems, setProductItems] = useState<ProductItem[]>([]);
  const [productCategories, setProductCategories] = useState<CategoryItem[]>([]);
  const [expandedParents, setExpandedParents] = useState<Set<string>>(new Set());
  const [expandedMobileParents, setExpandedMobileParents] = useState<Set<string>>(new Set());
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [expandedMobileCategories, setExpandedMobileCategories] = useState<Set<string>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedItemPath, setSelectedItemPath] = useState<string[]>([]);

  // Reset flyout when menu closes
  useEffect(() => {
    if (!productsOpen) {
      setSelectedCategory(null);
      setSelectedItemPath([]);
    }
  }, [productsOpen]);

  const toggleCategory = (key: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };
  const toggleMobileCategory = (key: string) => {
    setExpandedMobileCategories((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };
  const [mobileLogoSize, setMobileLogoSize] = useState<number>(() => {
    try { return parseInt(localStorage.getItem("ei_mobile_logo_size") || "") || 40; } catch { return 40; }
  });
  const [isMobile, setIsMobile] = useState<boolean>(() => typeof window !== "undefined" && window.innerWidth < 768);

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
    supabase
      .from("site_content")
      .select("content_key, value_en")
      .eq("content_key", "header.mobile_logo_size")
      .then(({ data }) => {
        const entry = data?.[0];
        if (entry?.value_en) {
          const size = parseInt(entry.value_en) || 40;
          setMobileLogoSize(size);
          try { localStorage.setItem("ei_mobile_logo_size", String(size)); } catch {}
        }
      });
  }, []);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
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
    productItems.some((item) => item.parent_id === parentId && item.is_active !== false);

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
    // Check children in memory instead of relying on stale has_page flag.
    // If it's a leaf (no children), go to detail page.
    const itemHasChildren = productItems.some((p) => p.parent_id === item.id);
    if (!itemHasChildren) {
      setProductsOpen(false);
      setMobileOpen(false);
      setMobileProductsOpen(false);
      navigate(`/product/${item.id}`);
      return;
    }
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
      const currentScrollY = window.scrollY;
      setScrolled(currentScrollY > 50);
      setPastHero(currentScrollY > window.innerHeight - 100);
      
      if (currentScrollY < 50) {
        setHeaderVisible(true);
      } else if (currentScrollY < lastScrollY) {
        setHeaderVisible(true);
      } else if (currentScrollY > lastScrollY) {
        setHeaderVisible(false);
      }
      setLastScrollY(currentScrollY);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

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
    { label: language === "ar" ? "الوظائف" : "Careers", href: "/careers", isRoute: true },
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

  // (categories rendered progressively on click)

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
            className={`group w-full flex items-center gap-2 text-[13px] font-semibold hover:text-red-500 hover:bg-red-500/10 active:bg-red-500/20 px-2.5 py-1.5 rounded-md transition-all border-0 cursor-pointer text-start ${isExpanded ? 'bg-red-500/10 text-red-500' : 'bg-transparent text-card-foreground'}`}
          >
            <ChevronRight className={`w-3 h-3 shrink-0 group-hover:text-red-500 transition-transform duration-300 ${isExpanded ? 'rotate-90 text-red-500' : 'text-muted-foreground'} ${isRTL ? 'rotate-180' : ''}`} />
            <span className="flex-1">{isAr ? pi.name_ar : pi.name_en}</span>
          </button>
          {isExpanded && (
            <ul className="ml-3 mt-0.5 pl-3 border-l border-accent/15 space-y-0.5 animate-fade-in">
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
                      className="group w-full flex items-center gap-2 text-[12.5px] font-medium text-muted-foreground hover:text-red-500 hover:bg-red-500/10 active:bg-red-500/20 px-2.5 py-1.5 rounded-md transition-all bg-transparent border-0 cursor-pointer text-start"
                    >
                      <span className="block w-1 h-1 rounded-full bg-muted-foreground/40 group-hover:bg-red-500 transition-colors" />
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
          className="group w-full flex items-center gap-2 text-[13px] font-semibold text-card-foreground hover:text-red-500 hover:bg-red-500/10 active:bg-red-500/20 px-2.5 py-1.5 rounded-md transition-all bg-transparent border-0 cursor-pointer text-start"
        >
          <span className="block w-1 h-1 rounded-full bg-accent/50 group-hover:bg-red-500 transition-colors" />
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
            className={`w-full text-start px-4 py-1.5 text-sm font-semibold hover:text-red-500 hover:bg-red-500/10 active:bg-red-500/20 rounded-md transition-colors flex items-center justify-between ${isExpanded ? 'bg-red-500/10 text-red-500' : 'text-muted-foreground'}`}
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
                  className="w-full text-start px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-red-500 hover:bg-red-500/10 active:bg-red-500/20 rounded-md transition-colors"
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
        className="w-full text-start px-4 py-1.5 text-sm font-semibold text-muted-foreground hover:text-red-500 hover:bg-red-500/10 active:bg-red-500/20 rounded-md transition-colors"
      >
        {isAr ? pi.name_ar : pi.name_en}
      </button>
    );
  };

  return (
    <>
      {/* Navigation Bar */}
      <header
        data-theme-scope="light"
        className={`light fixed top-0 left-0 z-50 w-full bg-card transition-all duration-300 ${
          scrolled ? "shadow-md" : ""
        } ${headerVisible ? "translate-y-0" : "-translate-y-full"}`}
      >
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-2 md:px-6">
          {/* Logo */}
          <a href="#home" onClick={() => scrollToSection("#home")} className="flex items-center shrink-0">
            <img src={logoUrl} alt={brandName} className="w-auto object-contain" style={{ height: `${isMobile ? mobileLogoSize : Math.round(logoSize * 0.8)}px` }} loading="eager" fetchPriority="high" decoding="sync" />
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
                  className={`px-3 py-1 text-[15px] font-bold ${textColor} transition-colors duration-300 flex items-center gap-1 relative after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:w-0 hover:after:w-3/4 after:h-[3px] after:bg-red-500 after:transition-all after:duration-500`}
                >
                  {item.label}
                  {item.hasDropdown && <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                {item.hasDropdown && productsOpen && categoriesWithItems.length > 0 && (() => {
                  // Build columns dynamically based on selection
                  const columns: Array<{ title: string; items: ProductItem[]; depth: number; activeId?: string | null }> = [];
                  if (selectedCategory) {
                    const cat = categoriesWithItems.find((c) => c.key === selectedCategory);
                    if (cat) {
                      columns.push({
                        title: language === "ar" ? cat.label_ar : cat.label_en,
                        items: cat.items,
                        depth: 0,
                        activeId: selectedItemPath[0] ?? null,
                      });
                      for (let i = 0; i < selectedItemPath.length; i++) {
                        const parent = productItems.find((p) => p.id === selectedItemPath[i]);
                        const children = getChildren(selectedItemPath[i]);
                        if (children.length === 0) break;
                        columns.push({
                          title: parent ? (isAr ? parent.name_ar : parent.name_en) : "",
                          items: children,
                          depth: i + 1,
                          activeId: selectedItemPath[i + 1] ?? null,
                        });
                      }
                    }
                  }
                  const CAT_W = 300;
                  const COL_W = 280;
                  const totalWidth = CAT_W + columns.length * COL_W;
                  return (
                    <div className="absolute top-full left-1/2 -translate-x-1/2 pt-3" style={{ width: `${totalWidth}px`, maxWidth: '95vw' }}>
                      <div className="relative rounded-[24px] p-[1.5px] bg-[conic-gradient(from_120deg_at_50%_50%,#2BD8FF_0%,#A14BFF_25%,#FF4FCB_50%,#FF6A3D_75%,#2BD8FF_100%)] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.35)] animate-fade-in">
                        <div className="relative bg-card/95 backdrop-blur-2xl rounded-[22px] p-3 max-h-[75vh] overflow-hidden flex gap-2">
                          {/* Column 0: Categories */}
                          <div className="shrink-0 overflow-y-auto mega-menu-scroll pr-1" style={{ width: `${CAT_W}px` }}>
                            <div className="flex items-center justify-between px-2 pb-2 mb-1">
                              <span className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">
                                <span className="block w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                                Browse Catalog
                              </span>
                              <span className="text-[10px] font-bold text-muted-foreground/70">{categoriesWithItems.length}</span>
                            </div>
                            <ul className="space-y-1">
                              {categoriesWithItems.map((cat, idx) => {
                                const isActive = selectedCategory === cat.key;
                                const num = String(idx + 1).padStart(2, "0");
                                return (
                                  <li key={cat.key}>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedCategory(cat.key);
                                        setSelectedItemPath([]);
                                      }}
                                      className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl transition-all text-start ${isActive ? 'bg-gradient-to-br from-accent/10 via-card to-card ring-1 ring-accent/20' : 'hover:bg-red-500/5 hover:ring-1 hover:ring-red-500/20'}`}
                                    >
                                      <span className="flex items-start gap-2.5 min-w-0 flex-1">
                                        <span className={`shrink-0 inline-flex items-center justify-center w-7 h-7 rounded-lg text-[10px] font-black tabular-nums ${isActive ? 'bg-gradient-to-br from-red-500 to-accent text-white shadow-md shadow-red-500/30' : 'bg-muted text-muted-foreground'}`}>{num}</span>
                                        <span className={`text-[12px] font-bold uppercase tracking-wide leading-tight break-words text-start ${isActive ? 'text-foreground' : 'text-card-foreground'}`}>{language === "ar" ? cat.label_ar : cat.label_en}</span>
                                      </span>
                                      <ChevronRight className={`w-4 h-4 shrink-0 mt-1 transition-colors ${isActive ? 'text-red-500' : 'text-muted-foreground'} ${isRTL ? 'rotate-180' : ''}`} />
                                    </button>
                                  </li>
                                );
                              })}
                            </ul>
                          </div>

                          {/* Sub columns */}
                          {columns.map((col, colIdx) => (
                            <div key={colIdx} className="shrink-0 overflow-y-auto mega-menu-scroll border-l border-accent/15 pl-2 animate-fade-in" style={{ width: `${COL_W}px` }}>
                              <div className="px-2 pb-2 mb-1">
                                <span className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground leading-tight break-words block">{col.title}</span>
                              </div>
                              <ul className="space-y-0.5">
                                {col.items.map((pi) => {
                                  const children = getChildren(pi.id);
                                  const hasKids = children.length > 0 || hasChildren(pi.id);
                                  const isActive = col.activeId === pi.id;
                                  return (
                                    <li key={pi.id}>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (hasKids) {
                                            setSelectedItemPath((prev) => [...prev.slice(0, colIdx), pi.id]);
                                          } else {
                                            handleItemClick(pi);
                                          }
                                        }}
                                        className={`group w-full flex items-start justify-between gap-2 text-[12.5px] font-semibold px-2.5 py-2 rounded-md transition-all text-start ${isActive ? 'bg-red-500/10 text-red-500' : 'text-card-foreground hover:text-red-500 hover:bg-red-500/10'}`}
                                      >
                                        <span className="flex items-start gap-2 min-w-0 flex-1">
                                          <span className={`block w-1 h-1 rounded-full shrink-0 mt-2 ${isActive ? 'bg-red-500' : 'bg-accent/50 group-hover:bg-red-500'}`} />
                                          <span className="leading-snug break-words text-start">{isAr ? pi.name_ar : pi.name_en}</span>
                                        </span>
                                        <ChevronRight className={`w-4 h-4 shrink-0 mt-0.5 transition-transform ${hasKids ? 'opacity-100' : 'opacity-40'} ${isActive ? 'text-red-500' : 'text-accent group-hover:text-red-500 group-hover:translate-x-0.5'} ${isRTL ? 'rotate-180' : ''}`} />
                                      </button>
                                    </li>
                                  );
                                })}
                              </ul>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })()}
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

            <Button
              onClick={() => scrollToSection("#contact")}
              className="hidden md:inline-flex rounded-full px-5 text-[15px] font-semibold border-0 shrink-0 text-white bg-[linear-gradient(90deg,#2BD8FF_0%,#A14BFF_25%,#FF4FCB_50%,#FF6A3D_75%,#2BD8FF_100%)] bg-[length:200%_100%] bg-left hover:bg-right transition-all duration-700 shadow-lg"
            >
              {t("nav.contact")}
            </Button>

            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className={`md:hidden p-2 rounded-full ${textColor} hover:bg-muted transition-colors duration-300`}
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
                        <div className="ml-2 mt-1 space-y-1 pb-2">
                          {categoriesWithItems.map((cat) => {
                            const isOpen = expandedMobileCategories.has(cat.key);
                            return (
                              <div key={cat.key}>
                                <button
                                  onClick={() => toggleMobileCategory(cat.key)}
                                  className="w-full flex items-center justify-between px-4 py-2 text-sm font-bold uppercase tracking-wider text-accent hover:bg-accent/10 rounded-lg transition-colors text-start"
                                >
                                  <span>{language === "ar" ? cat.label_ar : cat.label_en}</span>
                                  <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                                </button>
                                {isOpen && (
                                  <div className="ml-2 pl-2 border-l-2 border-accent/20 mt-1">
                                    {cat.items.map((pi) => renderMobileItem(pi))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
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
              className="w-full mt-6 rounded-full font-semibold border-0 text-white bg-[linear-gradient(90deg,#2BD8FF_0%,#A14BFF_25%,#FF4FCB_50%,#FF6A3D_75%,#2BD8FF_100%)] bg-[length:200%_100%] bg-left hover:bg-right transition-all duration-700 shadow-lg"
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
