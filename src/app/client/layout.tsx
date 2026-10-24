import { LayoutDashboard, Settings, Ticket, UserRound } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { requirePageUser } from "@/lib/auth/guards";

const nav = [
  {
    href: "/client",
    label: "Dashboard",
    icon: <LayoutDashboard className="h-4 w-4" />,
    exact: true,
  },
  {
    href: "/client/tickets",
    label: "Tickets",
    icon: <Ticket className="h-4 w-4" />,
    alsoActiveFor: ["/client/tickets"],
  },
  {
    href: "/client/profile",
    label: "Profile",
    icon: <UserRound className="h-4 w-4" />,
  },
  {
    href: "/client/settings",
    label: "Settings",
    icon: <Settings className="h-4 w-4" />,
  },
];

export default async function ClientLayout({ children }: { children: React.ReactNode }) {
  const user = await requirePageUser(["client"]);

  return (
    <AppShell
      variant="mobile"
      title="Client portal"
      nav={nav}
      userName={user.name}
      showBell
    >
      {children}
    </AppShell>
  );
}
