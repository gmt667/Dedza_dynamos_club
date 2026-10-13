import { requireChatGPTUser } from "./chatgpt-auth";
import StaffDashboard from "../components/staff-dashboard";
import { ensureStaffProfile } from "../lib/staff";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await requireChatGPTUser("/");
  const profile = await ensureStaffProfile(user);
  return <StaffDashboard userName={user.displayName} role={profile.role} />;
}
