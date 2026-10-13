import { asc, eq } from "drizzle-orm";
import type { ChatGPTUser } from "../app/chatgpt-auth";
import { getDb } from "../db";
import { staffProfiles } from "../db/schema";

export type StaffRole = "owner" | "editor" | "viewer";

export async function ensureStaffProfile(user: ChatGPTUser) {
  const db = getDb();
  const existing = await db.select().from(staffProfiles).where(eq(staffProfiles.userId, user.userId)).get();
  if (existing) return existing;

  const firstProfile = await db.select({ userId: staffProfiles.userId }).from(staffProfiles).orderBy(asc(staffProfiles.createdAt)).limit(1);
  const role: StaffRole = firstProfile.length === 0 ? "owner" : "viewer";
  const now = new Date().toISOString();
  const profile = { userId: user.userId, displayName: user.displayName, email: user.email, role, createdAt: now, updatedAt: now };
  await db.insert(staffProfiles).values(profile);
  return profile;
}

export function canPublish(role: StaffRole) {
  return role === "owner" || role === "editor";
}
