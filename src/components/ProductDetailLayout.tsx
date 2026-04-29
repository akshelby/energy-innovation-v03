import { Check } from "lucide-react";

export interface Rating {
  value: string;
  label_en: string;
  label_ar: string;
}

export interface ProductDetailData {
  productLabel?: string;          // small pill label, defaults to "Product" / "منتج"
  name: string;                   // localized product name
  description?: string;           // localized description
  certifications?: string[];      // localized certifications
  certificationsTitle?: string;   // optional override
  ratings?: Rating[];
  operationModes?: string[];
  operationModesTitle?: string;
  applications?: string[];
  applicationsTitle?: string;
  tagline?: string;
  isAr?: boolean;
}

/**
 * Luxury Warm Minimal product detail layout.
 * Renders only the sections that have data; empty ones are hidden.
 * Uses scoped tokens (warm cream / gold) that override the global theme inside
 * the wrapping container only — does NOT affect the rest of the page.
 */
export default function ProductDetailLayout({
  productLabel,
  name,
  description,
  certifications = [],
  certificationsTitle,
  ratings = [],
  operationModes = [],
  operationModesTitle,
  applications = [],
  applicationsTitle,
  tagline,
  isAr = false,
}: ProductDetailData) {
  const hasCerts = certifications.filter(Boolean).length > 0;
  const hasRatings = ratings.filter((r) => r && r.value).length > 0;
  const hasModes = operationModes.filter(Boolean).length > 0;
  const hasApps = applications.filter(Boolean).length > 0;
  const hasTagline = !!(tagline && tagline.trim());

  // Nothing to render — return null so the page falls back to the legacy layout
  if (!hasCerts && !hasRatings && !hasModes && !hasApps && !hasTagline && !description) {
    return null;
  }

  const t = {
    product: productLabel || (isAr ? "منتج" : "Product"),
    compliance: certificationsTitle || (isAr ? "الامتثال والاعتماد" : "Compliance & Certification"),
    modes: operationModesTitle || (isAr ? "أوضاع التشغيل" : "Operation Modes"),
    apps: applicationsTitle || (isAr ? "التطبيقات" : "Applications"),
  };

  return (
    <div
      dir={isAr ? "rtl" : "ltr"}
      className="rounded-2xl overflow-hidden border"
      style={{
        background: "#faf8f5",
        borderColor: "#e8e2d9",
        fontFamily: "'Mulish', system-ui, sans-serif",
        color: "#4a4a4a",
      }}
    >
      {/* SECTION A — Top grid */}
      <div className="grid lg:grid-cols-2 gap-8 md:gap-12 p-6 md:p-10 lg:p-14">
        {/* Left: label + name + description */}
        <div className="flex flex-col">
          <span
            className="inline-flex items-center self-start px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] rounded-full"
            style={{ background: "#1a1a1a", color: "#fff", fontFamily: "'Mulish', sans-serif" }}
          >
            {t.product}
          </span>
          <h1
            className="mt-5 text-[34px] md:text-[44px] lg:text-[54px] leading-[1.05] font-bold"
            style={{ fontFamily: "'Playfair Display', serif", color: "#1a1a1a" }}
          >
            {name}
          </h1>
          {description && (
            <p
              className="mt-5 text-[15px]"
              style={{ color: "#6b6b6b", lineHeight: 1.85, fontFamily: "'Mulish', sans-serif" }}
            >
              {description}
            </p>
          )}
        </div>

        {/* Right: certifications dark box */}
        {hasCerts && (
          <div
            className="rounded-xl p-7 md:p-9 self-start"
            style={{ background: "#1a1a1a" }}
          >
            <p
              className="uppercase mb-6"
              style={{
                fontSize: "10px",
                letterSpacing: "3px",
                color: "#888",
                fontFamily: "'Mulish', sans-serif",
                fontWeight: 600,
              }}
            >
              {t.compliance}
            </p>
            <ul className="space-y-4">
              {certifications.filter(Boolean).map((cert, idx) => (
                <li key={idx} className="flex items-center gap-3">
                  <span
                    className="shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center"
                    style={{ borderColor: "#c8a96e" }}
                  >
                    <Check className="w-3.5 h-3.5" style={{ color: "#c8a96e" }} strokeWidth={3} />
                  </span>
                  <span
                    className="text-[14px]"
                    style={{ color: "#fff", fontFamily: "'Mulish', sans-serif", fontWeight: 400 }}
                  >
                    {cert}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* SECTION B — Ratings row */}
      {hasRatings && (
        <div
          className="grid grid-cols-2 md:grid-cols-4 border-t"
          style={{ borderColor: "#e8e2d9" }}
        >
          {ratings.filter((r) => r && r.value).map((r, idx, arr) => (
            <div
              key={idx}
              className={`px-4 py-8 md:py-10 text-center ${
                idx < arr.length - 1 ? (isAr ? "border-l" : "border-r") : ""
              } ${idx >= 2 ? "md:border-t-0 border-t" : ""} md:border-t-0`}
              style={{ borderColor: "#e8e2d9" }}
            >
              <div
                className="mx-auto mb-4"
                style={{ width: "40px", height: "2px", background: "#c8a96e" }}
              />
              <div
                className="text-[36px] md:text-[44px] font-semibold leading-none mb-2"
                style={{ fontFamily: "'Playfair Display', serif", color: "#1a1a1a" }}
              >
                {r.value}
              </div>
              <div
                className="uppercase"
                style={{
                  fontSize: "10px",
                  letterSpacing: "2.5px",
                  color: "#6b6b6b",
                  fontFamily: "'Mulish', sans-serif",
                  fontWeight: 600,
                }}
              >
                {isAr ? r.label_ar || r.label_en : r.label_en || r.label_ar}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SECTION C — Bottom grid */}
      {(hasModes || hasApps) && (
        <div
          className={`grid ${hasModes && hasApps ? "lg:grid-cols-2" : "grid-cols-1"} gap-8 md:gap-12 p-6 md:p-10 lg:p-14 border-t`}
          style={{ borderColor: "#e8e2d9" }}
        >
          {hasModes && (
            <div>
              <p
                className="uppercase mb-5"
                style={{
                  fontSize: "10px",
                  letterSpacing: "3px",
                  color: "#b0a898",
                  fontFamily: "'Mulish', sans-serif",
                  fontWeight: 600,
                }}
              >
                {t.modes}
              </p>
              <ul>
                {operationModes.filter(Boolean).map((mode, idx, arr) => (
                  <li
                    key={idx}
                    className={`flex items-center gap-3 py-3 ${idx < arr.length - 1 ? "border-b" : ""}`}
                    style={{ borderColor: "#e8e2d9" }}
                  >
                    <span
                      style={{ color: "#c8a96e", fontFamily: "'Mulish', sans-serif", fontWeight: 600 }}
                    >
                      {isAr ? "←" : "→"}
                    </span>
                    <span
                      className="text-[14px]"
                      style={{ color: "#4a4a4a", fontFamily: "'Mulish', sans-serif" }}
                    >
                      {mode}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {hasApps && (
            <div>
              <p
                className="uppercase mb-5"
                style={{
                  fontSize: "10px",
                  letterSpacing: "3px",
                  color: "#b0a898",
                  fontFamily: "'Mulish', sans-serif",
                  fontWeight: 600,
                }}
              >
                {t.apps}
              </p>
              <div className="grid grid-cols-2 gap-3">
                {applications.filter(Boolean).map((app, idx) => (
                  <div
                    key={idx}
                    className="rounded-lg px-4 py-3 text-center text-[13px]"
                    style={{
                      background: "#f0ebe3",
                      color: "#4a4a4a",
                      fontFamily: "'Mulish', sans-serif",
                      fontWeight: 500,
                    }}
                  >
                    {app}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* SECTION D — Footer tagline */}
      {hasTagline && (
        <div
          className="px-6 md:px-10 lg:px-14 py-6 border-t text-center italic"
          style={{
            borderColor: "#e8e2d9",
            color: "#b0a898",
            fontFamily: "'Playfair Display', serif",
            fontSize: "14px",
          }}
        >
          {tagline}
        </div>
      )}
    </div>
  );
}
