// app/(protected)/layout.tsx (Protected layout)
import { Navigation } from "@/components/navigation";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen">
      <Navigation/>
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}