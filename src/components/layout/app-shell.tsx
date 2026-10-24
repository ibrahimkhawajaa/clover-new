"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
  /** Exact path match only (avoid /client matching /client/account) */
  exact?: boolean;
  /** Additional path prefixes that mark this item active */
  alsoActiveFor?: string[];
};

function isActive(pathname: string, item: NavItem) {
  if (item.alsoActiveFor?.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return true;
  }
  if (item.exact) return pathname === item.href;
  if (pathname === item.href) return true;
  return pathname.startsWith(item.href + "/");
}

export function AppShell({
  title,
  nav,
  bottomNav,
  userName,
  children,
  variant = "sidebar",
  showBell = false,
}: {
  title: string;
  nav: NavItem[];
  /** Mobile bottom bar; defaults to `nav` when omitted */
  bottomNav?: NavItem[];
  userName: string;
  children: React.ReactNode;
  variant?: "sidebar" | "mobile";
  showBell?: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const mobileItems = bottomNav ?? nav;

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const SidebarNav = (
    <nav className="flex flex-col gap-1 p-3">
      {nav.map((item) => {
        const active = isActive(pathname, item);
        return (
          <Link
            key={`${item.href}-${item.label}`}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-secondary-container/30 text-secondary-container"
                : "text-on-primary-container/80 hover:bg-white/5 hover:text-secondary-container"
            )}
          >
            {item.icon}
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  const BottomNav = (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-outline-variant/40 bg-surface-container-lowest/95 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-md md:hidden">
      <ul className="mx-auto flex max-w-lg items-stretch justify-around gap-1">
        {mobileItems.map((item) => {
          const active = isActive(pathname, item);
          return (
            <li key={`${item.href}-${item.label}`} className="min-w-0 flex-1">
              <Link
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[10px] font-semibold transition-all",
                  active
                    ? "bg-secondary-container text-on-secondary-container shadow-soft"
                    : "text-on-surface-variant hover:bg-surface-container"
                )}
              >
                <span className={cn("[&_svg]:h-5 [&_svg]:w-5", active && "text-primary")}>
                  {item.icon}
                </span>
                <span className="truncate">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );

  const TopBar = (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-outline-variant/30 bg-surface/90 px-4 py-3 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <Image
          src="/clover-logo.png"
          alt="Clover"
          width={36}
          height={36}
          className="h-9 w-9 object-contain"
        />
        <div>
          <p className="text-sm font-bold tracking-wide text-primary">Clover Community</p>
          <p className="text-[11px] text-on-surface-variant">{title}</p>
        </div>
      </div>
      <div className="flex items-center gap-1">
        {showBell ? (
          <Button variant="ghost" size="icon" className="rounded-full" aria-label="Notifications">
            <Bell className="h-5 w-5 text-on-surface-variant" />
          </Button>
        ) : null}
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full"
          onClick={logout}
          aria-label="Sign out"
        >
          <LogOut className="h-5 w-5 text-on-surface-variant" />
        </Button>
      </div>
    </header>
  );

  if (variant === "mobile") {
    return (
      <div className="min-h-screen bg-surface text-on-background">
        {TopBar}
        <main className="mx-auto max-w-3xl px-4 pb-28 pt-6">{children}</main>
        {BottomNav}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface text-on-background">
      <div className="flex min-h-screen">
        <aside className="hidden w-64 shrink-0 flex-col bg-primary md:flex">
          <div className="flex items-center gap-3 border-b border-white/10 p-5">
            <Image
              src="/clover-logo.png"
              alt="Clover"
              width={40}
              height={40}
              className="h-10 w-10 object-contain brightness-0 invert"
            />
            <div>
              <p className="text-sm font-bold tracking-wide text-secondary-container">CLOVER</p>
              <p className="text-[11px] text-on-primary-container">{title}</p>
            </div>
          </div>
          {SidebarNav}
          <div className="mt-auto border-t border-white/10 p-4">
            <p className="mb-2 truncate text-sm font-medium text-secondary-container">{userName}</p>
            <Button
              variant="outline"
              size="sm"
              className="w-full border-white/20 bg-transparent text-secondary-container hover:bg-white/10 hover:text-secondary-container"
              onClick={logout}
            >
              <LogOut className="h-4 w-4" /> Sign out
            </Button>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="md:hidden">{TopBar}</div>
          <main className="flex-1 px-4 pb-28 pt-6 md:p-8 md:pb-8">{children}</main>
          {BottomNav}
        </div>
      </div>
    </div>
  );
}
