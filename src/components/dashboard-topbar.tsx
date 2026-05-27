"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const titles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/whatsapp": "WhatsApp",
  "/dashboard/workflows": "Workflows",
  "/dashboard/inbox": "Inbox",
  "/dashboard/contacts": "Contacts",
  "/dashboard/settings": "Settings",
};

export function DashboardTopbar() {
  const pathname = usePathname();
  const title = titles[pathname] ?? "Dashboard";

  return (
    <header className="h-14 border-b border-foreground/10 flex items-center justify-between px-6 bg-background">
      <h1 className="text-lg font-semibold">{title}</h1>
      <Link
        href="/api/auth/logout"
        className="text-sm text-foreground/70 hover:text-foreground"
      >
        Logout
      </Link>
    </header>
  );
}
