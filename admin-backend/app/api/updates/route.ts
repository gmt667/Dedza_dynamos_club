import { desc, eq } from "drizzle-orm";
import { getChatGPTUser } from "../../chatgpt-auth";
import { getDb } from "../../../db";
import { auditEvents, clubUpdates } from "../../../db/schema";
import { canPublish, ensureStaffProfile } from "../../../lib/staff";

const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Unexpected server error";

async function authenticatedUser() {
  const user = await getChatGPTUser();
  if (!user) return null;
  return user;
}

export async function GET() {
  const user = await authenticatedUser();
  if (!user) {
    return Response.json({ error: "Authentication required" }, { status: 401 });
  }
  try {
    await ensureStaffProfile(user);
    const updates = await getDb()
      .select()
      .from(clubUpdates)
      .orderBy(desc(clubUpdates.updatedAt), desc(clubUpdates.id));
    return Response.json({ updates });
  } catch (error) {
    return Response.json({ error: errorMessage(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await authenticatedUser();
  if (!user) return Response.json({ error: "Authentication required" }, { status: 401 });
  try {
    const profile = await ensureStaffProfile(user);
    const data = (await request.json()) as { title?: string; summary?: string; publish?: boolean };
    const title = data.title?.trim() ?? "";
    const summary = data.summary?.trim() ?? "";
    if (!title || !summary) return Response.json({ error: "A title and summary are required." }, { status: 400 });
    if (title.length > 140 || summary.length > 2000) return Response.json({ error: "Keep the title below 140 characters and the summary below 2,000." }, { status: 400 });
    if (data.publish && !canPublish(profile.role)) return Response.json({ error: "Your staff role can save drafts but cannot publish." }, { status: 403 });
    const now = new Date().toISOString();
    const update = { id: crypto.randomUUID(), title, summary, status: data.publish ? "published" as const : "draft" as const, authorId: user.userId, authorName: user.displayName, audience: "public" as const, publishedAt: data.publish ? now : null, createdAt: now, updatedAt: now };
    const db = getDb();
    await db.batch([db.insert(clubUpdates).values(update), db.insert(auditEvents).values({ id: crypto.randomUUID(), actorId: user.userId, actorName: user.displayName, action: data.publish ? "published" : "created_draft", entityType: "club_update", entityId: update.id, detail: title, createdAt: now })]);
    return Response.json({ update }, { status: 201 });
  } catch (error) {
    return Response.json({ error: errorMessage(error) }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const user = await authenticatedUser();
  if (!user) return Response.json({ error: "Authentication required" }, { status: 401 });
  try {
    const profile = await ensureStaffProfile(user);
    if (!canPublish(profile.role)) return Response.json({ error: "Your staff role cannot change publication status." }, { status: 403 });
    const data = (await request.json()) as { id?: string; publish?: boolean; title?: string; summary?: string };
    if (!data.id) return Response.json({ error: "An update id is required." }, { status: 400 });
    const now = new Date().toISOString();
    const db = getDb();
    const existing = await db.select({ id: clubUpdates.id, title: clubUpdates.title }).from(clubUpdates).where(eq(clubUpdates.id, data.id)).get();
    if (!existing) return Response.json({ error: "Update not found." }, { status: 404 });
    const title = data.title?.trim();
    const summary = data.summary?.trim();
    if ((data.title !== undefined && !title) || (data.summary !== undefined && !summary)) return Response.json({ error: "Title and summary cannot be empty." }, { status: 400 });
    if ((title?.length ?? 0) > 140 || (summary?.length ?? 0) > 2000) return Response.json({ error: "Keep the title below 140 characters and the summary below 2,000." }, { status: 400 });
    const changes: Partial<typeof clubUpdates.$inferInsert> = { updatedAt: now };
    if (typeof data.publish === "boolean") {
      changes.status = data.publish ? "published" : "draft";
      changes.publishedAt = data.publish ? now : null;
    }
    if (title !== undefined) changes.title = title;
    if (summary !== undefined) changes.summary = summary;
    const action = title !== undefined || summary !== undefined ? "edited" : data.publish ? "published" : "unpublished";
    await db.batch([db.update(clubUpdates).set(changes).where(eq(clubUpdates.id, data.id)), db.insert(auditEvents).values({ id: crypto.randomUUID(), actorId: user.userId, actorName: user.displayName, action, entityType: "club_update", entityId: data.id, detail: title ?? existing.title, createdAt: now })]);
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: errorMessage(error) }, { status: 500 });
  }
}
