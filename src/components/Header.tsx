import { useState } from "react";
import { Menu, X, ChevronDown, ChevronRight, Leaf, Globe } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { megaMenuCategories } from "@/data/megaMenuData";

const Header = () => {
  const { t, toggleLanguage, language, direction } = useLanguage();
  const [isMegaOpen, setIsMegaOpen] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [openAccordion, setOpenAccordion] = useState<string | null>(null);

  const navLinks = [
    { key: "home", href: "#" },
    { key: "about", href: "#about" },
    { key: "caseStudies", href: "#cases" },
    { key: "blog", href: "#blog" },
  ];

  return (
    <header className="fixed top-4 inset-x-4 md:inset-x-8 z-50">
      <nav className="glassmorphism rounded-pill px-4 md:px-6 py-3 flex items-center justify-between shadow-lg">
        {/* Logo */}
        <a href="#" className="flex items-center gap-2 shrink-0">
          <Leaf className="h-6 w-6 text-eco" />
          <span className="text-xl font-bold tracking-tight text-foreground">
            Mivora<sup className="text-xs font-normal">™</sup>
          </span>
        </a>

        {/* Desktop Nav */}
        <div className="hidden lg:flex items-center gap-1">
          {navLinks.slice(0, 1).map((link) => (
            <a
              key={link.key}
              href={link.href}
              className="px-4 py-2 text-sm font-medium text-foreground/80 hover:text-foreground transition-colors"
            >
              {t(link.key)}
            </a>
          ))}

          {/* Products Dropdown Trigger */}
          <div
            className="relative"
            onMouseEnter={() => setIsMegaOpen(true)}
            onMouseLeave={() => setIsMegaOpen(false)}
          >
            <button className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-foreground/80 hover:text-foreground transition-colors">
              {t("products")}
              <ChevronDown
                className={`h-4 w-4 transition-transform duration-200 ${isMegaOpen ? "rotate-180" : ""}`}
              />
            </button>

            {/* Mega Menu Dropdown */}
            {isMegaOpen && (
              <div
                className={`absolute top-full ${direction === "rtl" ? "right-0" : "left-0"} mt-2 w-[700px] bg-card rounded-lg shadow-2xl border border-border p-6 grid grid-cols-2 gap-6 animate-fade-in`}
              >
                {megaMenuCategories.map((cat) => (
                  <div key={cat.titleKey}>
                    <h3 className="text-sm font-bold text-foreground mb-2">
                      {t(cat.titleKey)}
                    </h3>
                    <ul className="space-y-1">
                      {cat.items.map((item) => (
                        <li key={item.titleKey}>
                          <a
                            href="#"
                            className="group flex flex-col px-3 py-2 rounded-md hover:bg-muted transition-colors"
                          >
                            <span className="text-sm font-medium text-foreground/90 group-hover:text-foreground">
                              {t(item.titleKey)}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {t(item.descKey)}
                            </span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>

          {navLinks.slice(1).map((link) => (
            <a
              key={link.key}
              href={link.href}
              className="px-4 py-2 text-sm font-medium text-foreground/80 hover:text-foreground transition-colors"
            >
              {t(link.key)}
            </a>
          ))}
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-pill text-xs font-medium text-foreground/70 hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Toggle language"
          >
            <Globe className="h-4 w-4" />
            {language === "en" ? "عربي" : "EN"}
          </button>

          <a
            href="#contact"
            className="hidden md:inline-flex items-center px-6 py-2.5 rounded-pill bg-gradient-eco text-secondary-foreground text-sm font-semibold shimmer hover:scale-105 transition-transform shadow-md"
          >
            {t("contactUs")}
          </a>

          <button
            className="lg:hidden p-2 text-foreground"
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            aria-label="Toggle menu"
          >
            {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <>
          <div
            className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40 animate-fade-in"
            onClick={() => setIsMobileOpen(false)}
          />
          <div
            className={`fixed top-0 ${direction === "rtl" ? "left-0" : "right-0"} h-full w-80 bg-card shadow-2xl z-50 overflow-y-auto animate-slide-in-right`}
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-8">
                <span className="text-lg font-bold text-foreground">Mivora™</span>
                <button onClick={() => setIsMobileOpen(false)} aria-label="Close menu">
                  <X className="h-5 w-5 text-foreground" />
                </button>
              </div>

              <div className="space-y-1">
                {navLinks.slice(0, 1).map((link) => (
                  <a
                    key={link.key}
                    href={link.href}
                    className="block px-4 py-3 text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                    onClick={() => setIsMobileOpen(false)}
                  >
                    {t(link.key)}
                  </a>
                ))}

                {/* Products Accordion */}
                <div>
                  <button
                    onClick={() =>
                      setOpenAccordion(openAccordion === "products" ? null : "products")
                    }
                    className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                  >
                    {t("products")}
                    <ChevronDown
                      className={`h-4 w-4 transition-transform duration-200 ${
                        openAccordion === "products" ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {openAccordion === "products" && (
                    <div className="ps-4 space-y-2 py-2 animate-fade-in">
                      {megaMenuCategories.map((cat) => (
                        <div key={cat.titleKey}>
                          <button
                            onClick={() =>
                              setOpenAccordion(
                                openAccordion === cat.titleKey ? "products" : cat.titleKey
                              )
                            }
                            className="w-full flex items-center justify-between px-3 py-2 text-xs font-bold text-foreground hover:bg-muted rounded-md"
                          >
                            {t(cat.titleKey)}
                            <ChevronRight
                              className={`h-3 w-3 transition-transform duration-200 ${
                                openAccordion === cat.titleKey ? "rotate-90" : ""
                              }`}
                            />
                          </button>
                          {openAccordion === cat.titleKey && (
                            <ul className="ps-4 space-y-1 py-1 animate-fade-in">
                              {cat.items.map((item) => (
                                <li key={item.titleKey}>
                                  <a
                                    href="#"
                                    className="block px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                                    onClick={() => setIsMobileOpen(false)}
                                  >
                                    {t(item.titleKey)}
                                  </a>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {navLinks.slice(1).map((link) => (
                  <a
                    key={link.key}
                    href={link.href}
                    className="block px-4 py-3 text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                    onClick={() => setIsMobileOpen(false)}
                  >
                    {t(link.key)}
                  </a>
                ))}
              </div>

              <a
                href="#contact"
                className="mt-6 flex items-center justify-center px-6 py-3 rounded-pill bg-gradient-eco text-secondary-foreground text-sm font-semibold shimmer"
                onClick={() => setIsMobileOpen(false)}
              >
                {t("contactUs")}
              </a>
            </div>
          </div>
        </>
      )}
    </header>
  );
};

export default Header;
