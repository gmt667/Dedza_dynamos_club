import { and, desc, eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { clubUpdates } from "../../../../db/schema";

export async function GET() {
  try {
    const updates = await getDb().select({ id: clubUpdates.id, title: clubUpdates.title, summary: clubUpdates.summary, publishedAt: clubUpdates.publishedAt, authorName: clubUpdates.authorName }).from(clubUpdates).where(and(eq(clubUpdates.status, "published"), eq(clubUpdates.audience, "public"))).orderBy(desc(clubUpdates.publishedAt)).limit(24);
    return Response.json({ updates }, { headers: { "Access-Control-Allow-Origin": "*", "Cache-Control": "public, max-age=60, s-maxage=300" } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unexpected server error" }, { status: 500, headers: { "Access-Control-Allow-Origin": "*" } });
  }
}
