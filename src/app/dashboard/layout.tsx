import Link from "next/link";

import { DashboardTopbar } from "@/components/dashboard-topbar";

const nav = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/whatsapp", label: "WhatsApp" },
  { href: "/dashboard/workflows", label: "Workflows" },
  { href: "/dashboard/inbox", label: "Inbox" },
  { href: "/dashboard/contacts", label: "Contacts" },
  { href: "/dashboard/settings", label: "Settings" },
] as const;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex bg-background text-foreground">
      <aside className="w-64 border-r border-foreground/10 p-5 shrink-0">
        <div className="text-sm font-semibold mb-6">WhatsApp Automation</div>

        <nav className="space-y-1">
          {nav.map((item) => (
            <Link
              key={item.href}
              className="block px-3 py-2 rounded-md hover:bg-foreground/5 text-sm"
              href={item.href}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <DashboardTopbar />
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
