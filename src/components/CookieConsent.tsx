import { useState, useEffect } from "react";
import { getCookieConsent, setCookieConsent, initCookies } from "@/lib/cookies";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Cookie, X } from "lucide-react";

export default function CookieConsent() {
  const { language } = useLanguage();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    initCookies();
    if (getCookieConsent() === null) {
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    setCookieConsent("accepted");
    setVisible(false);
  };

  const handleReject = () => {
    setCookieConsent("rejected");
    setVisible(false);
  };

  if (!visible) return null;

  const isAr = language === "ar";

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] p-4 animate-fade-in-up">
      <div
        className="max-w-2xl mx-auto bg-card border border-border rounded-2xl shadow-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4"
        dir={isAr ? "rtl" : "ltr"}
      >
        <div className="flex items-start gap-3 flex-1">
          <Cookie className="w-6 h-6 text-accent shrink-0 mt-0.5" />
          <p className="text-sm text-foreground/80 leading-relaxed">
            {isAr
              ? "نستخدم ملفات تعريف الارتباط لتحسين تجربتك وتحليل حركة المرور على الموقع. بالنقر على \"قبول\"، فإنك توافق على استخدامنا لملفات تعريف الارتباط."
              : "We use cookies to improve your experience and analyze site traffic. By clicking \"Accept\", you consent to our use of cookies."}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handleReject}
            className="rounded-full text-xs px-4"
          >
            {isAr ? "رفض" : "Reject"}
          </Button>
          <Button
            size="sm"
            onClick={handleAccept}
            className="gradient-accent text-accent-foreground rounded-full text-xs px-5 border-0"
          >
            {isAr ? "قبول" : "Accept"}
          </Button>
        </div>
      </div>
    </div>
  );
}
