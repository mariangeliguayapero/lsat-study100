import { ProtectedShell } from "@/components/layout/protected-shell";
import { ClerkProfileSync } from "@/components/providers/clerk-profile-sync";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <ClerkProfileSync />
      <ProtectedShell>{children}</ProtectedShell>
    </>
  );
}
