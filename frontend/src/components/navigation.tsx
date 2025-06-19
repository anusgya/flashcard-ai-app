"use client";

import { cn } from "@/lib/utils";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { LogOut } from "lucide-react";
import useMe from "@/hooks/api/use-me";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { PomodoroTimer } from "@/components/ui/pomodoro/pomodoro-timer";

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
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);

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

  const handleLogoutClick = () => {
    setIsLogoutDialogOpen(true);
  };

  const handleConfirmLogout = () => {
    // Remove token from localStorage
    localStorage.removeItem("token");
    // Close the dialog
    setIsLogoutDialogOpen(false);
    // Redirect to login page
    router.push("/login");
  };

  if (hideSidebar) return null;

  return (
    <>
      <aside className="w-64 bg-muted border-r border-divider p-4 pt-16 flex flex-col h-screen">
        <div className="flex items-start px-3">
          <div className="flex justify-center items-center gap-3">
            <img
              src={`/media/avatars/${user?.avatar}`}
              alt="myavatar"
              className="w-12 h-12 rounded-full mx-auto"
            />
            <div className="flex flex-col gap-[2.5px]">
              <div className="text-sm">{user?.username}</div>
              <div className="text-xs font-fragment-mono text-secondary-foreground">
                {user?.email}
              </div>
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
          {/* <PomodoroTimer /> */}
          <button
            onClick={handleLogoutClick}
            className="flex items-center gap-3 px-4 py-2 rounded-lg text-foreground transition-colors w-full hover:bg-secondary hover:text-primary-blue"
          >
            <LogOut className="h-5 w-5" />
            <span className="text-sm">Logout</span>
          </button>
        </div>
      </aside>

      {/* Logout Confirmation Dialog */}
      <Dialog open={isLogoutDialogOpen} onOpenChange={setIsLogoutDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Logout</DialogTitle>
            <DialogDescription className="text-secondary-foreground">
              Are you sure you want to log out of your account?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:justify-end">
            <Button
              variant="outline"
              className="border-b-1"
              onClick={() => setIsLogoutDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="default"
              className="bg-primary-blue hover:border-0 text-muted font-semibold border-primary-blue-secondary"
              onClick={handleConfirmLogout}
            >
              Logout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
