"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CircleAlert, CircleCheck, Loader2 } from "lucide-react";
import { verifyEmail } from "@/lib/auth";
import { AuthLayout } from "@/components/auth/AuthLayout";

type Status = "verifying" | "success" | "error";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<Status>(token ? "verifying" : "error");
  const attempted = useRef(false);

  useEffect(() => {
    if (!token || attempted.current) {
      return;
    }
    attempted.current = true;
    verifyEmail(token)
      .then(() => setStatus("success"))
      .catch(() => setStatus("error"));
  }, [token]);

  if (status === "verifying") {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <Loader2 className="size-10 animate-spin text-primary" />
        <h1 className="text-xl font-semibold">Duke verifikuar email-in…</h1>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <CircleCheck className="size-10 text-status-free-fg" />
        <h1 className="text-xl font-semibold">Email-i u verifikua</h1>
        <p className="text-sm text-muted-foreground">
          Faleminderit — llogaria jote tani është e verifikuar.
        </p>
        <Link
          href="/"
          className="mt-2 text-sm font-medium text-primary underline underline-offset-4"
        >
          Shko te harta
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 py-6 text-center">
      <CircleAlert className="size-10 text-destructive" />
      <h1 className="text-xl font-semibold">Lidhje e pavlefshme</h1>
      <p className="text-sm text-muted-foreground">
        Kjo lidhje verifikimi është e pavlefshme ose ka skaduar. Mund ta
        ridërgosh nga menyja e llogarisë pasi të kyçesh.
      </p>
      <Link
        href="/login"
        className="mt-2 text-sm font-medium text-primary underline underline-offset-4"
      >
        Shko te kyçja
      </Link>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <AuthLayout>
      <div className="flex flex-col gap-6 rounded-xl border bg-card p-6 shadow-sm sm:p-8">
        <Suspense>
          <VerifyEmailContent />
        </Suspense>
      </div>
    </AuthLayout>
  );
}
