import Link from "next/link";
import { SquareParking } from "lucide-react";
import type { ReactNode } from "react";

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="flex flex-1">
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-[#2563eb] p-10 text-white lg:flex">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              "radial-gradient(circle, currentColor 1.5px, transparent 1.5px)",
            backgroundSize: "28px 28px",
          }}
        />

        <Link
          href="/"
          className="relative flex items-center gap-2 text-lg font-semibold"
        >
          <SquareParking className="size-6" />
          Smart Parking Prizren
        </Link>

        <div className="relative flex flex-col gap-3">
          <SquareParking className="size-14 opacity-90" strokeWidth={1.5} />
          <h2 className="text-3xl leading-tight font-semibold text-balance">
            Gjej vendparkim në Prizren, në kohë reale.
          </h2>
          <p className="max-w-sm text-sm text-white/75">
            Harta live e zonave dhe vendparkimeve, rezervime, dhe njoftime —
            pa pritje, pa hamendje.
          </p>
        </div>

        <p className="relative text-xs text-white/60">
          © {new Date().getFullYear()} Smart Parking Prizren
        </p>
      </div>

      <div className="flex flex-1 items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </main>
  );
}
