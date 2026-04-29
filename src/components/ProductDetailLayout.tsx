import { Check } from "lucide-react";

/**
 * Luxury Warm Minimal product detail layout.
 * All colors / fonts are inline so it does NOT affect the global design tokens.
 *
 * Palette
 *   bg          #faf8f5
 *   dark box    #1a1a1a
 *   gold        #c8a96e
 *   body        #4a4a4a
 *   muted       #6b6b6b
 *   border      #e8e2d9
 *   chip bg     #f0ebe3
 *   tagline     #b0a898
 *
 * Fonts
 *   Playfair Display — headings/numbers
 *   Mulish — body
 */

export interface RatingItem {
  label_en?: string;
  label_ar?: string;
  value: string;
}

export interface ProductDetailData {
  productLabel: string;          // e.g. "Product" / "منتج"
  name: string;                  // headline
  description?: string;
  certificationsTitle: string;   // e.g. "Compliance & Certification"
  certifications: string[];
  ratings: RatingItem[];
  operationModesTitle: string;
  operationModes: string[];
  applicationsTitle: string;
  applications: string[];
  tagline?: string;
  isAr: boolean;
}

const COLORS = {
  bg: "#faf8f5",
  dark: "#1a1a1a",
  gold: "#c8a96e",
  body: "#4a4a4a",
  muted: "#6b6b6b",
  border: "#e8e2d9",
  chip: "#f0ebe3",
  tagline: "#b0a898",
};

const fontHead = "'Playfair Display', Georgia, serif";
const fontBody = "'Mulish', system-ui, sans-serif";

export default function ProductDetailLayout({
  productLabel,
  name,
  description,
  certificationsTitle,
  certifications,
  ratings,
  operationModesTitle,
  operationModes,
  applicationsTitle,
  applications,
  tagline,
  isAr,
}: ProductDetailData) {
  const hasCerts = certifications && certifications.length > 0;
  const hasRatings = ratings && ratings.length > 0;
  const hasModes = operationModes && operationModes.length > 0;
  const hasApps = applications && applications.length > 0;
  const hasBottom = hasModes || hasApps;
  const hasTagline = !!tagline && tagline.trim().length > 0;

  return (
    <div
      dir={isAr ? "rtl" : "ltr"}
      style={{
        background: COLORS.bg,
        color: COLORS.body,
        fontFamily: fontBody,
      }}
      className="rounded-3xl border overflow-hidden"
    >
      <div
        className="px-6 md:px-10 lg:px-14 py-10 md:py-14"
        style={{ borderColor: COLORS.border }}
      >
        {/* ── A) TOP — 2 columns ─────────────────────────────── */}
        <div className={`grid gap-8 md:gap-12 ${hasCerts ? "lg:grid-cols-[1.4fr_1fr]" : "grid-cols-1"}`}>
          {/* Left */}
          <div>
            <span
              className="inline-block px-4 py-1.5 text-[11px] font-semibold tracking-[0.18em] uppercase rounded-full mb-6"
              style={{ background: COLORS.dark, color: "#fff", fontFamily: fontBody }}
            >
              {productLabel}
            </span>
            <h1
              className="text-3xl md:text-4xl lg:text-5xl mb-6 leading-tight"
              style={{
                fontFamily: fontHead,
                fontWeight: 600,
                color: COLORS.dark,
                letterSpacing: "-0.01em",
              }}
            >
              {name}
            </h1>
            {description && (
              <p
                style={{
                  fontFamily: fontBody,
                  fontSize: "15px",
                  lineHeight: 1.85,
                  color: COLORS.muted,
                  fontWeight: 400,
                }}
              >
                {description}
              </p>
            )}
          </div>

          {/* Right — Compliance & Certification (only if any) */}
          {hasCerts && (
            <aside
              className="rounded-2xl p-7 md:p-8 self-start"
              style={{ background: COLORS.dark }}
            >
              <h3
                className="mb-5 text-lg"
                style={{ fontFamily: fontHead, fontWeight: 600, color: "#fff" }}
              >
                {certificationsTitle}
              </h3>
              <ul className="space-y-4">
                {certifications.map((c, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span
                      className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center mt-0.5"
                      style={{ background: COLORS.gold }}
                    >
                      <Check className="w-3.5 h-3.5" style={{ color: COLORS.dark }} strokeWidth={3} />
                    </span>
                    <span
                      style={{
                        color: "#fff",
                        fontFamily: fontBody,
                        fontSize: "14px",
                        lineHeight: 1.55,
                      }}
                    >
                      {c}
                    </span>
                  </li>
                ))}
              </ul>
            </aside>
          )}
        </div>

        {/* ── B) RATINGS ROW ─────────────────────────────────── */}
        {hasRatings && (
          <div
            className="mt-12 md:mt-16 pt-10 grid"
            style={{
              borderTop: `1px solid ${COLORS.border}`,
              gridTemplateColumns: `repeat(${Math.min(ratings.length, 4)}, minmax(0, 1fr))`,
            }}
          >
            {ratings.slice(0, 4).map((r, i) => (
              <div
                key={i}
                className="text-center px-3 py-2"
                style={{
                  borderInlineStart: i === 0 ? "none" : `1px solid ${COLORS.border}`,
                }}
              >
                <div
                  className="mx-auto mb-4"
                  style={{ width: 40, height: 2, background: COLORS.gold }}
                />
                <div
                  className="mb-2"
                  style={{
                    fontFamily: fontHead,
                    fontWeight: 700,
                    color: COLORS.dark,
                    fontSize: "clamp(28px, 4vw, 42px)",
                    lineHeight: 1,
                    letterSpacing: "-0.02em",
                  }}
                >
                  {r.value}
                </div>
                <div
                  style={{
                    fontFamily: fontBody,
                    fontSize: "11px",
                    fontWeight: 600,
                    letterSpacing: "0.16em",
                    color: COLORS.muted,
                    textTransform: "uppercase",
                  }}
                >
                  {(isAr ? r.label_ar : r.label_en) || r.label_en || r.label_ar || ""}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── C) BOTTOM — Modes + Applications ───────────────── */}
        {hasBottom && (
          <div
            className={`mt-12 md:mt-16 pt-10 grid gap-10 md:gap-14 ${
              hasModes && hasApps ? "lg:grid-cols-2" : "grid-cols-1"
            }`}
            style={{ borderTop: `1px solid ${COLORS.border}` }}
          >
            {hasModes && (
              <div>
                <h3
                  className="mb-5 text-xl md:text-2xl"
                  style={{ fontFamily: fontHead, fontWeight: 600, color: COLORS.dark }}
                >
                  {operationModesTitle}
                </h3>
                <ul className="space-y-3">
                  {operationModes.map((m, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-3"
                      style={{
                        fontFamily: fontBody,
                        fontSize: "14.5px",
                        color: COLORS.body,
                        lineHeight: 1.6,
                      }}
                    >
                      <span
                        style={{ color: COLORS.gold, fontWeight: 700 }}
                        className="shrink-0"
                      >
                        {isAr ? "←" : "→"}
                      </span>
                      <span>{m}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {hasApps && (
              <div>
                <h3
                  className="mb-5 text-xl md:text-2xl"
                  style={{ fontFamily: fontHead, fontWeight: 600, color: COLORS.dark }}
                >
                  {applicationsTitle}
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {applications.map((a, i) => (
                    <span
                      key={i}
                      className="px-4 py-2.5 rounded-lg text-center"
                      style={{
                        background: COLORS.chip,
                        fontFamily: fontBody,
                        fontSize: "13px",
                        color: COLORS.body,
                        fontWeight: 500,
                      }}
                    >
                      {a}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── D) FOOTER tagline ──────────────────────────────── */}
        {hasTagline && (
          <div
            className="mt-12 pt-6 text-center"
            style={{ borderTop: `1px solid ${COLORS.border}` }}
          >
            <p
              style={{
                fontFamily: fontHead,
                fontStyle: "italic",
                color: COLORS.tagline,
                fontSize: "15px",
              }}
            >
              {tagline}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
