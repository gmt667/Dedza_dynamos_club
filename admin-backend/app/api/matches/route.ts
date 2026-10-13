import { desc, eq } from "drizzle-orm";
import { getChatGPTUser } from "../../chatgpt-auth";
import { getDb } from "../../../db";
import { matches } from "../../../db/schema";
import { canPublish, ensureStaffProfile } from "../../../lib/staff";

const err = (e: unknown) => (e instanceof Error ? e.message : "Unexpected server error");

async function auth() {
  const user = await getChatGPTUser();
  return user ?? null;
}

// GET /api/matches — list all matches (staff only)
export async function GET() {
  const user = await auth();
  if (!user) return Response.json({ error: "Authentication required" }, { status: 401 });
  try {
    await ensureStaffProfile(user);
    const all = await getDb().select().from(matches).orderBy(desc(matches.date));
    return Response.json({ matches: all });
  } catch (e) {
    return Response.json({ error: err(e) }, { status: 500 });
  }
}

// POST /api/matches — create a match
export async function POST(request: Request) {
  const user = await auth();
  if (!user) return Response.json({ error: "Authentication required" }, { status: 401 });
  try {
    const profile = await ensureStaffProfile(user);
    if (!canPublish(profile.role)) return Response.json({ error: "Your staff role cannot create matches." }, { status: 403 });
    const data = (await request.json()) as Partial<typeof matches.$inferInsert>;
    if (!data.date || !data.home || !data.away || !data.venue || !data.competition) {
      return Response.json({ error: "date, home, away, venue, and competition are required." }, { status: 400 });
    }
    const now = new Date().toISOString();
    const match = {
      id: crypto.randomUUID(),
      date: data.date,
      time: data.time ?? "14:30",
      home: data.home,
      away: data.away,
      venue: data.venue,
      competition: data.competition,
      status: (data.status ?? "upcoming") as "upcoming" | "full_time" | "postponed",
      score: data.score ?? "",
      round: data.round ?? null,
      createdAt: now,
      updatedAt: now,
    };
    await getDb().insert(matches).values(match);
    return Response.json({ match }, { status: 201 });
  } catch (e) {
    return Response.json({ error: err(e) }, { status: 500 });
  }
}

// PATCH /api/matches — update a match
export async function PATCH(request: Request) {
  const user = await auth();
  if (!user) return Response.json({ error: "Authentication required" }, { status: 401 });
  try {
    const profile = await ensureStaffProfile(user);
    if (!canPublish(profile.role)) return Response.json({ error: "Your staff role cannot edit matches." }, { status: 403 });
    const data = (await request.json()) as { id?: string } & Partial<typeof matches.$inferInsert>;
    if (!data.id) return Response.json({ error: "Match id required." }, { status: 400 });
    const now = new Date().toISOString();
    const { id, createdAt: _c, ...rest } = data;
    await getDb().update(matches).set({ ...rest, updatedAt: now }).where(eq(matches.id, id));
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: err(e) }, { status: 500 });
  }
}

// DELETE /api/matches — delete a match
export async function DELETE(request: Request) {
  const user = await auth();
  if (!user) return Response.json({ error: "Authentication required" }, { status: 401 });
  try {
    const profile = await ensureStaffProfile(user);
    if (!canPublish(profile.role)) return Response.json({ error: "Your staff role cannot delete matches." }, { status: 403 });
    const data = (await request.json()) as { id?: string };
    if (!data.id) return Response.json({ error: "Match id required." }, { status: 400 });
    await getDb().delete(matches).where(eq(matches.id, data.id));
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: err(e) }, { status: 500 });
  }
}
