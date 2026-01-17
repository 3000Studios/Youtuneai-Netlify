import { onRequestPost as handleOrchestrator } from "./functions/orchestrator.js";

const jsonResponse = (status, payload) =>
  addSecurityHeaders(
    new Response(JSON.stringify(payload), {
      status,
      headers: { "Content-Type": "application/json" },
    })
  );

const addSecurityHeaders = (response) => {
  const headers = new Headers(response.headers);
  headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("X-Frame-Options", "SAMEORIGIN");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("Permissions-Policy", "geolocation=(), microphone=(), camera=()");
  return new Response(response.body, { ...response, headers });
};

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const cleanPath = url.pathname.replace(/\/$/, "");

    const retiredPaths = new Set([
      "/gallery",
      "/livestream",
      "/blog",
      "/store",
      "/appstore",
      "/referrals",
      "/projects",
    ]);

    if (retiredPaths.has(cleanPath)) {
      return addSecurityHeaders(Response.redirect(`${url.origin}/`, 301));
    }

    if (url.pathname === "/.netlify/functions/orchestrator") {
      if (request.method !== "POST") {
        return jsonResponse(405, { error: "Method not allowed." });
      }
      // Delegate to the Cloudflare function implementation for orchestration.
      const res = await handleOrchestrator({ request, env, ctx });
      return addSecurityHeaders(res);
    }

    if (url.pathname === "/admin" || url.pathname.startsWith("/admin/")) {
      const adminUrl = new URL("/admin/index.html", url.origin);
      const res = await env.ASSETS.fetch(new Request(adminUrl, request));
      return addSecurityHeaders(res);
    }

    // Default: serve the built static assets from ./dist.
    const res = await env.ASSETS.fetch(request);
    return addSecurityHeaders(res);
  },
};
