import { asc, eq } from "drizzle-orm";
import { getChatGPTUser } from "../../chatgpt-auth";
import { getDb } from "../../../db";
import { players } from "../../../db/schema";
import { canPublish, ensureStaffProfile } from "../../../lib/staff";

const err = (e: unknown) => (e instanceof Error ? e.message : "Unexpected server error");

async function auth() {
  const user = await getChatGPTUser();
  return user ?? null;
}

// GET /api/players — list all players (staff only)
export async function GET() {
  const user = await auth();
  if (!user) return Response.json({ error: "Authentication required" }, { status: 401 });
  try {
    await ensureStaffProfile(user);
    const all = await getDb().select().from(players).orderBy(asc(players.displayOrder), asc(players.lastName));
    return Response.json({ players: all });
  } catch (e) {
    return Response.json({ error: err(e) }, { status: 500 });
  }
}

// POST /api/players — create a player
export async function POST(request: Request) {
  const user = await auth();
  if (!user) return Response.json({ error: "Authentication required" }, { status: 401 });
  try {
    const profile = await ensureStaffProfile(user);
    if (!canPublish(profile.role)) return Response.json({ error: "Your staff role cannot create players." }, { status: 403 });
    const data = (await request.json()) as Partial<typeof players.$inferInsert>;
    if (!data.firstName || !data.lastName || !data.position) {
      return Response.json({ error: "firstName, lastName, and position are required." }, { status: 400 });
    }
    const now = new Date().toISOString();
    const player = {
      id: crypto.randomUUID(),
      shirtNumber: data.shirtNumber ?? null,
      firstName: data.firstName,
      lastName: data.lastName,
      position: data.position as "goalkeeper" | "defender" | "midfielder" | "forward",
      squadRole: data.squadRole ?? null,
      nationality: data.nationality ?? null,
      bio: data.bio ?? null,
      photoUrl: data.photoUrl ?? null,
      status: (data.status ?? "active") as "active" | "historical" | "loan" | "injured",
      displayOrder: data.displayOrder ?? 999,
      createdAt: now,
      updatedAt: now,
    };
    await getDb().insert(players).values(player);
    return Response.json({ player }, { status: 201 });
  } catch (e) {
    return Response.json({ error: err(e) }, { status: 500 });
  }
}

// PATCH /api/players — update a player
export async function PATCH(request: Request) {
  const user = await auth();
  if (!user) return Response.json({ error: "Authentication required" }, { status: 401 });
  try {
    const profile = await ensureStaffProfile(user);
    if (!canPublish(profile.role)) return Response.json({ error: "Your staff role cannot edit players." }, { status: 403 });
    const data = (await request.json()) as { id?: string } & Partial<typeof players.$inferInsert>;
    if (!data.id) return Response.json({ error: "Player id required." }, { status: 400 });
    const now = new Date().toISOString();
    const { id, createdAt: _c, ...rest } = data;
    await getDb().update(players).set({ ...rest, updatedAt: now }).where(eq(players.id, id));
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: err(e) }, { status: 500 });
  }
}

// DELETE /api/players — delete a player
export async function DELETE(request: Request) {
  const user = await auth();
  if (!user) return Response.json({ error: "Authentication required" }, { status: 401 });
  try {
    const profile = await ensureStaffProfile(user);
    if (!canPublish(profile.role)) return Response.json({ error: "Your staff role cannot delete players." }, { status: 403 });
    const data = (await request.json()) as { id?: string };
    if (!data.id) return Response.json({ error: "Player id required." }, { status: 400 });
    await getDb().delete(players).where(eq(players.id, data.id));
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: err(e) }, { status: 500 });
  }
}
