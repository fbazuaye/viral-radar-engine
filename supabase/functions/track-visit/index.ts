import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function parseDevice(ua: string): { device_type: string; browser: string } {
  let device_type = "desktop";
  if (/Mobi|Android/i.test(ua)) device_type = "mobile";
  else if (/Tablet|iPad/i.test(ua)) device_type = "tablet";

  let browser = "other";
  if (/Edg\//i.test(ua)) browser = "Edge";
  else if (/Chrome/i.test(ua)) browser = "Chrome";
  else if (/Firefox/i.test(ua)) browser = "Firefox";
  else if (/Safari/i.test(ua)) browser = "Safari";
  else if (/Opera|OPR/i.test(ua)) browser = "Opera";

  return { device_type, browser };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { page_path, referrer, user_agent, session_id, user_id } = await req.json();

    if (!page_path || !session_id) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { device_type, browser } = parseDevice(user_agent || "");

    // Try to get geo info from IP
    let country: string | null = null;
    let city: string | null = null;

    // Get client IP from headers
    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      null;

    if (clientIp && clientIp !== "127.0.0.1" && clientIp !== "::1") {
      try {
        const geoRes = await fetch(`http://ip-api.com/json/${clientIp}?fields=country,city`);
        if (geoRes.ok) {
          const geo = await geoRes.json();
          if (geo.country) country = geo.country;
          if (geo.city) city = geo.city;
        } else {
          await geoRes.text();
        }
      } catch {
        // Geo lookup failed, continue without it
      }
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { error } = await supabase.from("site_visits").insert({
      page_path,
      country,
      city,
      device_type,
      browser,
      referrer: referrer || null,
      user_id: user_id || null,
      session_id,
    });

    if (error) throw error;

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
