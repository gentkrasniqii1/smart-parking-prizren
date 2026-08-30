"use client";

import { useTheme } from "next-themes";
import { Toaster as SonnerToaster } from "sonner";

export function Toaster() {
  const { resolvedTheme } = useTheme();

  return (
    <SonnerToaster
      position="top-right"
      theme={resolvedTheme === "dark" ? "dark" : "light"}
      richColors
    />
  );
}
