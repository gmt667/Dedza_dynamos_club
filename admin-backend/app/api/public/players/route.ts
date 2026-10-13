import { and, asc, eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { players } from "../../../../db/schema";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const position = url.searchParams.get("position"); // filter by position

  try {
    const db = getDb();
    const allowedPositions = ["goalkeeper", "defender", "midfielder", "forward"] as const;
    const safePosition = allowedPositions.find((item) => item === position);
    const where = safePosition
      ? and(eq(players.status, "active"), eq(players.position, safePosition))
      : eq(players.status, "active");
    const query = db
      .select()
      .from(players)
      .where(where)
      .orderBy(asc(players.displayOrder), asc(players.lastName));

    const results = await query;
    return Response.json(
      { players: results },
      { headers: { "Access-Control-Allow-Origin": "*", "Cache-Control": "public, max-age=300, s-maxage=600" } }
    );
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unexpected server error" },
      { status: 500, headers: { "Access-Control-Allow-Origin": "*" } }
    );
  }
}
