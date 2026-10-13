const ROUTES = new Map([
  ["/api/public/updates", { upstream: "/api/public/updates", cache: "public, max-age=60, s-maxage=300, stale-while-revalidate=600", methods: ["GET"] }],
  ["/api/public/news", { upstream: "/api/public/news", cache: "public, max-age=300, s-maxage=900, stale-while-revalidate=3600", methods: ["GET"] }],
  ["/api/public/live-football", { upstream: "/api/public/live-football", cache: "public, max-age=120, s-maxage=300, stale-while-revalidate=3600", methods: ["GET"] }],
  ["/api/public/matches", { upstream: "/api/public/matches", cache: "public, max-age=60, s-maxage=300", methods: ["GET"] }],
  ["/api/public/players", { upstream: "/api/public/players", cache: "public, max-age=120, s-maxage=300", methods: ["GET"] }],
  ["/api/public/partners", { upstream: "/api/public/partners", cache: "public, max-age=120, s-maxage=300", methods: ["GET"] }],
  ["/api/public/media", { upstream: "/api/public/media", cache: "public, max-age=120, s-maxage=300", methods: ["GET"] }],
  ["/api/public/media-file", { upstream: "/api/public/media-file", cache: "public, max-age=86400", methods: ["GET"] }],
]);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Max-Age": "86400",
  Vary: "Origin",
};

function json(body, status = 200, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", ...corsHeaders, ...headers },
  });
}

export default {
  async fetch(request, env, ctx) {
    void ctx;
    const url = new URL(request.url);
    const route = ROUTES.get(url.pathname);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (!route || !(route.methods || ["GET"]).includes(request.method)) {
      return json({ error: "Not found" }, 404);
    }

    if (!env.ADMIN_ORIGIN || !env.ADMIN_SITES_TOKEN) {
      return json({ error: "Public data service is not configured." }, 503, { "Cache-Control": "no-store" });
    }

    try {
      const target = new URL(route.upstream, env.ADMIN_ORIGIN);
      target.search = url.search;
      const reqHeaders = {
        "OAI-Sites-Authorization": `Bearer ${env.ADMIN_SITES_TOKEN}`,
        Accept: "application/json",
      };
      const upstream = await fetch(target, {
        method: "GET",
        headers: reqHeaders,
        cf: { cacheTtl: 0 },
      });
      const text = await upstream.text();
      const contentType = upstream.headers.get("content-type") || "application/json; charset=utf-8";
      return new Response(text, {
        status: upstream.status,
        headers: {
          ...corsHeaders,
          "content-type": contentType,
          "Cache-Control": upstream.ok ? route.cache : "public, max-age=30, s-maxage=60",
        },
      });
    } catch {
      return json({ error: "Official football and club update data is temporarily unavailable." }, 503, { "Cache-Control": "public, max-age=30, s-maxage=60" });
    }
  },
};
