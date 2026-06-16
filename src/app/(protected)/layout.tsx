import { TopNavWrapper } from "@/components/layout/top-nav-wrapper";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <TopNavWrapper />
      <main>{children}</main>
    </div>
  );
}
