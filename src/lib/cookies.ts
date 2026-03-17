const CONSENT_KEY = "cookie_consent";

export type CookieConsent = "accepted" | "rejected" | null;

export function getCookieConsent(): CookieConsent {
  const value = localStorage.getItem(CONSENT_KEY);
  if (value === "accepted" || value === "rejected") return value;
  return null;
}

export function setCookieConsent(consent: "accepted" | "rejected") {
  localStorage.setItem(CONSENT_KEY, consent);

  if (consent === "accepted") {
    loadAnalytics();
  }
}

function loadAnalytics() {
  // Replace with your GA4 Measurement ID (e.g. "G-XXXXXXXXXX")
  const GA_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;
  if (!GA_ID || document.getElementById("ga-script")) return;

  const script = document.createElement("script");
  script.id = "ga-script";
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(script);

  script.onload = () => {
    (window as any).dataLayer = (window as any).dataLayer || [];
    function gtag(...args: any[]) {
      (window as any).dataLayer.push(args);
    }
    gtag("js", new Date());
    gtag("config", GA_ID);
  };
}

// Auto-load analytics if user already accepted
export function initCookies() {
  if (getCookieConsent() === "accepted") {
    loadAnalytics();
  }
}
