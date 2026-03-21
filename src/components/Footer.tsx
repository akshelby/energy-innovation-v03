import { useEffect, useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { Mail, Phone, MapPin } from "lucide-react";
import { useBranding } from "@/contexts/BrandingContext";
import { supabase } from "@/integrations/supabase/client";

export default function Footer() {
  const { t } = useLanguage();
  const { logoUrl, brandName, logoSize, ready: brandReady } = useBranding();
  const [linkedinUrl, setLinkedinUrl] = useState("");

  useEffect(() => {
    supabase
      .from("site_content")
      .select("content_key, value_en")
      .in("content_key", ["linkedin_url", "linkedin_active"])
      .then(({ data }) => {
        if (!data) return;
        const active = data.find((d) => d.content_key === "linkedin_active");
        const url = data.find((d) => d.content_key === "linkedin_url");
        if (active?.value_en === "true" && url?.value_en) setLinkedinUrl(url.value_en);
      });
  }, []);

  const quickLinks = [
    { label: t("nav.home"), href: "#home" },
    { label: t("nav.about"), href: "#about" },
    { label: t("nav.products"), href: "#products" },
    { label: t("nav.services"), href: "#services" },
    { label: t("nav.contact"), href: "#contact" },
  ];

  const productLinks = [
    t("cat.fire"),
    t("cat.roller"),
    t("cat.oil"),
    t("cat.hvac"),
    t("cat.loading"),
  ];

  const scrollTo = (href: string) => {
    const el = document.querySelector(href);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    } else {
      // Fallback: retry after a short delay in case sections haven't mounted yet
      requestAnimationFrame(() => {
        document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
      });
    }
  };

  return (
    <footer className="gradient-primary text-primary-foreground pt-16 pb-8 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              {brandReady && <img src={logoUrl} alt={brandName} className="w-auto object-contain" style={{ height: `${Math.round(logoSize * 0.7)}px` }} />}
            </div>
            <p className="text-primary-foreground/60 text-sm leading-relaxed">
              {t("footer.desc")}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold mb-4">{t("footer.quick")}</h4>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <button
                    onClick={() => scrollTo(link.href)}
                    className="text-sm text-primary-foreground hover:bg-primary-foreground/10 px-2 py-1 rounded transition-colors"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Product Categories */}
          <div>
            <h4 className="font-bold mb-4">{t("footer.products")}</h4>
            <ul className="space-y-2">
              {productLinks.map((link, i) => (
                <li key={i}>
                  <button
                    onClick={() => scrollTo("#products")}
                    className="text-sm text-primary-foreground hover:bg-primary-foreground/10 px-2 py-1 rounded transition-colors text-start"
                  >
                    {link}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="font-bold mb-4">{t("footer.contactInfo")}</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-sm text-primary-foreground hover:bg-primary-foreground/10 px-2 py-1 rounded transition-colors">
                <Mail className="w-4 h-4 shrink-0" />
                {t("footer.email")}
              </li>
              <li className="flex items-center gap-2 text-sm text-primary-foreground hover:bg-primary-foreground/10 px-2 py-1 rounded transition-colors">
                <Phone className="w-4 h-4 shrink-0" />
                {t("footer.phone")}
              </li>
              <li className="flex items-center gap-2 text-sm text-primary-foreground hover:bg-primary-foreground/10 px-2 py-1 rounded transition-colors">
                <MapPin className="w-4 h-4 shrink-0" />
                {t("footer.address")}
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-primary-foreground/10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-primary-foreground/40">
            © {new Date().getFullYear()} {brandName}. {t("footer.rights")}
          </p>
          {linkedinUrl && (
            <a
              href={linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
              className="text-primary-foreground/40 hover:text-primary-foreground transition-colors"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
            </a>
          )}
        </div>
      </div>
    </footer>
  );
}
