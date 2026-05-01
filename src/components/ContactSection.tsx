import { useState, useEffect, lazy, Suspense } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { z } from "zod";
import { Send, Phone, Mail, Globe, MapPin, Building, Building2, Home, Navigation, Smartphone, MessageSquare, MessageCircle, AtSign, Send as SendIcon, Headphones, Clock, Map } from "lucide-react";
const PhoneInput = lazy(() =>
  import("@/components/PhoneInput").catch((err) => {
    const msg = String(err?.message || "");
    if (/Failed to fetch dynamically imported module|Importing a module script failed/i.test(msg)) {
      const key = "lovable_chunk_reload_at";
      const last = Number(sessionStorage.getItem(key) || 0);
      if (Date.now() - last > 10000) {
        sessionStorage.setItem(key, String(Date.now()));
        window.location.reload();
      }
    }
    throw err;
  })
);

// Whitelisted set of icons that can be configured for contact cards from the admin.
// Avoids `import * as LucideIcons` which pulls the whole icon library into the bundle.
const CONTACT_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Phone, Mail, Globe, MapPin, Building, Building2, Home, Navigation,
  Smartphone, MessageSquare, MessageCircle, AtSign, Send: SendIcon,
  Headphones, Clock, Map,
};

const contactSchema = z.object({
  name: z.string().trim().min(1, "Name required").max(100),
  email: z.string().trim().email("Invalid email").max(255),
  phone: z.string().trim().max(20).optional().or(z.literal("")),
  company: z.string().trim().max(100).optional().or(z.literal("")),
  message: z.string().trim().min(1, "Message required").max(1000),
});

export default function ContactSection() {
  const { t, language } = useLanguage();
  const ref = useScrollReveal();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", company: "", message: "" });
  const [contactInfo, setContactInfo] = useState({ phone: "", email: "", address: "" });
  const [visibility, setVisibility] = useState({ phone: true, email: true, address: true });
  const [contactMeta, setContactMeta] = useState({ phoneLabel: "", emailLabel: "", addressLabel: "", phoneIcon: "Phone", emailIcon: "Mail", addressIcon: "Globe" });
  const [addresses, setAddresses] = useState<{ id: string; label_en: string; label_ar: string }[]>([]);

  useEffect(() => {
    const fetchContactInfo = async () => {
      const { data } = await supabase
        .from("site_content")
        .select("content_key, value_en, value_ar")
        .in("content_key", [
          "contact_phone", "contact_email", "contact_address",
          "contact_phone_visible", "contact_email_visible", "contact_address_visible",
          "contact_phone_label", "contact_email_label", "contact_address_label",
          "contact_phone_icon", "contact_email_icon", "contact_address_icon",
        ]);
      if (data) {
        const map: Record<string, { en: string; ar: string }> = {};
        data.forEach((r) => { map[r.content_key] = { en: r.value_en, ar: r.value_ar }; });
        setContactInfo({
          phone: map.contact_phone?.[language] || "",
          email: map.contact_email?.[language] || "",
          address: map.contact_address?.[language] || "",
        });
        setVisibility({
          phone: map.contact_phone_visible?.en !== "false",
          email: map.contact_email_visible?.en !== "false",
          address: map.contact_address_visible?.en !== "false",
        });
        setContactMeta({
          phoneLabel: map.contact_phone_label?.[language] || t("contact.phone"),
          emailLabel: map.contact_email_label?.[language] || t("contact.email"),
          addressLabel: map.contact_address_label?.[language] || t("footer.address"),
          phoneIcon: map.contact_phone_icon?.en || "Phone",
          emailIcon: map.contact_email_icon?.en || "Mail",
          addressIcon: map.contact_address_icon?.en || "Globe",
        });
      }
    };

    const fetchAddresses = async () => {
      const { data } = await supabase
        .from("contact_addresses")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");
      if (data) setAddresses(data);
    };

    fetchContactInfo();
    fetchAddresses();
  }, [language]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = contactSchema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.errors[0]?.message || "Validation error");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("leads").insert({
        name: parsed.data.name,
        email: parsed.data.email,
        phone: parsed.data.phone || null,
        company: parsed.data.company || null,
        message: parsed.data.message,
      } as any);

      if (error) throw error;

      // Send email notification (fire-and-forget)
      supabase.functions.invoke("send-notification-email", {
        body: {
          type: "lead",
          data: {
            name: parsed.data.name,
            email: parsed.data.email,
            phone: parsed.data.phone || null,
            company: parsed.data.company || null,
            message: parsed.data.message,
          },
        },
      }).catch((err) => console.error("Email notification failed:", err));

      toast.success(t("contact.success"));
      setForm({ name: "", email: "", phone: "", company: "", message: "" });
    } catch {
      toast.error(t("contact.error"));
    } finally {
      setLoading(false);
    }
  };

  const isAr = language === "ar";

  // Helper to resolve icon name/URL to a component
  const resolveIcon = (iconVal: string) => {
    if (iconVal.startsWith("http") || iconVal.startsWith("/") || iconVal.startsWith("data:")) {
      return { type: "image" as const, src: iconVal };
    }
    const IconComp = CONTACT_ICONS[iconVal];
    return { type: "lucide" as const, component: IconComp || Phone };
  };

  // Build contact cards based on visibility
  const cards: { iconVal: string; label: string; value: string; href?: string }[] = [];
  if (visibility.phone && contactInfo.phone) {
    cards.push({ iconVal: contactMeta.phoneIcon, label: contactMeta.phoneLabel || t("contact.phone"), value: contactInfo.phone, href: `tel:${contactInfo.phone.replace(/\s/g, "")}` });
  }
  if (visibility.email && contactInfo.email) {
    cards.push({ iconVal: contactMeta.emailIcon, label: contactMeta.emailLabel || t("contact.email"), value: contactInfo.email, href: `mailto:${contactInfo.email}` });
  }
  // Show addresses from new table if visible, fallback to legacy contact_address
  if (visibility.address) {
    if (addresses.length > 0) {
      addresses.forEach((addr) => {
        cards.push({
          iconVal: contactMeta.addressIcon,
          label: contactMeta.addressLabel || t("footer.address"),
          value: isAr ? addr.label_ar : addr.label_en,
        });
      });
    } else if (contactInfo.address) {
      cards.push({ iconVal: contactMeta.addressIcon, label: contactMeta.addressLabel || t("footer.address"), value: contactInfo.address });
    }
  }

  return (
    <section id="contact" className="py-12 md:py-14 px-6 md:px-12 lg:px-20 bg-secondary/30" ref={ref}>
      <div className="w-full mx-auto">
        <div className="text-center mb-8 md:mb-12 scroll-reveal">
          <span className="inline-block px-8 py-3.5 text-lg font-bold tracking-wide text-white bg-accent rounded-full mb-4">
            {t("contact.tag")}
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
            {t("contact.title")}
          </h2>
          <p className="text-muted-foreground text-lg">{t("contact.desc")}</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 md:gap-8">
          {/* Contact Info Cards */}
          {cards.length > 0 && (
            <div className="space-y-4 md:space-y-5">
              {cards.map(({ iconVal, label, value, href }, idx) => {
                const resolved = resolveIcon(iconVal);
                return (
                <div key={idx} className="group bg-card rounded-2xl border border-border p-5 md:p-6 shadow-lg flex items-start gap-4 transition-all duration-300 hover:border-destructive/30 hover:shadow-xl hover:-translate-y-1">
                  <div className="shrink-0 w-11 h-11 rounded-xl bg-accent/10 flex items-center justify-center">
                    {resolved.type === "image" ? (
                      <img src={resolved.src} alt="" className="w-5 h-5 object-contain" />
                    ) : (
                      <resolved.component className="w-5 h-5 text-accent group-hover:text-destructive transition-colors duration-300" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-muted-foreground mb-1">{label}</p>
                    {href ? (
                      <a href={href} className="text-foreground font-semibold hover:text-accent transition-colors break-all">
                        {value}
                      </a>
                    ) : (
                      <p className="text-foreground font-semibold">{value}</p>
                    )}
                  </div>
                </div>
                );
              })}
            </div>
          )}

          {/* Contact Form */}
          <form onSubmit={handleSubmit} className={`space-y-5 bg-card rounded-2xl border border-border p-6 md:p-8 shadow-lg ${cards.length > 0 ? "lg:col-span-2" : "lg:col-span-3"}`}>
            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">{t("contact.name")}</label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder={t("contact.name")}
                  maxLength={100}
                  required
                  className="rounded-xl"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">{t("contact.email")}</label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder={t("contact.email")}
                  maxLength={255}
                  required
                  className="rounded-xl"
                />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">{t("contact.phone")}</label>
                <Suspense fallback={<div className="h-10 rounded-xl bg-muted/50 animate-pulse" />}>
                  <PhoneInput
                    value={form.phone}
                    onChange={(val) => setForm({ ...form, phone: val })}
                  />
                </Suspense>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">{t("contact.company")}</label>
                <Input
                  value={form.company}
                  onChange={(e) => setForm({ ...form, company: e.target.value })}
                  placeholder={t("contact.company")}
                  maxLength={100}
                  className="rounded-xl"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">{t("contact.message")}</label>
              <Textarea
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder={t("contact.message")}
                maxLength={1000}
                required
                rows={5}
                className="rounded-xl resize-none"
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full gradient-accent text-accent-foreground rounded-full py-6 text-base font-semibold hover:scale-[1.02] transition-transform border-0"
            >
              <Send className="w-4 h-4" />
              {loading ? t("contact.sending") : t("contact.send")}
            </Button>
          </form>
        </div>
      </div>
    </section>
  );
}
