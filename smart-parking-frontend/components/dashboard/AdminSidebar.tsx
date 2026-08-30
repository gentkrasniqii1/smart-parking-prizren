"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  LayoutDashboard,
  MapPin,
  PanelLeftClose,
  PanelLeftOpen,
  ScrollText,
  SquareParking,
} from "lucide-react";
import { useUiStore } from "@/store/useUiStore";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

const SECTIONS: NavSection[] = [
  {
    label: "Përmbledhje",
    items: [{ href: "/admin", label: "Paneli", icon: LayoutDashboard }],
  },
  {
    label: "Operacione",
    items: [
      { href: "/admin/zones", label: "Zonat", icon: MapPin },
      { href: "/admin/spots", label: "Vendparkimet", icon: SquareParking },
    ],
  },
  {
    label: "Analitikë",
    items: [{ href: "/admin/analytics", label: "Analitika", icon: BarChart3 }],
  },
  {
    label: "Administrim",
    items: [{ href: "/admin/audit-log", label: "Audit Log", icon: ScrollText }],
  },
];

function isActive(pathname: string, href: string) {
  return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
}

export function AdminSidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-5">
      {SECTIONS.map((section) => (
        <div key={section.label} className="flex flex-col gap-1">
          <span className="px-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {section.label}
          </span>
          {section.items.map((item) => {
            const active = isActive(pathname, item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-9 items-center gap-2.5 rounded-md px-2 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-foreground/80 hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="size-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

export function AdminSidebar() {
  const collapsed = useUiStore((s) => s.adminSidebarCollapsed);
  const toggle = useUiStore((s) => s.toggleAdminSidebar);

  return (
    <aside
      className={cn(
        "sticky top-14 hidden h-[calc(100vh-3.5rem)] shrink-0 flex-col gap-4 overflow-y-auto border-r bg-sidebar px-3 py-4 transition-[width] duration-200 md:flex",
        collapsed ? "w-16" : "w-60",
      )}
    >
      <Button
        variant="ghost"
        size="icon"
        aria-label={collapsed ? "Zgjero panelin anësor" : "Ngushto panelin anësor"}
        onClick={toggle}
        className="self-end"
      >
        {collapsed ? (
          <PanelLeftOpen className="size-4" />
        ) : (
          <PanelLeftClose className="size-4" />
        )}
      </Button>

      {collapsed ? (
        <nav className="flex flex-col items-center gap-2">
          {SECTIONS.flatMap((s) => s.items).map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-label={item.label}
                title={item.label}
                className="flex size-9 items-center justify-center rounded-md text-foreground/80 outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Icon className="size-4" />
              </Link>
            );
          })}
        </nav>
      ) : (
        <AdminSidebarNav />
      )}
    </aside>
  );
}
