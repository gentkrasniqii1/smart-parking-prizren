"use client";

import { Button } from "@/components/ui/button";
import { GoogleIcon } from "@/components/icons/GoogleIcon";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export function GoogleButton() {
  return (
    <Button
      type="button"
      variant="outline"
      className="w-full"
      onClick={() => {
        // Navigim i vërtetë (jo router.push) — largohet nga Next.js drejt
        // backend-it (origjinë tjetër) që fillon flow-in e Google OAuth.
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.href = `${API_URL}/auth/google`;
      }}
    >
      <GoogleIcon className="size-4" />
      Vazhdo me Google
    </Button>
  );
}
