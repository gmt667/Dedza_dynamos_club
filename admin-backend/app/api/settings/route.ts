import { getChatGPTUser } from "../../chatgpt-auth";
import { getDb } from "../../../db";
import { clubSettings } from "../../../db/schema";
import { ensureStaffProfile } from "../../../lib/staff";

const err = (e: unknown) => (e instanceof Error ? e.message : "Unexpected server error");

async function auth() {
  const user = await getChatGPTUser();
  return user ?? null;
}

// GET /api/settings — all settings (staff only)
export async function GET() {
  const user = await auth();
  if (!user) return Response.json({ error: "Authentication required" }, { status: 401 });
  try {
    await ensureStaffProfile(user);
    const rows = await getDb().select().from(clubSettings);
    const settings: Record<string, string> = {};
    for (const row of rows) settings[row.key] = row.value;
    return Response.json({ settings });
  } catch (e) {
    return Response.json({ error: err(e) }, { status: 500 });
  }
}

// PUT /api/settings — upsert settings (owner only)
export async function PUT(request: Request) {
  const user = await auth();
  if (!user) return Response.json({ error: "Authentication required" }, { status: 401 });
  try {
    const profile = await ensureStaffProfile(user);
    if (profile.role !== "owner") return Response.json({ error: "Only club owners can change settings." }, { status: 403 });
    const data = (await request.json()) as Record<string, string>;
    const now = new Date().toISOString();
    const db = getDb();
    const inserts = Object.entries(data).map(([key, value]) =>
      db.insert(clubSettings).values({ key, value, updatedAt: now }).onConflictDoUpdate({ target: clubSettings.key, set: { value, updatedAt: now } })
    );
    if (inserts.length > 0) {
      await (db.batch as any)(inserts);
    }
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: err(e) }, { status: 500 });
  }
}
