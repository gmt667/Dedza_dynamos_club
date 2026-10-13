import { getDb } from "../../../../db";
import { clubSettings } from "../../../../db/schema";

export async function GET() {
  try {
    const rows = await getDb().select().from(clubSettings);
    // Convert key-value rows to a plain object
    const settings: Record<string, string> = {};
    for (const row of rows) {
      settings[row.key] = row.value;
    }
    return Response.json(
      { settings },
      { headers: { "Access-Control-Allow-Origin": "*", "Cache-Control": "public, max-age=3600, s-maxage=7200" } }
    );
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unexpected server error" },
      { status: 500, headers: { "Access-Control-Allow-Origin": "*" } }
    );
  }
}
