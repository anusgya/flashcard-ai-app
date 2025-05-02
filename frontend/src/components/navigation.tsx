"use client";

import { cn } from "@/lib/utils";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { LogOut } from "lucide-react";
import useMe from "@/hooks/api/use-me";

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
  { icon: "🔍", label: "Analytics", href: "/analytics" },
  // { icon: "🏆", label: "Achievements", href: "/achievements" },
  { icon: "👑", label: "Leaderboard", href: "/leaderboard" },
  { icon: "⚙️", label: "Settings", href: "/settings" },
];

export function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useMe();

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

  const handleLogout = () => {
    // Remove token from localStorage
    localStorage.removeItem("token");
    // Redirect to login page
    router.push("/login");
  };

  if (hideSidebar) return null;

  return (
    <aside className="w-64 bg-muted border-r border-divider p-4 pt-16 flex flex-col h-screen">
      <div className="flex items-start px-3">
        <div className="flex justify-center items-center gap-2">
          <img
            src={`/media/avatars/${user?.avatar}`}
            alt="myavatar"
            className="w-12 h-12 rounded-full mx-auto"
          />
          <div className="flex flex-col">
            <div className="text-sm">{user?.username}</div>
            <div className="text-sm font-fragment-mono text-secondary-foreground">{user?.email}</div>
          </div>
        </div>
        
      </div>
      <div className="h-px bg-divider w-full my-4"></div>
      <div className="flex-grow ">
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
      </div>
      
      {/* Logout button at the bottom */}
      <div className="mt-auto pt-4 border-t border-divider">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-2 rounded-lg text-foreground transition-colors w-full hover:bg-secondary hover:text-destructive"
        >
          <LogOut className="h-5 w-5" />
          <span className="text-sm ">Logout</span>
        </button>
      </div>
    </aside>
  );
}
