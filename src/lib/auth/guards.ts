import { redirect } from "next/navigation";
import { getSessionUser, type SessionUser } from "@/lib/auth/session";
import type { UserRole } from "@/db/schema";
import { dashboardPathForRole } from "@/lib/utils";

export async function requirePageUser(roles?: UserRole[]): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (roles && !roles.includes(user.role)) {
    redirect(dashboardPathForRole(user.role));
  }
  return user;
}
