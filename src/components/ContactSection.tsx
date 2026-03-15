import { useState } from "react";
import { Send } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const translations: Record<string, Record<string, string>> = {
  contactTitle: { en: "Get in Touch", ar: "تواصل معنا" },
  contactSubtitle: { en: "Let's discuss how we can power your next project with sustainable solutions.", ar: "دعنا نناقش كيف يمكننا تزويد مشروعك القادم بحلول مستدامة." },
  nameLabel: { en: "Full Name", ar: "الاسم الكامل" },
  namePlaceholder: { en: "John Smith", ar: "أحمد محمد" },
  emailLabel: { en: "Email Address", ar: "البريد الإلكتروني" },
  emailPlaceholder: { en: "john@company.com", ar: "ahmed@company.com" },
  companyLabel: { en: "Company", ar: "الشركة" },
  companyPlaceholder: { en: "Your company name", ar: "اسم شركتك" },
  messageLabel: { en: "Message", ar: "الرسالة" },
  messagePlaceholder: { en: "Tell us about your project requirements...", ar: "أخبرنا عن متطلبات مشروعك..." },
  submitBtn: { en: "Send Message", ar: "إرسال الرسالة" },
  sending: { en: "Sending...", ar: "جارٍ الإرسال..." },
  successTitle: { en: "Message sent!", ar: "تم الإرسال!" },
  successDesc: { en: "We'll get back to you within 24 hours.", ar: "سنرد عليك خلال 24 ساعة." },
  errorTitle: { en: "Error", ar: "خطأ" },
  errorDesc: { en: "Failed to send message. Please try again.", ar: "فشل في إرسال الرسالة. يرجى المحاولة مرة أخرى." },
  required: { en: "This field is required", ar: "هذا الحقل مطلوب" },
  invalidEmail: { en: "Please enter a valid email", ar: "يرجى إدخال بريد إلكتروني صحيح" },
};

const ContactSection = () => {
  const { language } = useLanguage();
  const t = (key: string) => translations[key]?.[language] || key;

  const [form, setForm] = useState({ name: "", email: "", company: "", message: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = t("required");
    if (!form.email.trim()) errs.email = t("required");
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = t("invalidEmail");
    if (!form.message.trim()) errs.message = t("required");
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    const { error } = await supabase.from("leads").insert({
      name: form.name.trim(),
      email: form.email.trim(),
      company: form.company.trim() || null,
      message: form.message.trim(),
    });
    setLoading(false);

    if (error) {
      toast({ title: t("errorTitle"), description: t("errorDesc"), variant: "destructive" });
    } else {
      toast({ title: t("successTitle"), description: t("successDesc") });
      setForm({ name: "", email: "", company: "", message: "" });
      setErrors({});
    }
  };

  const inputClasses = "w-full px-4 py-3 rounded-lg bg-background border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-eco/50 focus:border-eco transition-colors";

  return (
    <section id="contact" className="py-24 px-6 md:px-16 lg:px-24 bg-background">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">{t("contactTitle")}</h2>
          <p className="mt-4 text-muted-foreground">{t("contactSubtitle")}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-8 rounded-2xl bg-card border border-border shadow-sm">
          <div className="grid md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">{t("nameLabel")} *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder={t("namePlaceholder")}
                className={inputClasses}
                maxLength={100}
              />
              {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">{t("emailLabel")} *</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder={t("emailPlaceholder")}
                className={inputClasses}
                maxLength={255}
              />
              {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">{t("companyLabel")}</label>
            <input
              type="text"
              value={form.company}
              onChange={(e) => setForm({ ...form, company: e.target.value })}
              placeholder={t("companyPlaceholder")}
              className={inputClasses}
              maxLength={200}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">{t("messageLabel")} *</label>
            <textarea
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              placeholder={t("messagePlaceholder")}
              rows={5}
              className={`${inputClasses} resize-none`}
              maxLength={1000}
            />
            {errors.message && <p className="text-xs text-destructive mt-1">{errors.message}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-8 py-3.5 rounded-pill bg-gradient-eco text-secondary-foreground text-sm font-semibold shimmer hover:scale-[1.02] active:scale-[0.98] transition-transform disabled:opacity-60 disabled:cursor-not-allowed shadow-md"
          >
            {loading ? t("sending") : (
              <>
                <Send className="h-4 w-4" />
                {t("submitBtn")}
              </>
            )}
          </button>
        </form>
      </div>
    </section>
  );
};

export default ContactSection;
