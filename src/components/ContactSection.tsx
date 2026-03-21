import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { z } from "zod";
import { Send, Phone, Mail, Globe } from "lucide-react";
import PhoneInput from "@/components/PhoneInput";

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
  const [addresses, setAddresses] = useState<{ id: string; label_en: string; label_ar: string }[]>([]);

  useEffect(() => {
    const fetchContactInfo = async () => {
      const { data } = await supabase
        .from("site_content")
        .select("content_key, value_en, value_ar")
        .in("content_key", [
          "contact_phone", "contact_email", "contact_address",
          "contact_phone_visible", "contact_email_visible", "contact_address_visible",
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
      toast.success(t("contact.success"));
      setForm({ name: "", email: "", phone: "", company: "", message: "" });
    } catch {
      toast.error(t("contact.error"));
    } finally {
      setLoading(false);
    }
  };

  const isAr = language === "ar";

  // Build contact cards based on visibility
  const cards: { icon: typeof Phone; label: string; value: string; href?: string }[] = [];
  if (visibility.phone && contactInfo.phone) {
    cards.push({ icon: Phone, label: t("contact.phone"), value: contactInfo.phone, href: `tel:${contactInfo.phone.replace(/\s/g, "")}` });
  }
  if (visibility.email && contactInfo.email) {
    cards.push({ icon: Mail, label: t("contact.email"), value: contactInfo.email, href: `mailto:${contactInfo.email}` });
  }
  // Show addresses from new table if visible, fallback to legacy contact_address
  if (visibility.address) {
    if (addresses.length > 0) {
      addresses.forEach((addr) => {
        cards.push({
          icon: Globe,
          label: t("footer.address"),
          value: isAr ? addr.label_ar : addr.label_en,
        });
      });
    } else if (contactInfo.address) {
      cards.push({ icon: Globe, label: t("footer.address"), value: contactInfo.address });
    }
  }

  return (
    <section id="contact" className="py-12 md:py-24 px-6 bg-secondary/30" ref={ref}>
      <div className="max-w-6xl mx-auto">
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
              {cards.map(({ icon: Icon, label, value, href }, idx) => (
                <div key={idx} className="bg-card rounded-2xl border border-border p-5 md:p-6 shadow-lg flex items-start gap-4">
                  <div className="shrink-0 w-11 h-11 rounded-xl bg-accent/10 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-accent" />
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
              ))}
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
                <PhoneInput
                  value={form.phone}
                  onChange={(val) => setForm({ ...form, phone: val })}
                />
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
