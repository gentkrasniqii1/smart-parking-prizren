"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, LayoutDashboard, LogOut, Menu, SquareParking } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { logout as apiLogout } from "@/lib/auth";
import { getSocket } from "@/lib/socket";
import {
  useUnreadCount,
  useNotificationsSocket,
} from "@/hooks/useNotifications";
import { Button, buttonVariants } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/nav/ThemeToggle";
import { cn } from "@/lib/utils";

function initials(email: string) {
  return email.slice(0, 2).toUpperCase();
}

function NotificationBell({
  unread,
  className,
}: {
  unread: number;
  className?: string;
}) {
  return (
    <Link
      href="/notifications"
      aria-label={`Njoftimet${unread ? ` (${unread} të palexuara)` : ""}`}
      className={cn(
        buttonVariants({ variant: "ghost", size: "icon" }),
        "relative",
        className,
      )}
    >
      <Bell className="size-4" />
      {unread > 0 && (
        <span
          aria-hidden="true"
          className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-status-occupied-fg px-1 text-[10px] font-medium text-white"
        >
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </Link>
  );
}

export function Header() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const clearSession = useAuthStore((state) => state.clearSession);
  const isLoggedIn = !!user;
  const [sheetOpen, setSheetOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const unreadCountQuery = useUnreadCount(isLoggedIn);
  useNotificationsSocket(isLoggedIn);
  const unread = unreadCountQuery.data ?? 0;

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 8);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  async function handleLogout() {
    try {
      await apiLogout();
    } catch {
      // token-i mund të jetë skaduar tashmë; s'ka rëndësi, po e pastrojmë gjithsesi
    }
    getSocket().disconnect();
    setSheetOpen(false);
    clearSession();
    router.push("/");
  }

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b transition-colors duration-200",
        scrolled
          ? "border-border bg-background/80 backdrop-blur-md supports-backdrop-filter:bg-background/70"
          : "border-transparent bg-background",
      )}
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 md:px-8">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <SquareParking className="size-5 text-primary" />
          Smart Parking Prizren
        </Link>

        {/* Nav e plotë — vetëm sm+ */}
        <div className="hidden items-center gap-1 sm:flex">
          <ThemeToggle />

          {isLoggedIn ? (
            <>
              <NotificationBell unread={unread} />
              <Link
                href="/reservations"
                className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
              >
                Rezervimet e mia
              </Link>
              {user.role === "admin" && (
                <Link
                  href="/admin"
                  className={cn(
                    buttonVariants({ variant: "ghost", size: "icon" }),
                  )}
                  aria-label="Paneli admin"
                >
                  <LayoutDashboard className="size-4" />
                </Link>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger
                  aria-label="Menyja e llogarisë"
                  className="ml-1 rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <Avatar size="sm">
                    <AvatarFallback>{initials(user.email)}</AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-56">
                  <DropdownMenuGroup>
                    <DropdownMenuLabel
                      className="truncate font-normal text-muted-foreground"
                      title={user.email}
                    >
                      {user.email}
                    </DropdownMenuLabel>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive" onClick={handleLogout}>
                    <LogOut />
                    Dil
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Link href="/login" className={cn(buttonVariants({ size: "sm" }))}>
              Kyçu
            </Link>
          )}
        </div>

        {/* Hamburger — vetëm mobile. Butonat këtu janë 44px (size-11) —
            objektiv prekjeje minimal për mobile, ndryshe nga dendësia e
            lejueshme e navbar-it desktop (size-8/icon). */}
        <div className="flex items-center gap-1 sm:hidden">
          <ThemeToggle className="size-11" />
          {isLoggedIn && <NotificationBell unread={unread} className="size-11" />}
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger
              aria-label="Hap menynë"
              render={<Button variant="ghost" size="icon" className="size-11" />}
            >
              <Menu className="size-5" />
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle>Smart Parking Prizren</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-1 px-4">
                {isLoggedIn ? (
                  <>
                    <span className="mb-2 truncate text-sm text-muted-foreground">
                      {user.email}
                    </span>
                    <SheetClose
                      nativeButton={false}
                      render={<Link href="/reservations" />}
                      className="flex min-h-11 items-center rounded-md px-2 text-sm outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      Rezervimet e mia
                    </SheetClose>
                    {user.role === "admin" && (
                      <SheetClose
                        nativeButton={false}
                        render={<Link href="/admin" />}
                        className="flex min-h-11 items-center rounded-md px-2 text-sm outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        Paneli admin
                      </SheetClose>
                    )}
                    <Button
                      variant="outline"
                      className="mt-3 min-h-11 justify-start"
                      onClick={handleLogout}
                    >
                      <LogOut />
                      Dil
                    </Button>
                  </>
                ) : (
                  <SheetClose
                    nativeButton={false}
                    render={<Link href="/login" />}
                    className={cn(
                      buttonVariants({ size: "sm" }),
                      "min-h-11 justify-center",
                    )}
                  >
                    Kyçu
                  </SheetClose>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
