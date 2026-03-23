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

    // Fetch admin emails from the database
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: adminEmails } = await supabase
      .from("admin_emails")
      .select("email")
      .eq("is_active", true);

    const toEmails = adminEmails?.map((a) => a.email) || [];

    // Build admin notification email
    let adminSubject: string;
    let adminHtml: string;

    // Build visitor confirmation email
    let visitorSubject: string;
    let visitorHtml: string;
    let visitorEmail: string;

    if (type === "lead") {
      visitorEmail = data.email;
      adminSubject = `New Contact Form Submission from ${data.name}`;
      adminHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1a1a1a; border-bottom: 2px solid #f97316; padding-bottom: 10px;">
            New Contact Form Submission
          </h2>
          <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
            <tr><td style="padding: 8px 0; font-weight: bold; color: #555;">Name:</td><td style="padding: 8px 0;">${escapeHtml(data.name)}</td></tr>
            <tr><td style="padding: 8px 0; font-weight: bold; color: #555;">Email:</td><td style="padding: 8px 0;"><a href="mailto:${escapeHtml(data.email)}">${escapeHtml(data.email)}</a></td></tr>
            ${data.phone ? `<tr><td style="padding: 8px 0; font-weight: bold; color: #555;">Phone:</td><td style="padding: 8px 0;">${escapeHtml(data.phone)}</td></tr>` : ""}
            ${data.company ? `<tr><td style="padding: 8px 0; font-weight: bold; color: #555;">Company:</td><td style="padding: 8px 0;">${escapeHtml(data.company)}</td></tr>` : ""}
          </table>
          <div style="margin-top: 20px; padding: 15px; background: #f9fafb; border-radius: 8px;">
            <p style="font-weight: bold; color: #555; margin: 0 0 8px;">Message:</p>
            <p style="margin: 0; white-space: pre-wrap;">${escapeHtml(data.message)}</p>
          </div>
        </div>
      `;

      visitorSubject = `Thank you for contacting Energy Innvo, ${data.name}!`;
      visitorHtml = buildVisitorConfirmation({
        name: data.name,
        heading: "Thank You for Reaching Out!",
        body: `We have received your message and our team will get back to you as soon as possible. We appreciate your interest in Energy Innvo and look forward to assisting you.`,
        details: [
          { label: "Your Message", value: data.message },
        ],
      });

    } else if (type === "enquiry") {
      visitorEmail = data.email;
      adminSubject = `New Product Enquiry: ${data.product_name} from ${data.name}`;
      adminHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1a1a1a; border-bottom: 2px solid #f97316; padding-bottom: 10px;">
            New Product Enquiry
          </h2>
          <div style="margin: 15px 0; padding: 12px; background: #fff7ed; border-left: 4px solid #f97316; border-radius: 4px;">
            <strong>Product:</strong> ${escapeHtml(data.product_name)}
          </div>
          <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
            <tr><td style="padding: 8px 0; font-weight: bold; color: #555;">Name:</td><td style="padding: 8px 0;">${escapeHtml(data.name)}</td></tr>
            <tr><td style="padding: 8px 0; font-weight: bold; color: #555;">Email:</td><td style="padding: 8px 0;"><a href="mailto:${escapeHtml(data.email)}">${escapeHtml(data.email)}</a></td></tr>
            ${data.company ? `<tr><td style="padding: 8px 0; font-weight: bold; color: #555;">Company:</td><td style="padding: 8px 0;">${escapeHtml(data.company)}</td></tr>` : ""}
          </table>
          <div style="margin-top: 20px; padding: 15px; background: #f9fafb; border-radius: 8px;">
            <p style="font-weight: bold; color: #555; margin: 0 0 8px;">Requirement:</p>
            <p style="margin: 0; white-space: pre-wrap;">${escapeHtml(data.requirement)}</p>
          </div>
        </div>
      `;

      visitorSubject = `Your enquiry about ${data.product_name} has been received!`;
      visitorHtml = buildVisitorConfirmation({
        name: data.name,
        heading: "Product Enquiry Received!",
        body: `Thank you for your interest in <strong>${escapeHtml(data.product_name)}</strong>. Our team has received your enquiry and will review your requirements shortly. We'll get back to you with the information you need.`,
        details: [
          { label: "Product", value: data.product_name },
          { label: "Your Requirement", value: data.requirement },
        ],
      });

    } else {
      throw new Error("Invalid notification type");
    }

    // Send both emails in parallel
    const emailPromises: Promise<any>[] = [];

    // 1. Admin notification (if admin emails exist)
    if (toEmails.length > 0) {
      emailPromises.push(
        sendEmail(RESEND_API_KEY, {
          from: "Energy Innvo <info@energyinnvo.com>",
          to: toEmails,
          subject: adminSubject,
          html: adminHtml,
        })
      );
    }

    // 2. Visitor confirmation
    emailPromises.push(
      sendEmail(RESEND_API_KEY, {
        from: "Energy Innvo <info@energyinnvo.com>",
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
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

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

function buildVisitorConfirmation({ name, heading, body, details }: {
  name: string;
  heading: string;
  body: string;
  details: { label: string; value: string }[];
}) {
  const detailsHtml = details
    .map(
      (d) => `
      <div style="margin-bottom: 12px;">
        <p style="font-weight: 600; color: #555; margin: 0 0 4px; font-size: 13px;">${escapeHtml(d.label)}:</p>
        <p style="margin: 0; color: #333; white-space: pre-wrap; font-size: 14px;">${escapeHtml(d.value)}</p>
      </div>`
    )
    .join("");

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #f97316, #ea580c); padding: 30px 25px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 700;">Energy Innvo</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 13px;">Industrial Solutions & Innovation</p>
      </div>

      <!-- Body -->
      <div style="padding: 30px 25px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
        <h2 style="color: #1a1a1a; margin: 0 0 16px; font-size: 20px;">${heading}</h2>
        <p style="color: #374151; line-height: 1.6; margin: 0 0 20px; font-size: 14px;">
          Dear ${escapeHtml(name)},
        </p>
        <p style="color: #374151; line-height: 1.6; margin: 0 0 24px; font-size: 14px;">
          ${body}
        </p>

        ${
          details.length > 0
            ? `<div style="background: #f9fafb; border-radius: 8px; padding: 16px; margin-bottom: 24px; border: 1px solid #f3f4f6;">
                ${detailsHtml}
              </div>`
            : ""
        }

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />

        <p style="color: #6b7280; font-size: 13px; line-height: 1.5; margin: 0;">
          Best regards,<br/>
          <strong style="color: #374151;">The Energy Innvo Team</strong><br/>
          <a href="mailto:info@energyinnvo.com" style="color: #f97316; text-decoration: none;">info@energyinnvo.com</a>
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
