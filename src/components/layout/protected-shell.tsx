"use client";

import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { Sidebar, protectedNavItems } from "@/components/layout/sidebar";
import { NavUser } from "@/components/layout/nav-user";
import { cn } from "@/lib/utils";
import { Menu, Scale, X } from "lucide-react";

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (isImmersivePath(pathname)) {
    return <div className="min-h-screen">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-background text-foreground md:flex">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b bg-background/90 px-4 backdrop-blur md:hidden">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center border bg-card/70 text-foreground transition-colors hover:border-primary/40 hover:text-primary"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold uppercase tracking-[0.28em] text-primary">
                Athena
              </p>
              <p className="truncate text-[11px] text-muted-foreground">
                LSAT prep workspace
              </p>
            </div>
          </div>
          <NavUser />
        </header>
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              className="fixed inset-0 z-50 md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
            >
              <motion.button
                type="button"
                aria-label="Close navigation menu"
                className="absolute inset-0 bg-background/75 backdrop-blur-sm"
                onClick={() => setMobileMenuOpen(false)}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
              />
              <motion.div
                className="relative flex h-full w-[min(21rem,88vw)] flex-col border-r bg-sidebar shadow-2xl"
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", stiffness: 360, damping: 34 }}
              >
                <div className="flex items-center justify-between border-b px-5 py-4">
                  <Link
                    href="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex min-w-0 items-center gap-3"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center border bg-primary/10 text-primary">
                      <Scale className="h-5 w-5" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold uppercase tracking-[0.28em] text-foreground">
                        Athena
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        LSAT prep workspace
                      </span>
                    </span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => setMobileMenuOpen(false)}
                    aria-label="Close navigation menu"
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center border text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <motion.nav
                  className="flex-1 space-y-1 overflow-y-auto px-3 py-4"
                  initial="closed"
                  animate="open"
                  exit="closed"
                  variants={{
                    open: {
                      transition: { staggerChildren: 0.035, delayChildren: 0.06 },
                    },
                    closed: {
                      transition: { staggerChildren: 0.02, staggerDirection: -1 },
                    },
                  }}
                >
                  {protectedNavItems.map((item) => {
                    const isActive =
                      item.href === "/dashboard"
                        ? pathname === "/dashboard"
                        : pathname.startsWith(item.href);

                    return (
                      <motion.div
                        key={item.href}
                        variants={{
                          open: { opacity: 1, x: 0 },
                          closed: { opacity: 0, x: -12 },
                        }}
                        transition={{ duration: 0.16, ease: "easeOut" }}
                      >
                        <Link
                          href={item.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className={cn(
                            "flex items-center gap-3 border border-transparent px-3 py-3 text-sm font-medium transition-colors",
                            isActive
                              ? "border-primary/35 bg-primary/10 text-foreground"
                              : "text-sidebar-foreground/70 hover:border-sidebar-border hover:bg-sidebar-accent/45 hover:text-sidebar-foreground"
                          )}
                        >
                          <item.icon
                            className={cn(
                              "h-4 w-4",
                              isActive ? "text-primary" : "text-sidebar-foreground/55"
                            )}
                          />
                          <span className="min-w-0 flex-1 truncate">{item.label}</span>
                        </Link>
                      </motion.div>
                    );
                  })}
                </motion.nav>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
