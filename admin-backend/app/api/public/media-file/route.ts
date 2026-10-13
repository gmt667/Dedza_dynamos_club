import { env } from "cloudflare:workers";

export async function GET(request: Request) {
  if (!env.BUCKET) return new Response("Media storage unavailable", { status: 503 });
  const key = new URL(request.url).searchParams.get("key");
  if (!key || !key.startsWith("videos/")) return new Response("Not found", { status: 404 });
  const object = await env.BUCKET.get(key);
  if (!object) return new Response("Not found", { status: 404 });
  const headers = new Headers({ "Cache-Control": "public, max-age=86400", "Access-Control-Allow-Origin": "*", "Accept-Ranges": "bytes" });
  object.writeHttpMetadata(headers);
  return new Response(object.body, { headers });
}
