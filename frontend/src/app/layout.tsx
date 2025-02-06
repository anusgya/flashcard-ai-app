import { cn } from "@/lib/utils";
import "@/app/globals.css";
import { headers } from "next/headers";

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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Get the current URL from our custom header
  const headersList = headers();
  const currentUrl = headersList.get("x-url") || "";

  // Extract the pathname from the full URL
  const pathname = currentUrl ? new URL(currentUrl).pathname : "";

  // Function to determine if a route is currently active
  const isActiveRoute = (itemHref: string): boolean => {
    // Handle root path special case
    if (itemHref === "/dashboard" && pathname === "/") {
      return true;
    }
    // Check if current path starts with the nav item's href
    return pathname.startsWith(itemHref);
  };

  return (
    <html lang="en">
      <body className="font-inter">
        <div className="flex h-screen">
          {/* Sidebar */}
          <aside className="w-64 bg-muted border-r border-divider p-4 pt-16 space-y-2">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-2 rounded-lg text-foreground transition-colors",
                  "hover:bg-secondary",
                  isActiveRoute(item.href) &&
                    "bg-secondary text-primary-green  border-[1.5px] border-border"
                )}
              >
                <span className="text-2xl ">{item.icon}</span>
                <span className="text-sm">{item.label}</span>
              </a>
            ))}
          </aside>
          {/* Main content */}
          <main className="flex-1 overflow-auto">{children}</main>
        </div>
      </body>
    </html>
  );
}
