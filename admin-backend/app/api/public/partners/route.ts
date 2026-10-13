import { eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { partners } from "../../../../db/schema";

export async function GET() {
  try {
    const results = await getDb()
      .select()
      .from(partners)
      .where(eq(partners.status, "active"));

    return Response.json(
      { partners: results },
      { headers: { "Access-Control-Allow-Origin": "*", "Cache-Control": "public, max-age=600, s-maxage=1800" } }
    );
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unexpected server error" },
      { status: 500, headers: { "Access-Control-Allow-Origin": "*" } }
    );
  }
}
