import type React from "react";
import { Navigation } from "@/components/navigation";
import { PomodoroProvider } from "@/hooks/use-pomodoro";
import { FloatingPomodoro } from "@/components/ui/pomodoro/floating-pomodoro";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PomodoroProvider>
      <div className="flex h-screen">
        <Navigation />
        <main className="flex-1 overflow-auto">{children}</main>
        <FloatingPomodoro />
      </div>
    </PomodoroProvider>
  );
}
