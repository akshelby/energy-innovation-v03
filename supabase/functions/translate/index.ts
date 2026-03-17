import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-admin-password",
};

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const { texts } = await req.json() as { texts: Record<string, string> };
    // texts is e.g. { name_en: "Fire Curtains", description_en: "...", tag_en: "Safety" }

    if (!texts || Object.keys(texts).length === 0) {
      return new Response(JSON.stringify({ error: "No texts provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const entries = Object.entries(texts).filter(([_, v]) => v && v.trim());
    if (entries.length === 0) {
      return new Response(JSON.stringify({ translations: {} }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const prompt = entries
      .map(([key, value]) => `${key}: ${value}`)
      .join("\n");

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            {
              role: "system",
              content: `You are a professional English-to-Arabic translator for an industrial/engineering company website. Translate the given English texts to Arabic. The context is industrial products like fire curtains, roller shutters, HVAC systems, oil & gas equipment, etc.

Rules:
- Return ONLY valid JSON object with the same keys but with "_ar" suffix instead of "_en"
- Keep technical terms accurate
- Use Modern Standard Arabic
- Do NOT add any explanation, just the JSON
- If a value looks like a proper noun, email, phone number, or URL, keep it as-is

Example input:
name_en: Fire Curtains
tag_en: Safety Systems

Example output:
{"name_ar": "ستائر الحريق", "tag_ar": "أنظمة السلامة"}`,
            },
            { role: "user", content: prompt },
          ],
          temperature: 0.1,
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI Gateway error:", response.status, errText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, try again shortly" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("Translation failed");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    // Extract JSON from response (may have markdown code fences)
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("Could not parse translation response:", content);
      throw new Error("Invalid translation response");
    }

    const translations = JSON.parse(jsonMatch[0]);

    return new Response(JSON.stringify({ translations }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("translate error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
