"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";

const navItems = [
  { href: "/dashboard", label: "ATHENA" },
  { href: "/queue", label: "PROGRESS" },
  { href: "/learning", label: "REVIEW" },
  // { href: "/full-sat", label: "SAT TEST" },
  { href: "/mentor", label: "MENTOR" },
  { href: "/profile", label: "PROFILE" },
  { href: "/my-learning", label: "LEARN" },
];

export function TopNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-center px-6">
        <nav className="flex items-center gap-8">
          {navItems.map((item) => {
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative py-4 text-xs font-medium tracking-[0.2em] transition-colors",
                  isActive
                    ? "text-foreground"
                    : "text-muted-foreground/60 hover:text-muted-foreground"
                )}
              >
                {item.label}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-foreground" />
                )}
              </Link>
            );
          })}
        </nav>
        <div className="absolute right-6">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
