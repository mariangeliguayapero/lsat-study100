"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NavUser } from "@/components/layout/nav-user";
import {
  BarChart3,
  BookOpen,
  Brain,
  ClipboardList,
  CreditCard,
  GraduationCap,
  LibraryBig,
  LayoutDashboard,
  Scale,
  UserRound,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/queue", label: "Progress", icon: BarChart3 },
  { href: "/learning", label: "Review", icon: ClipboardList },
  { href: "/study-library", label: "Study Library", icon: LibraryBig },
  { href: "/mentor", label: "Mentor", icon: Brain },
  { href: "/profile", label: "Profile", icon: UserRound },
  { href: "/my-learning", label: "Learn", icon: BookOpen },
  { href: "/full-sat", label: "Full LSAT", icon: GraduationCap },
  { href: "/pricing", label: "Billing", icon: CreditCard },
];

export { navItems as protectedNavItems };

export function isProtectedNavItemActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  if (href === "/learning") return pathname === "/learning";
  if (href === "/study-library") {
    return pathname.startsWith("/study-library") || pathname.startsWith("/learning/");
  }
  return pathname.startsWith(href);
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r bg-sidebar/95 shadow-[4px_0_24px_rgba(20,32,51,0.035)] md:flex md:flex-col">
      <div className="border-b px-5 py-5">
        <Link href="/dashboard" className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center border bg-primary/10 text-primary">
            <Scale className="h-5 w-5" />
          </span>
          <span>
            <span className="block text-sm font-semibold uppercase tracking-[0.28em] text-foreground">
              Athena
            </span>
            <span className="block text-xs text-muted-foreground">
              LSAT prep workspace
            </span>
          </span>
        </Link>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const isActive = isProtectedNavItemActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md border border-transparent px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "border-sidebar-border bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                  : "text-sidebar-foreground/62 hover:border-sidebar-border hover:bg-sidebar-accent/40 hover:text-sidebar-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t px-4 py-4">
        <NavUser />
      </div>
    </aside>
  );
}
