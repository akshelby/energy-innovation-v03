import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { Mail, Globe } from "lucide-react";
import { useBranding } from "@/contexts/BrandingContext";
import { supabase } from "@/integrations/supabase/client";
import { getCached, setCache } from "@/lib/cache";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface SocialLinks {
  linkedin: string;
  twitter: string;
  facebook: string;
  instagram: string;
  youtube: string;
}

interface FooterAddress {
  heading_en: string;
  heading_ar: string;
  body_en: string;
  body_ar: string;
}

const SOCIAL_KEYS = ["footer.social_linkedin", "footer.social_twitter", "footer.social_facebook", "footer.social_instagram", "footer.social_youtube"] as const;
const ADDRESS_KEYS = ["footer.address_1_heading", "footer.address_1_body", "footer.address_2_heading", "footer.address_2_body"] as const;

export default function Footer() {
  const { t, language } = useLanguage();
  const { logoUrl, brandName, logoSize, ready: brandReady } = useBranding();
  const location = useLocation();
  const navigate = useNavigate();

  const [footerData, setFooterData] = useState<Record<string, { en: string; ar: string }>>(() => getCached<Record<string, { en: string; ar: string }>>("footer") || {});
  const [ready, setReady] = useState(() => Object.keys(footerData).length > 0);
  const [popup, setPopup] = useState<{ title: string; value: string; href?: string } | null>(null);

  useEffect(() => {
    const fetchFooterContent = async () => {
      try {
        const { data } = await supabase
          .from("site_content")
          .select("content_key, value_en, value_ar")
          .like("content_key", "footer.%");
        if (data) {
          const map: Record<string, { en: string; ar: string }> = {};
          data.forEach((item: any) => {
            map[item.content_key] = { en: item.value_en, ar: item.value_ar };
          });
          setFooterData(map);
          setCache("footer", map);
        }
        setReady(true);
      } catch { setReady(true); }
    };
    fetchFooterContent();
  }, []);

  const ft = (key: string, fallback?: string): string => {
    if (footerData[key]) return footerData[key][language] || fallback || "";
    return fallback || t(key) || "";
  };

  const social: SocialLinks = {
    linkedin: ft("footer.social_linkedin", "https://linkedin.com"),
    twitter: ft("footer.social_twitter", "https://x.com"),
    facebook: ft("footer.social_facebook", "https://facebook.com"),
    instagram: ft("footer.social_instagram", "https://instagram.com"),
    youtube: ft("footer.social_youtube", "https://youtube.com"),
  };

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

  const scrollTo = useCallback((href: string) => {
    if (location.pathname !== "/") {
      navigate("/" + href);
      return;
    }
    const el = document.querySelector(href);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    } else {
      setTimeout(() => {
        document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [location.pathname, navigate]);

  const contactEmail = ft("footer.contact_email", "info@energyinnvo.com");
  const contactWebsite = ft("footer.contact_website", "www.energyinnvo.com");

  const addresses: FooterAddress[] = [
    {
      heading_en: footerData["footer.address_1_heading"]?.en || "Industrial District, Building 7",
      heading_ar: footerData["footer.address_1_heading"]?.ar || "المنطقة الصناعية، مبنى 7",
      body_en: footerData["footer.address_1_body"]?.en || "Office No. BC-891284, 26th Floor,\nAmber Gem Tower, Ajman, UAE.",
      body_ar: footerData["footer.address_1_body"]?.ar || "مكتب رقم BC-891284، الطابق 26،\nبرج أمبر جيم، عجمان، الإمارات.",
    },
    {
      heading_en: footerData["footer.address_2_heading"]?.en || "India Branch:",
      heading_ar: footerData["footer.address_2_heading"]?.ar || "فرع الهند:",
      body_en: footerData["footer.address_2_body"]?.en || "Office 167, Chetpet,\nTamil Nadu, India.",
      body_ar: footerData["footer.address_2_body"]?.ar || "مكتب 167، شيتبيت،\nتاميل نادو، الهند.",
    },
  ];

  const socialItems = [
    { url: social.linkedin, label: "LinkedIn", icon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg> },
    { url: social.twitter, label: "X / Twitter", icon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg> },
    { url: social.facebook, label: "Facebook", icon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg> },
    { url: social.instagram, label: "Instagram", icon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405a1.441 1.441 0 11-2.882 0 1.441 1.441 0 012.882 0z"/></svg> },
    { url: social.youtube, label: "YouTube", icon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg> },
  ].filter((s) => s.url);

  const socialEnabled = (footerData["footer.social_enabled"]?.en ?? "true").toLowerCase() !== "false";

  return (
    <footer
      className={`text-primary-foreground pt-12 pb-8 px-6 transition-opacity duration-500 ${ready ? 'opacity-100' : 'opacity-0'}`}
      style={{ background: 'linear-gradient(135deg, hsl(213 70% 38%) 0%, hsl(213 65% 48%) 100%)' }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Social Icons Row */}
        {socialItems.length > 0 && (
          <div className="flex items-center justify-center gap-5 pb-8 mb-10 border-b border-primary-foreground/10">
            {socialItems.map((s) => (
              <a
                key={s.label}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.label}
                className="text-white/70 hover:text-primary-foreground transition-colors"
              >
                {s.icon}
              </a>
            ))}
          </div>
        )}

        {/* 4-Column Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 sm:gap-x-12 gap-y-10 mb-14">
          {/* Brand */}
          <div>
            <div className="mb-5">
              {brandReady && <img src={logoUrl} alt={brandName} className="w-auto object-contain" style={{ height: `${Math.round(logoSize * 0.7)}px` }} />}
            </div>
            <p className="text-white/85 text-sm leading-relaxed">
              {t("footer.desc")}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold mb-5 text-white">{t("footer.quick")}</h4>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <button
                    onClick={() => scrollTo(link.href)}
                    className="text-sm text-white/85 hover:text-white transition-colors"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Product Categories */}
          <div>
            <h4 className="font-bold mb-5 text-white">{t("footer.products")}</h4>
            <ul className="space-y-3">
              {productLinks.map((link, i) => (
                <li key={i}>
                  <button
                    onClick={() => scrollTo("#products")}
                    className="text-sm text-white/85 hover:text-white transition-colors text-start"
                  >
                    {link}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="font-bold mb-5 text-white">{t("footer.contactInfo")}</h4>
            <ul className="space-y-3 text-sm text-white">
              <li className="flex items-center gap-2 min-w-0">
                <Mail className="w-4 h-4 shrink-0 text-white/85" />
                <button
                  type="button"
                  onClick={() => setPopup({ title: t("footer.contactInfo"), value: contactEmail, href: `mailto:${contactEmail}` })}
                  className="text-white hover:text-white/80 transition-colors truncate min-w-0 text-start"
                  title={contactEmail}
                >
                  {contactEmail}
                </button>
              </li>
              <li className="flex items-center gap-2 min-w-0">
                <Globe className="w-4 h-4 shrink-0 text-white/85" />
                <button
                  type="button"
                  onClick={() => {
                    const href = contactWebsite.startsWith("http") ? contactWebsite : `https://${contactWebsite}`;
                    setPopup({ title: t("footer.contactInfo"), value: contactWebsite, href });
                  }}
                  className="text-white hover:text-white/80 transition-colors truncate min-w-0 text-start"
                  title={contactWebsite}
                >
                  {contactWebsite}
                </button>
              </li>
            </ul>

            {addresses.filter(a => {
              const heading = language === "ar" ? a.heading_ar : a.heading_en;
              return heading && heading.trim();
            }).map((addr, i) => {
              const heading = language === "ar" ? addr.heading_ar : addr.heading_en;
              const body = language === "ar" ? addr.body_ar : addr.body_en;
              return (
                <div key={i} className={i === 0 ? "mt-6" : "mt-5"}>
                  <h5 className="font-bold mb-2 text-white text-base md:text-lg break-words">{heading}</h5>
                  <p className="text-sm text-white/85 leading-relaxed whitespace-pre-line break-words">
                    {body}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-primary-foreground/10 pt-8 flex items-center justify-center">
          <p className="text-sm text-white/70">
            © {new Date().getFullYear()} {brandName}. {t("footer.rights")}
          </p>
        </div>
      </div>

      <Dialog open={!!popup} onOpenChange={(open) => !open && setPopup(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{popup?.title}</DialogTitle>
          </DialogHeader>
          {popup?.href ? (
            <a
              href={popup.href}
              target={popup.href.startsWith("http") ? "_blank" : undefined}
              rel="noopener noreferrer"
              className="text-primary hover:underline break-all text-sm"
            >
              {popup.value}
            </a>
          ) : (
            <p className="break-all text-sm">{popup?.value}</p>
          )}
        </DialogContent>
      </Dialog>
    </footer>
  );
}
