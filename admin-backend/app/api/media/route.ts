import { desc, eq } from "drizzle-orm";
import { getChatGPTUser } from "../../chatgpt-auth";
import { getDb } from "../../../db";
import { media } from "../../../db/schema";
import { canPublish, ensureStaffProfile } from "../../../lib/staff";

const auth = async () => {
  const user = await getChatGPTUser();
  if (!user) return null;
  return { user, profile: await ensureStaffProfile(user) };
};

export async function GET() {
  const session = await auth();
  if (!session) return Response.json({ error: "Authentication required" }, { status: 401 });
  return Response.json({ media: await getDb().select().from(media).orderBy(desc(media.date), desc(media.createdAt)) });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session) return Response.json({ error: "Authentication required" }, { status: 401 });
  if (!canPublish(session.profile.role)) return Response.json({ error: "Your role cannot publish media." }, { status: 403 });
  const data = await request.json() as Partial<typeof media.$inferInsert>;
  if (!data.title?.trim() || !data.url?.trim()) return Response.json({ error: "Title and video URL are required." }, { status: 400 });
  const now = new Date().toISOString();
  const item = { id: crypto.randomUUID(), title: data.title.trim(), type: "video" as const, category: data.category?.trim() || "match", url: data.url.trim(), thumbnailUrl: data.thumbnailUrl?.trim() || null, date: data.date || now.slice(0, 10), createdAt: now, updatedAt: now };
  await getDb().insert(media).values(item);
  return Response.json({ media: item }, { status: 201 });
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session) return Response.json({ error: "Authentication required" }, { status: 401 });
  if (!canPublish(session.profile.role)) return Response.json({ error: "Your role cannot remove media." }, { status: 403 });
  const { id } = await request.json() as { id?: string };
  if (!id) return Response.json({ error: "Media id required." }, { status: 400 });
  await getDb().delete(media).where(eq(media.id, id));
  return Response.json({ ok: true });
}
