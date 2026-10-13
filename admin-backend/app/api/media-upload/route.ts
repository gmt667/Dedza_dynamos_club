import { env } from "cloudflare:workers";
import { getChatGPTUser } from "../../chatgpt-auth";
import { canPublish, ensureStaffProfile } from "../../../lib/staff";

const allowed = new Set(["video/mp4", "video/webm", "video/quicktime"]);

export async function POST(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "Authentication required" }, { status: 401 });
  const profile = await ensureStaffProfile(user);
  if (!canPublish(profile.role)) return Response.json({ error: "Your role cannot upload media." }, { status: 403 });
  if (!env.BUCKET) return Response.json({ error: "Video storage is not configured." }, { status: 503 });
  const form = await request.formData();
  const file = form.get("video");
  if (!(file instanceof File)) return Response.json({ error: "Choose a video file." }, { status: 400 });
  if (!allowed.has(file.type)) return Response.json({ error: "Upload an MP4, WebM, or MOV clip." }, { status: 415 });
  if (file.size > 80 * 1024 * 1024) return Response.json({ error: "Clips must be 80 MB or smaller." }, { status: 413 });
  const extension = file.name.split(".").pop()?.replace(/[^a-z0-9]/gi, "").toLowerCase() || "mp4";
  const key = `videos/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${extension}`;
  await env.BUCKET.put(key, file.stream(), { httpMetadata: { contentType: file.type }, customMetadata: { uploadedBy: user.userId, originalName: file.name } });
  return Response.json({ url: `/api/public/media-file?key=${encodeURIComponent(key)}` }, { status: 201 });
}
