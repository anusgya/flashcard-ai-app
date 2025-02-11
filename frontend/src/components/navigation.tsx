"use client";

import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import Link from "next/link";

interface NavItem {
  icon: string;
  label: string;
  href: string;
}

const navItems: NavItem[] = [
  { icon: "🏠", label: "Dashboard", href: "/dashboard" },
  { icon: "📖", label: "Decks", href: "/decks" },
  { icon: "🧠", label: "Learn", href: "/learn" },
  { icon: "🔥", label: "Play Quiz", href: "/quiz" },
  { icon: "✅", label: "Analytics", href: "/progress" },
  { icon: "🏆", label: "Achievements", href: "/achievements" },
  { icon: "👑", label: "Leaderboard", href: "/leaderboard" },
  { icon: "⚙️", label: "Settings", href: "/settings" },
];

export function Navigation() {
  const pathname = usePathname();

  // Client-side route checking
  const segments = pathname.split("/").filter(Boolean);
  const hideSidebar =
    (segments[0] === "learn" && segments.length > 1) ||
    (segments[0] === "decks" && segments.length > 3) ||
    (segments[0] === "quiz" && segments.length > 1);

  const isActiveRoute = (itemHref: string): boolean => {
    if (itemHref === "/dashboard" && pathname === "/") return true;
    return pathname.startsWith(itemHref);
  };

  if (hideSidebar) return null;

  return (
    <aside className="w-64 bg-muted border-r border-divider p-4 pt-16 space-y-2">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "flex items-center gap-3 px-4 py-2 rounded-lg text-foreground transition-colors",
            "hover:bg-secondary",
            isActiveRoute(item.href) &&
              "bg-secondary text-primary-green border-[1.5px] border-border"
          )}
        >
          <span className="text-2xl">{item.icon}</span>
          <span className="text-sm">{item.label}</span>
        </Link>
      ))}
    </aside>
  );
}
