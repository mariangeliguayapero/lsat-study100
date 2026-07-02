"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { NavUser } from "@/components/layout/nav-user";

function isImmersivePath(pathname: string) {
  if (pathname.startsWith("/onboarding")) return true;
  if (pathname.startsWith("/quest")) return true;
  if (pathname.includes("/quiz")) return true;
  if (pathname.includes("/tutor")) return true;
  if (pathname.includes("/micro-lesson")) return true;
  if (/^\/full-sat\/[^/]+/.test(pathname)) return true;
  return false;
}

export function ProtectedShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (isImmersivePath(pathname)) {
    return <div className="min-h-screen">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-background text-foreground md:flex">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b bg-background/90 px-4 backdrop-blur md:hidden">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">
              Athena
            </p>
            <p className="text-[11px] text-muted-foreground">LSAT prep workspace</p>
          </div>
          <NavUser />
        </header>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
