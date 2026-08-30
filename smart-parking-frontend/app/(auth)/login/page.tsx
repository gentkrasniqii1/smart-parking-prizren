"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CircleAlert, Loader2, Mail } from "lucide-react";
import { login } from "@/lib/auth";
import { useAuthStore } from "@/store/useAuthStore";
import { ApiError } from "@/lib/api";
import { loginSchema, type LoginFormValues } from "@/lib/validators/auth";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { IconInput } from "@/components/auth/IconInput";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { GoogleButton } from "@/components/auth/GoogleButton";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setSession = useAuthStore((state) => state.setSession);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  const googleError = searchParams.get("error") === "google";

  async function onSubmit(values: LoginFormValues) {
    try {
      const { user, ...tokens } = await login(values.email, values.password);
      setSession(user, tokens);
      router.push("/");
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError("root", { message: "Email ose fjalëkalim i pasaktë" });
      } else if (err instanceof ApiError && err.status === 429) {
        setError("root", {
          message: "Shumë tentativa — provo përsëri pas pak minutash",
        });
      } else {
        setError("root", { message: "Diçka shkoi keq" });
      }
    }
  }

  return (
    <div className="flex flex-col gap-6 rounded-xl border bg-card p-6 shadow-sm sm:p-8">
      <div>
        <h1 className="text-2xl font-semibold">Mirë se erdhe përsëri</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Kyçu për të vazhduar te Smart Parking Prizren
        </p>
      </div>

      <GoogleButton />

      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <div className="h-px flex-1 bg-border" />
        ose
        <div className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
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
            <p className="text-xs text-destructive">{errors.email.message}</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Fjalëkalimi</Label>
            <Link
              href="/forgot-password"
              className="text-xs font-medium text-primary underline underline-offset-4"
            >
              Harrove fjalëkalimin?
            </Link>
          </div>
          <PasswordInput
            id="password"
            autoComplete="current-password"
            aria-invalid={!!errors.password}
            {...register("password")}
          />
          {errors.password && (
            <p className="text-xs text-destructive">
              {errors.password.message}
            </p>
          )}
        </div>

        {(errors.root || googleError) && (
          <p className="flex items-start gap-1.5 text-sm text-destructive">
            <CircleAlert className="mt-0.5 size-4 shrink-0" />
            {errors.root?.message ??
              "S'u arrit kyçja me Google — provo përsëri"}
          </p>
        )}

        <Button type="submit" disabled={isSubmitting} className="mt-1">
          {isSubmitting && <Loader2 className="size-4 animate-spin" />}
          {isSubmitting ? "Duke u kyçur..." : "Kyçu"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        S&apos;ke llogari?{" "}
        <Link href="/register" className="font-medium text-primary underline underline-offset-4">
          Regjistrohu
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <AuthLayout>
      <Suspense>
        <LoginForm />
      </Suspense>
    </AuthLayout>
  );
}
