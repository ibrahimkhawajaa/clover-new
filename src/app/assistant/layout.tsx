import { Briefcase, LayoutDashboard, Ticket, UserRound } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { requirePageUser } from "@/lib/auth/guards";

const nav = [
  {
    href: "/assistant",
    label: "Dashboard",
    icon: <LayoutDashboard className="h-4 w-4" />,
    exact: true,
  },
  {
    href: "/assistant",
    label: "Tickets",
    icon: <Ticket className="h-4 w-4" />,
    exact: true,
    alsoActiveFor: ["/assistant/tickets"],
  },
  {
    href: "/assistant/workload",
    label: "Workload",
    icon: <Briefcase className="h-4 w-4" />,
    exact: true,
  },
  {
    href: "/assistant/workload",
    label: "Account",
    icon: <UserRound className="h-4 w-4" />,
    exact: true,
  },
];

export default async function AssistantLayout({ children }: { children: React.ReactNode }) {
  const user = await requirePageUser(["assistant"]);

  return (
    <AppShell variant="mobile" title="Assistant" nav={nav} userName={user.name} showBell>
      {children}
    </AppShell>
  );
}
