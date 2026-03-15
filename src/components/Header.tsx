import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Menu, X, ChevronDown, ChevronRight, Leaf, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";

const productCategories = [
  {
    key: "cat.fire",
    items: ["item.fireCurtains", "item.smokeCurtains"],
  },
  {
    key: "cat.roller",
    items: ["item.industrial", "item.residential", "item.garage", "item.highSpeed", "item.steel", "item.louvers"],
  },
  {
    key: "cat.oil",
    items: ["item.well", "item.sensors", "item.spare"],
  },
  {
    key: "cat.hvac",
    items: ["item.ventilators", "item.exhaust", "item.vav", "item.dampers"],
  },
  {
    key: "cat.loading",
    items: ["item.dockLevelers", "item.dockShelters"],
  },
];

export default function Header() {
  const { t, language, setLanguage, isRTL } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);
  const [mobileProductsOpen, setMobileProductsOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
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

  return (
    <>
      <header
        className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-6xl transition-all duration-300 rounded-xl ${
          scrolled
            ? "glass shadow-lg border border-border/50"
            : "glass shadow-md border border-border/30"
        }`}
      >
        <div className="flex items-center justify-between px-4 md:px-6 py-3">
          {/* Logo */}
          <a href="#home" onClick={() => scrollToSection("#home")} className="flex items-center gap-2 shrink-0">
            <div className="w-9 h-9 rounded-full gradient-accent flex items-center justify-center">
              <Leaf className="w-5 h-5 text-accent-foreground" />
            </div>
            <span className="text-xl font-bold text-white drop-shadow-md">
              Mivora<span className="text-xs align-super text-white/70">™</span>
            </span>
          </a>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <div key={item.href} className="relative"
                onMouseEnter={() => item.hasDropdown && setProductsOpen(true)}
                onMouseLeave={() => item.hasDropdown && setProductsOpen(false)}
              >
                <button
                  onClick={() => scrollToSection(item.href)}
                  className="px-3 py-2 text-[15px] font-medium text-white drop-shadow-md hover:text-accent transition-colors rounded-full hover:bg-white/10 flex items-center gap-1"
                >
                  {item.label}
                  {item.hasDropdown && <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                {/* Mega Menu Dropdown */}
                {item.hasDropdown && productsOpen && (
                  <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2" style={{ width: "680px" }}>
                    <div className="bg-card rounded-2xl shadow-xl border border-border p-6 animate-slide-down">
                      <div className="grid grid-cols-3 gap-6">
                        {productCategories.map((cat) => (
                          <div key={cat.key}>
                            <h4 className="text-xs font-bold uppercase tracking-wider text-accent mb-3">
                              {t(cat.key)}
                            </h4>
                            <ul className="space-y-1.5">
                              {cat.items.map((itemKey) => (
                                <li key={itemKey}>
                                  <a
                                    href="#products"
                                    onClick={(e) => { e.preventDefault(); scrollToSection("#products"); }}
                                    className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 group"
                                  >
                                    <ChevronRight className={`w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity ${isRTL ? 'rotate-180' : ''}`} />
                                    {t(itemKey)}
                                  </a>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-1.5">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full border border-white/30 text-white hover:bg-white/10 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === "light" ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>

            {/* Language Toggle */}
            <button
              onClick={() => setLanguage(language === "en" ? "ar" : "en")}
              className="px-3 py-1.5 text-sm font-semibold rounded-full border border-white/30 text-white hover:bg-white/10 transition-colors"
            >
              {language === "en" ? "عربي" : "EN"}
            </button>

            {/* Contact Button - Desktop */}
            <Button
              onClick={() => scrollToSection("#contact")}
              className="hidden md:inline-flex gradient-accent text-accent-foreground rounded-full px-5 text-[15px] font-semibold hover:opacity-90 transition-opacity border-0"
            >
              {t("nav.contact")}
            </Button>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-full text-white hover:bg-white/10 transition-colors"
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
                          {productCategories.map((cat) => (
                            <div key={cat.key}>
                              <h4 className="text-xs font-bold uppercase tracking-wider text-accent px-4 mb-1">
                                {t(cat.key)}
                              </h4>
                              {cat.items.map((itemKey) => (
                                <button
                                  key={itemKey}
                                  onClick={() => scrollToSection("#products")}
                                  className="w-full text-start px-4 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                                >
                                  {t(itemKey)}
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
    </>
  );
}
