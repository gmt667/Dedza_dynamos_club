import { asc, desc, eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { matches } from "../../../../db/schema";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const status = url.searchParams.get("status"); // "upcoming" | "full_time" | "postponed"
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "20", 10), 50);

  try {
    const db = getDb();
    let query = db.select().from(matches);

    if (status === "upcoming") {
      query = query.where(eq(matches.status, "upcoming")).orderBy(asc(matches.date)).limit(limit) as typeof query;
    } else if (status === "full_time") {
      query = query.where(eq(matches.status, "full_time")).orderBy(desc(matches.date)).limit(limit) as typeof query;
    } else {
      query = query.orderBy(desc(matches.date)).limit(limit) as typeof query;
    }

    const results = await query;
    return Response.json(
      { matches: results },
      { headers: { "Access-Control-Allow-Origin": "*", "Cache-Control": "public, max-age=120, s-maxage=300" } }
    );
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unexpected server error" },
      { status: 500, headers: { "Access-Control-Allow-Origin": "*" } }
    );
  }
}
