import { desc, eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { media } from "../../../../db/schema";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const type = url.searchParams.get("type"); // "video" | "photo"
  const category = url.searchParams.get("category");
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "20", 10), 100);

  try {
    const db = getDb();
    let query = db.select().from(media).orderBy(desc(media.date), desc(media.createdAt)).limit(limit);

    if (type === "video" || type === "photo") {
      query = db.select().from(media).where(eq(media.type, type)).orderBy(desc(media.date), desc(media.createdAt)).limit(limit) as typeof query;
    } else if (category) {
      query = db.select().from(media).where(eq(media.category, category)).orderBy(desc(media.date), desc(media.createdAt)).limit(limit) as typeof query;
    }

    const results = await query;
    return Response.json(
      { media: results },
      { headers: { "Access-Control-Allow-Origin": "*", "Cache-Control": "public, max-age=300, s-maxage=600" } }
    );
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unexpected server error" },
      { status: 500, headers: { "Access-Control-Allow-Origin": "*" } }
    );
  }
}
