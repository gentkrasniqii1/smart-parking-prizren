"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CircleAlert, Loader2, Mail, MailCheck } from "lucide-react";
import { forgotPassword } from "@/lib/auth";
import { ApiError } from "@/lib/api";
import {
  forgotPasswordSchema,
  type ForgotPasswordFormValues,
} from "@/lib/validators/auth";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { IconInput } from "@/components/auth/IconInput";

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  async function onSubmit(values: ForgotPasswordFormValues) {
    try {
      await forgotPassword(values.email);
      // Backend-i kthen gjithmonë të njëjtin mesazh, pavarësisht nëse email-i
      // ekziston — mbrojtje kundër user enumeration (shih auth.service.ts).
      setSent(true);
    } catch (err) {
      if (err instanceof ApiError && err.status === 429) {
        setError("root", {
          message: "Shumë tentativa — provo përsëri pas pak minutash",
        });
      } else {
        setError("root", { message: "Diçka shkoi keq" });
      }
    }
  }

  return (
    <AuthLayout>
      <div className="flex flex-col gap-6 rounded-xl border bg-card p-6 shadow-sm sm:p-8">
        {sent ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <MailCheck className="size-10 text-status-free-fg" />
            <h1 className="text-xl font-semibold">Kontrollo email-in tënd</h1>
            <p className="text-sm text-muted-foreground">
              Nëse ekziston një llogari me këtë email, do të marrësh një
              lidhje për të rivendosur fjalëkalimin brenda pak minutash.
            </p>
            <Link
              href="/login"
              className="mt-2 text-sm font-medium text-primary underline underline-offset-4"
            >
              Kthehu te kyçja
            </Link>
          </div>
        ) : (
          <>
            <div>
              <h1 className="text-2xl font-semibold">Harrove fjalëkalimin?</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Shkruaj email-in tënd dhe do të të dërgojmë një lidhje për ta
                rivendosur.
              </p>
            </div>

            <form
              onSubmit={handleSubmit(onSubmit)}
              className="flex flex-col gap-4"
            >
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="email">Email</Label>
                <IconInput
                  id="email"
                  type="email"
                  icon={Mail}
                  autoComplete="email"
                  aria-invalid={!!errors.email}
                  {...register("email")}
                />
                {errors.email && (
                  <p className="text-xs text-destructive">
                    {errors.email.message}
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
                {isSubmitting ? "Duke dërguar..." : "Dërgo lidhjen"}
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground">
              E kujtove fjalëkalimin?{" "}
              <Link
                href="/login"
                className="font-medium text-primary underline underline-offset-4"
              >
                Kyçu
              </Link>
            </p>
          </>
        )}
      </div>
    </AuthLayout>
  );
}
