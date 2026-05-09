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
  // Desktop cascading mega-menu path: [categoryKey, itemId, itemId, ...]
  const [desktopPath, setDesktopPath] = useState<string[]>([]);

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

  // Reset cascading path whenever desktop dropdown closes
  useEffect(() => {
    if (!productsOpen) setDesktopPath([]);
  }, [productsOpen]);

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
                  // Build cascading columns based on desktopPath
                  type Col = { key: string; title?: string; entries: { id: string; label: string; hasNext: boolean; onClick: () => void; selected: boolean }[] };
                  const cols: Col[] = [];

                  // Column 0: categories
                  cols.push({
                    key: "__cats__",
                    title: isAr ? "التصنيفات" : "Categories",
                    entries: categoriesWithItems.map((cat) => ({
                      id: cat.key,
                      label: isAr ? cat.label_ar : cat.label_en,
                      hasNext: cat.items.length > 0,
                      selected: desktopPath[0] === cat.key,
                      onClick: () => setDesktopPath([cat.key]),
                    })),
                  });

                  // Subsequent columns
                  for (let depth = 0; depth < desktopPath.length; depth++) {
                    const id = desktopPath[depth];
                    let entryItems: ProductItem[] = [];
                    let title = "";
                    if (depth === 0) {
                      const cat = categoriesWithItems.find((c) => c.key === id);
                      if (!cat) break;
                      entryItems = cat.items;
                      title = isAr ? cat.label_ar : cat.label_en;
                    } else {
                      const parent = productItems.find((p) => p.id === id);
                      if (!parent) break;
                      entryItems = getChildren(id);
                      title = isAr ? parent.name_ar : parent.name_en;
                    }
                    if (entryItems.length === 0) break;
                    const nextDepth = depth + 1;
                    cols.push({
                      key: id,
                      title,
                      entries: entryItems.map((pi) => {
                        const childCount = getChildren(pi.id).length;
                        const openNext = () => {
                          if (childCount > 0) {
                            setDesktopPath((prev) => {
                              const base = prev.slice(0, nextDepth);
                              if (prev[nextDepth] === pi.id) return prev;
                              return [...base, pi.id];
                            });
                          } else {
                            // Trim deeper columns when hovering a leaf
                            setDesktopPath((prev) => prev.slice(0, nextDepth));
                          }
                        };
                        return {
                          id: pi.id,
                          label: isAr ? pi.name_ar : pi.name_en,
                          hasNext: childCount > 0,
                          selected: desktopPath[nextDepth] === pi.id,
                          onHover: openNext,
                          onClick: () => {
                            if (childCount > 0) openNext();
                            else handleItemClick(pi);
                          },
                        };
                      }),
                    });
                  }

                  const colWidth = 240;
                  const totalWidth = Math.min(cols.length, 4) * colWidth + 24;

                  return (
                    <div className="absolute top-full left-1/2 -translate-x-1/2 pt-3" style={{ width: `${totalWidth}px` }}>
                      <div className="relative rounded-[24px] p-[1.5px] bg-[conic-gradient(from_120deg_at_50%_50%,#2BD8FF_0%,#A14BFF_25%,#FF4FCB_50%,#FF6A3D_75%,#2BD8FF_100%)] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.35)] animate-fade-in">
                        <div className="relative bg-card/95 backdrop-blur-2xl rounded-[22px] p-2">
                          <div className="flex items-center justify-between px-3 pt-2 pb-2">
                            <span className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">
                              <span className="block w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                              Browse Catalog
                            </span>
                            <span className="text-[10px] font-bold text-muted-foreground/70">
                              {categoriesWithItems.length} categories
                            </span>
                          </div>
                          <div className="flex overflow-x-auto mega-menu-scroll" style={{ maxHeight: "70vh" }}>
                            {cols.map((col, ci) => (
                              <div
                                key={col.key + ci}
                                className={`shrink-0 ${ci > 0 ? 'border-s border-border/60' : ''}`}
                                style={{ width: `${colWidth}px` }}
                              >
                                {col.title && (
                                  <div className="px-3 pt-1 pb-2 text-[10px] font-black uppercase tracking-[0.14em] text-muted-foreground/80 truncate">
                                    {col.title}
                                  </div>
                                )}
                                <ul className="px-1.5 pb-2 space-y-0.5 overflow-y-auto" style={{ maxHeight: "60vh" }}>
                                  {col.entries.map((entry) => (
                                    <li key={entry.id}>
                                      <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); entry.onClick(); }}
                                        className={`group w-full flex items-center justify-between gap-2 text-[13px] font-semibold px-2.5 py-2 rounded-md transition-all border-0 cursor-pointer text-start ${entry.selected ? 'bg-red-500/15 text-red-500' : 'text-card-foreground hover:text-red-500 hover:bg-red-500/10'}`}
                                      >
                                        <span className="flex-1 truncate">{entry.label}</span>
                                        {entry.hasNext && (
                                          <ChevronRight className={`w-3.5 h-3.5 shrink-0 ${entry.selected ? 'text-red-500' : 'text-muted-foreground group-hover:text-red-500'} ${isRTL ? 'rotate-180' : ''}`} />
                                        )}
                                      </button>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            ))}
                          </div>
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
