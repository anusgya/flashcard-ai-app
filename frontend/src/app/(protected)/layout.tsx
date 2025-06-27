"use client";

import type React from "react";
import dynamic from "next/dynamic";
import { Navigation } from "@/components/navigation";
import { PomodoroProvider } from "@/hooks/use-pomodoro";

const FloatingPomodoro = dynamic(
  () =>
    import("@/components/ui/pomodoro/floating-pomodoro").then(
      (mod) => mod.FloatingPomodoro
    ),
  { ssr: false }
);

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
