import { eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { members } from "../../../../db/schema";

export async function GET() {
  try {
    const activeMembers = await getDb()
      .select({ tier: members.tier })
      .from(members)
      .where(eq(members.status, "active"));

    return Response.json(
      {
        totalMembers: activeMembers.length,
        tiers: {
          yellow: activeMembers.filter((member) => member.tier === "yellow").length,
          silver: activeMembers.filter((member) => member.tier === "silver").length,
          gold: activeMembers.filter((member) => member.tier === "gold").length,
        },
      },
      { headers: { "Access-Control-Allow-Origin": "*", "Cache-Control": "public, max-age=60, s-maxage=300" } },
    );
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unexpected server error" },
      { status: 500, headers: { "Access-Control-Allow-Origin": "*" } },
    );
  }
}
