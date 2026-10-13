import { getExternalNews } from "../../../../lib/external-news";

export async function GET() {
  try {
    return Response.json({ news: await getExternalNews() }, { headers: { "Access-Control-Allow-Origin": "*", "Cache-Control": "public, max-age=300, s-maxage=900, stale-while-revalidate=3600" } });
  } catch {
    return Response.json({ news: [] }, { headers: { "Access-Control-Allow-Origin": "*", "Cache-Control": "public, max-age=60" } });
  }
}
