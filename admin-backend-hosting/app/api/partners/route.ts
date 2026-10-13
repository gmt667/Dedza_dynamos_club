import { eq } from "drizzle-orm";
import { getChatGPTUser } from "../../chatgpt-auth";
import { getDb } from "../../../db";
import { partners } from "../../../db/schema";
import { canPublish, ensureStaffProfile } from "../../../lib/staff";

const err = (e: unknown) => (e instanceof Error ? e.message : "Unexpected server error");

async function auth() {
  const user = await getChatGPTUser();
  return user ?? null;
}

export async function GET() {
  const user = await auth();
  if (!user) return Response.json({ error: "Authentication required" }, { status: 401 });
  try {
    await ensureStaffProfile(user);
    const all = await getDb().select().from(partners);
    return Response.json({ partners: all });
  } catch (e) {
    return Response.json({ error: err(e) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await auth();
  if (!user) return Response.json({ error: "Authentication required" }, { status: 401 });
  try {
    const profile = await ensureStaffProfile(user);
    if (!canPublish(profile.role)) return Response.json({ error: "Your staff role cannot create partners." }, { status: 403 });
    const data = (await request.json()) as Partial<typeof partners.$inferInsert>;
    if (!data.name || !data.category) return Response.json({ error: "name and category are required." }, { status: 400 });
    const now = new Date().toISOString();
    const partner = {
      id: crypto.randomUUID(),
      name: data.name,
      category: data.category,
      tier: (data.tier ?? "commercial") as "platinum" | "gold" | "silver" | "commercial",
      status: (data.status ?? "active") as "active" | "inactive",
      url: data.url ?? null,
      logoUrl: data.logoUrl ?? null,
      createdAt: now,
      updatedAt: now,
    };
    await getDb().insert(partners).values(partner);
    return Response.json({ partner }, { status: 201 });
  } catch (e) {
    return Response.json({ error: err(e) }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const user = await auth();
  if (!user) return Response.json({ error: "Authentication required" }, { status: 401 });
  try {
    const profile = await ensureStaffProfile(user);
    if (!canPublish(profile.role)) return Response.json({ error: "Your staff role cannot edit partners." }, { status: 403 });
    const data = (await request.json()) as { id?: string } & Partial<typeof partners.$inferInsert>;
    if (!data.id) return Response.json({ error: "Partner id required." }, { status: 400 });
    const now = new Date().toISOString();
    const { id, createdAt: _c, ...rest } = data;
    await getDb().update(partners).set({ ...rest, updatedAt: now }).where(eq(partners.id, id));
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: err(e) }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const user = await auth();
  if (!user) return Response.json({ error: "Authentication required" }, { status: 401 });
  try {
    const profile = await ensureStaffProfile(user);
    if (!canPublish(profile.role)) return Response.json({ error: "Your staff role cannot delete partners." }, { status: 403 });
    const data = (await request.json()) as { id?: string };
    if (!data.id) return Response.json({ error: "Partner id required." }, { status: 400 });
    await getDb().delete(partners).where(eq(partners.id, data.id));
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: err(e) }, { status: 500 });
  }
}
