"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CircleAlert, CircleCheck, Loader2 } from "lucide-react";
import { resetPassword } from "@/lib/auth";
import { ApiError } from "@/lib/api";
import {
  resetPasswordSchema,
  type ResetPasswordFormValues,
} from "@/lib/validators/auth";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { PasswordInput } from "@/components/auth/PasswordInput";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [done, setDone] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
  });

  async function onSubmit(values: ResetPasswordFormValues) {
    if (!token) {
      return;
    }
    try {
      await resetPassword(token, values.password);
      setDone(true);
    } catch (err) {
      if (err instanceof ApiError && err.status === 400) {
        setError("root", {
          message: "Lidhja është e pavlefshme ose ka skaduar",
        });
      } else if (err instanceof ApiError && err.status === 429) {
        setError("root", {
          message: "Shumë tentativa — provo përsëri pas pak minutash",
        });
      } else {
        setError("root", { message: "Diçka shkoi keq" });
      }
    }
  }

  if (!token) {
    return (
      <div className="flex flex-col items-center gap-3 py-4 text-center">
        <CircleAlert className="size-10 text-destructive" />
        <h1 className="text-xl font-semibold">Lidhje e pavlefshme</h1>
        <p className="text-sm text-muted-foreground">
          Kjo lidhje rivendosjeje mungon ose është e paplotë.
        </p>
        <Link
          href="/forgot-password"
          className="mt-2 text-sm font-medium text-primary underline underline-offset-4"
        >
          Kërko një lidhje të re
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="flex flex-col items-center gap-3 py-4 text-center">
        <CircleCheck className="size-10 text-status-free-fg" />
        <h1 className="text-xl font-semibold">Fjalëkalimi u ndryshua</h1>
        <p className="text-sm text-muted-foreground">
          Tani mund të kyçesh me fjalëkalimin e ri.
        </p>
        <Button className="mt-2" onClick={() => router.push("/login")}>
          Shko te kyçja
        </Button>
      </div>
    );
  }

  return (
    <>
      <div>
        <h1 className="text-2xl font-semibold">Zgjidh fjalëkalim të ri</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Duhet të jetë të paktën 8 karaktere.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">Fjalëkalimi i ri</Label>
          <PasswordInput
            id="password"
            autoComplete="new-password"
            aria-invalid={!!errors.password}
            {...register("password")}
          />
          {errors.password && (
            <p className="text-xs text-destructive">
              {errors.password.message}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="confirmPassword">Konfirmo fjalëkalimin</Label>
          <PasswordInput
            id="confirmPassword"
            autoComplete="new-password"
            aria-invalid={!!errors.confirmPassword}
            {...register("confirmPassword")}
          />
          {errors.confirmPassword && (
            <p className="text-xs text-destructive">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        {errors.root && (
          <p className="flex items-start gap-1.5 text-sm text-destructive">
            <CircleAlert className="mt-0.5 size-4 shrink-0" />
            {errors.root.message}
          </p>
        )}

        <Button type="submit" disabled={isSubmitting} className="mt-1">
          {isSubmitting && <Loader2 className="size-4 animate-spin" />}
          {isSubmitting ? "Duke ruajtur..." : "Ruaj fjalëkalimin"}
        </Button>
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthLayout>
      <div className="flex flex-col gap-6 rounded-xl border bg-card p-6 shadow-sm sm:p-8">
        <Suspense>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </AuthLayout>
  );
}
