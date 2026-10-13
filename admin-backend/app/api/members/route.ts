import { desc, eq } from "drizzle-orm";
import { getChatGPTUser } from "../../chatgpt-auth";
import { getDb } from "../../../db";
import { members } from "../../../db/schema";
import { canPublish, ensureStaffProfile } from "../../../lib/staff";

const err = (e: unknown) => (e instanceof Error ? e.message : "Unexpected server error");

async function auth() {
  const user = await getChatGPTUser();
  return user ?? null;
}

// GET /api/members — list all supporter members (staff only)
export async function GET() {
  const user = await auth();
  if (!user) return Response.json({ error: "Authentication required" }, { status: 401 });
  try {
    await ensureStaffProfile(user);
    const all = await getDb().select().from(members).orderBy(desc(members.joinedAt));
    // Strip password hashes
    const safe = all.map(({ passwordHash: _p, ...rest }) => rest);
    return Response.json({ members: safe });
  } catch (e) {
    return Response.json({ error: err(e) }, { status: 500 });
  }
}

// POST /api/members — create a supporter member manually (staff only)
export async function POST(request: Request) {
  const user = await auth();
  if (!user) return Response.json({ error: "Authentication required" }, { status: 401 });
  try {
    const profile = await ensureStaffProfile(user);
    if (!canPublish(profile.role)) {
      return Response.json({ error: "Your staff role cannot create members." }, { status: 403 });
    }
    const data = (await request.json()) as Record<string, any>;
    if (!data.fullName || !data.email) {
      return Response.json({ error: "Full name and email are required." }, { status: 400 });
    }
    const now = new Date().toISOString();
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    const memberId = data.id || `DD-2026-${randomDigits}`;

    const member = {
      id: memberId,
      fullName: data.fullName,
      email: data.email,
      phone: data.phone || "",
      tier: (data.tier || "yellow") as "yellow" | "silver" | "gold",
      district: data.district || "Dedza",
      passwordHash: data.pin || null,
      favoritePlayer: data.favoritePlayer || null,
      status: (data.status || "active") as "active" | "suspended" | "expired",
      notificationPref: (data.notificationPref || "whatsapp") as "whatsapp" | "sms" | "email",
      joinedAt: now,
      updatedAt: now,
    };

    await getDb().insert(members).values(member);
    const { passwordHash: _p, ...safe } = member;
    return Response.json({ member: safe }, { status: 201 });
  } catch (e) {
    return Response.json({ error: err(e) }, { status: 500 });
  }
}

// PATCH /api/members — update a member's tier, district, status, etc.
export async function PATCH(request: Request) {
  const user = await auth();
  if (!user) return Response.json({ error: "Authentication required" }, { status: 401 });
  try {
    const profile = await ensureStaffProfile(user);
    if (!canPublish(profile.role)) {
      return Response.json({ error: "Your staff role cannot edit members." }, { status: 403 });
    }
    const data = (await request.json()) as Record<string, any>;
    if (!data.id) return Response.json({ error: "Member id is required." }, { status: 400 });

    const now = new Date().toISOString();
    const { id, joinedAt: _j, passwordHash: _p, ...rest } = data;
    await getDb().update(members).set({ ...rest, updatedAt: now }).where(eq(members.id, id));
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: err(e) }, { status: 500 });
  }
}

// DELETE /api/members — remove a member
export async function DELETE(request: Request) {
  const user = await auth();
  if (!user) return Response.json({ error: "Authentication required" }, { status: 401 });
  try {
    const profile = await ensureStaffProfile(user);
    if (!canPublish(profile.role)) {
      return Response.json({ error: "Your staff role cannot delete members." }, { status: 403 });
    }
    const data = (await request.json()) as { id?: string };
    if (!data.id) return Response.json({ error: "Member id is required." }, { status: 400 });

    await getDb().delete(members).where(eq(members.id, data.id));
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: err(e) }, { status: 500 });
  }
}
