"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { AdminSidebar, AdminSidebarNav } from "@/components/dashboard/AdminSidebar";
import { LiveIndicator } from "@/components/realtime/LiveIndicator";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((state) => state.user);
  const [sheetOpen, setSheetOpen] = useState(false);

  if (!user) {
    return (
      <main className="p-8">
        <p>
          Duhet të{" "}
          <Link href="/login" className="underline">
            kyçesh
          </Link>{" "}
          si administrator.
        </p>
      </main>
    );
  }

  if (user.role !== "admin") {
    return (
      <main className="p-8">
        <p className="text-destructive">
          S&apos;ke akses te ky panel (vetëm administratorë).
        </p>
      </main>
    );
  }

  return (
    <div className="flex flex-1">
      <AdminSidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex h-12 items-center gap-2 border-b px-4 md:hidden">
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger
              aria-label="Hap menynë e panelit"
              render={<Button variant="ghost" size="icon" />}
            >
              <Menu className="size-5" />
            </SheetTrigger>
            <SheetContent side="left">
              <SheetHeader>
                <SheetTitle>Paneli i Administratorit</SheetTitle>
              </SheetHeader>
              <div className="px-4">
                <AdminSidebarNav onNavigate={() => setSheetOpen(false)} />
              </div>
            </SheetContent>
          </Sheet>
          <span className="text-sm font-medium">Paneli i Administratorit</span>
          <LiveIndicator className="ml-auto" />
        </div>

        <main className="flex flex-1 flex-col gap-6 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
