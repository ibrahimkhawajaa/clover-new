import {
  ClipboardList,
  LayoutDashboard,
  MessageSquare,
  Settings,
  Ticket,
  UserRound,
  Users,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { requirePageUser } from "@/lib/auth/guards";

const nav = [
  {
    href: "/admin",
    label: "Dashboard",
    icon: <LayoutDashboard className="h-4 w-4" />,
    exact: true,
  },
  { href: "/admin/tickets", label: "Tickets", icon: <Ticket className="h-4 w-4" /> },
  { href: "/admin/users", label: "Users", icon: <Users className="h-4 w-4" /> },
  {
    href: "/admin/sessions",
    label: "Chat sessions",
    icon: <MessageSquare className="h-4 w-4" />,
  },
  { href: "/admin/audit", label: "Audit", icon: <ClipboardList className="h-4 w-4" /> },
  { href: "/admin/settings", label: "Settings", icon: <Settings className="h-4 w-4" /> },
];

const bottomNav = [
  {
    href: "/admin",
    label: "Dashboard",
    icon: <LayoutDashboard className="h-4 w-4" />,
    exact: true,
  },
  { href: "/admin/tickets", label: "Tickets", icon: <Ticket className="h-4 w-4" /> },
  { href: "/admin/users", label: "Users", icon: <Users className="h-4 w-4" /> },
  { href: "/admin/settings", label: "Profile", icon: <UserRound className="h-4 w-4" /> },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requirePageUser(["admin"]);

  return (
    <AppShell
      variant="sidebar"
      title="Owner Dashboard"
      nav={nav}
      bottomNav={bottomNav}
      userName={user.name}
    >
      {children}
    </AppShell>
  );
}
