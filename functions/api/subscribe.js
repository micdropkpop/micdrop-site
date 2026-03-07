// Cloudflare Pages Function: POST /api/subscribe
// Stores email signups in KV namespace "SUBSCRIBERS"

const ALLOWED_ORIGINS = [
  "https://micdropkpop.com",
  "https://www.micdropkpop.com",
  "https://master.micdrop-site.pages.dev",
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function corsHeaders(request) {
  const origin = request.headers.get("Origin") || "";
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": allowed,
    "Vary": "Origin",
  };
}

export async function onRequestPost(context) {
  const headers = corsHeaders(context.request);

  try {
    const body = await context.request.json();
    const email = (typeof body.email === "string" ? body.email : "")
      .trim()
      .toLowerCase()
      .slice(0, 254);

    if (!email || !EMAIL_RE.test(email)) {
      return new Response(JSON.stringify({ ok: false, error: "Invalid email" }), {
        status: 400,
        headers,
      });
    }

    // Check for duplicate
    const existing = await context.env.SUBSCRIBERS.get(email);
    if (existing) {
      return new Response(JSON.stringify({ ok: true, existing: true }), {
        status: 200,
        headers,
      });
    }

    const record = JSON.stringify({
      email,
      ts: new Date().toISOString(),
    });

    await context.env.SUBSCRIBERS.put(email, record);

    return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: "Server error" }), {
      status: 500,
      headers,
    });
  }
}

export async function onRequestOptions(context) {
  const headers = corsHeaders(context.request);
  return new Response(null, {
    headers: {
      ...headers,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
