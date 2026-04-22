import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const { type, data } = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch admin emails
    const { data: adminEmails } = await supabase
      .from("admin_emails")
      .select("email")
      .eq("is_active", true);

    // Fetch email template settings from site_content
    const { data: emailSettings } = await supabase
      .from("site_content")
      .select("content_key, value_en, value_ar")
      .like("content_key", "email.%");

    const settings: Record<string, { en: string; ar: string }> = {};
    (emailSettings || []).forEach((s) => {
      settings[s.content_key] = { en: s.value_en, ar: s.value_ar };
    });

    const brandName = settings["email.brand_name"]?.en || "Energy Innvo";
    const tagline = settings["email.tagline"]?.en || "Industrial Solutions & Innovation";
    const logoUrl = settings["email.logo_url"]?.en || "";
    const bannerUrl = settings["email.banner_url"]?.en || "";
    const primaryColor = settings["email.primary_color"]?.en || "#f97316";

    const toEmails = (adminEmails || []).map((a) => a.email);

    let adminSubject: string;
    let adminHtml: string;
    let visitorSubject: string;
    let visitorHtml: string;
    let visitorEmail: string;

    if (type === "lead") {
      visitorEmail = data.email;
      adminSubject = `New Contact Form Submission from ${data.name}`;
      adminHtml = buildAdminNotification("Contact Form", data.name, data.email, [
        data.phone ? { label: "Phone", value: data.phone } : null,
        data.company ? { label: "Company", value: data.company } : null,
        { label: "Message", value: data.message },
      ].filter(Boolean) as { label: string; value: string }[], primaryColor);

      const subjectTmpl = settings["email.lead_subject"]?.en || "Thank you for contacting {{brand}}, {{name}}!";
      const headingTmpl = settings["email.lead_heading"]?.en || "Thank You for Reaching Out!";
      const bodyTmpl = settings["email.lead_body"]?.en || "We have received your message and our team will get back to you as soon as possible.";

      visitorSubject = replacePlaceholders(subjectTmpl, { name: data.name, brand: brandName, product: "" });
      visitorHtml = buildVisitorEmail({
        brandName, tagline, logoUrl, bannerUrl, primaryColor,
        heading: replacePlaceholders(headingTmpl, { name: data.name, brand: brandName, product: "" }),
        body: replacePlaceholders(bodyTmpl, { name: data.name, brand: brandName, product: "" }),
        recipientName: data.name,
        details: [{ label: "Your Message", value: data.message }],
      });

    } else if (type === "enquiry") {
      visitorEmail = data.email;
      adminSubject = `New Product Enquiry: ${data.product_name} from ${data.name}`;
      adminHtml = buildAdminNotification("Product Enquiry", data.name, data.email, [
        { label: "Product", value: data.product_name },
        data.company ? { label: "Company", value: data.company } : null,
        { label: "Requirement", value: data.requirement },
      ].filter(Boolean) as { label: string; value: string }[], primaryColor);

      const subjectTmpl = settings["email.enquiry_subject"]?.en || "Your enquiry about {{product}} has been received!";
      const headingTmpl = settings["email.enquiry_heading"]?.en || "Product Enquiry Received!";
      const bodyTmpl = settings["email.enquiry_body"]?.en || "Thank you for your interest in {{product}}. Our team will review your requirements shortly.";

      visitorSubject = replacePlaceholders(subjectTmpl, { name: data.name, brand: brandName, product: data.product_name });
      visitorHtml = buildVisitorEmail({
        brandName, tagline, logoUrl, bannerUrl, primaryColor,
        heading: replacePlaceholders(headingTmpl, { name: data.name, brand: brandName, product: data.product_name }),
        body: replacePlaceholders(bodyTmpl, { name: data.name, brand: brandName, product: data.product_name }),
        recipientName: data.name,
        details: [
          { label: "Product", value: data.product_name },
          { label: "Your Requirement", value: data.requirement },
        ],
      });

    } else {
      throw new Error("Invalid notification type");
    }

    const emailPromises: Promise<any>[] = [];

    if (toEmails.length > 0) {
      emailPromises.push(
        sendEmail(RESEND_API_KEY, {
          from: `${brandName} <info@energyinnvo.com>`,
          to: toEmails,
          subject: adminSubject,
          html: adminHtml,
        })
      );
    }

    emailPromises.push(
      sendEmail(RESEND_API_KEY, {
        from: `${brandName} <sales@energyinnvo.com>`,
        to: [visitorEmail],
        subject: visitorSubject,
        html: visitorHtml,
      })
    );

    const results = await Promise.allSettled(emailPromises);
    const failures = results.filter((r) => r.status === "rejected");
    if (failures.length > 0) {
      console.error("Some emails failed:", failures);
    }

    console.log("Emails processed:", results.length);
    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error sending notification email:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function replacePlaceholders(template: string, vars: { name: string; brand: string; product: string }) {
  return template
    .replace(/\{\{name\}\}/g, vars.name)
    .replace(/\{\{brand\}\}/g, vars.brand)
    .replace(/\{\{product\}\}/g, vars.product);
}

async function sendEmail(apiKey: string, payload: { from: string; to: string[]; subject: string; html: string }) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(`Resend error: ${JSON.stringify(data)}`);
  }
  console.log("Email sent:", data.id, "to:", payload.to);
  return data;
}

function buildAdminNotification(type: string, name: string, email: string, details: { label: string; value: string }[], color: string) {
  const rows = [
    { label: "Name", value: name },
    { label: "Email", value: `<a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a>` },
    ...details,
  ];
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1a1a1a; border-bottom: 2px solid ${escapeHtml(color)}; padding-bottom: 10px;">
        New ${escapeHtml(type)}
      </h2>
      <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
        ${rows.map((r) => `<tr><td style="padding: 8px 0; font-weight: bold; color: #555; vertical-align: top; width: 120px;">${escapeHtml(r.label)}:</td><td style="padding: 8px 0; white-space: pre-wrap;">${r.label === "Email" ? r.value : escapeHtml(r.value)}</td></tr>`).join("")}
      </table>
    </div>
  `;
}

function buildVisitorEmail(opts: {
  brandName: string; tagline: string; logoUrl: string; bannerUrl: string;
  primaryColor: string; heading: string; body: string; recipientName: string;
  details: { label: string; value: string }[];
}) {
  const { brandName, tagline, logoUrl, bannerUrl, primaryColor, heading, body, recipientName, details } = opts;

  const logoHtml = logoUrl
    ? `<img src="${escapeHtml(logoUrl)}" alt="${escapeHtml(brandName)}" style="max-height: 48px; margin-bottom: 8px;" />`
    : `<h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 700;">${escapeHtml(brandName)}</h1>`;

  const bannerHtml = bannerUrl
    ? `<div style="margin-bottom: 24px;"><img src="${escapeHtml(bannerUrl)}" alt="Promotion" style="width: 100%; border-radius: 8px; display: block;" /></div>`
    : "";

  const detailsHtml = details.map((d) => `
    <div style="margin-bottom: 12px;">
      <p style="font-weight: 600; color: #555; margin: 0 0 4px; font-size: 13px;">${escapeHtml(d.label)}:</p>
      <p style="margin: 0; color: #333; white-space: pre-wrap; font-size: 14px;">${escapeHtml(d.value)}</p>
    </div>
  `).join("");

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
      <!-- Header -->
      <div style="background: linear-gradient(135deg, ${escapeHtml(primaryColor)}, #ea580c); padding: 30px 25px; text-align: center; border-radius: 8px 8px 0 0;">
        ${logoHtml}
        <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 13px;">${escapeHtml(tagline)}</p>
      </div>

      <!-- Body -->
      <div style="padding: 30px 25px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
        ${bannerHtml}
        <h2 style="color: #1a1a1a; margin: 0 0 16px; font-size: 20px;">${escapeHtml(heading)}</h2>
        <p style="color: #374151; line-height: 1.6; margin: 0 0 20px; font-size: 14px;">
          Dear ${escapeHtml(recipientName)},
        </p>
        <p style="color: #374151; line-height: 1.6; margin: 0 0 24px; font-size: 14px;">
          ${escapeHtml(body)}
        </p>

        ${details.length > 0 ? `<div style="background: #f9fafb; border-radius: 8px; padding: 16px; margin-bottom: 24px; border: 1px solid #f3f4f6;">${detailsHtml}</div>` : ""}

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />

        <p style="color: #6b7280; font-size: 13px; line-height: 1.5; margin: 0;">
          Best regards,<br/>
          <strong style="color: #374151;">The ${escapeHtml(brandName)} Team</strong><br/>
          <a href="mailto:info@energyinnvo.com" style="color: ${escapeHtml(primaryColor)}; text-decoration: none;">info@energyinnvo.com</a>
        </p>
      </div>
    </div>
  `;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
