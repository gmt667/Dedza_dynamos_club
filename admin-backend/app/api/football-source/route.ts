import { getChatGPTUser } from "../../chatgpt-auth";
import { getMergedFootballData } from "../../../lib/football";
import { ensureStaffProfile } from "../../../lib/staff";

export async function GET() {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "Authentication required" }, { status: 401 });
  try {
    await ensureStaffProfile(user);
    const data = await getMergedFootballData();
    return Response.json({ ...data, source: data.staffSource });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Football data is unavailable." }, { status: 503 });
  }
}
