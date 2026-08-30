"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CircleAlert, Loader2, Mail } from "lucide-react";
import { register as registerUser } from "@/lib/auth";
import { useAuthStore } from "@/store/useAuthStore";
import { ApiError } from "@/lib/api";
import { registerSchema, type RegisterFormValues } from "@/lib/validators/auth";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { IconInput } from "@/components/auth/IconInput";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { GoogleButton } from "@/components/auth/GoogleButton";

export default function RegisterPage() {
  const router = useRouter();
  const setSession = useAuthStore((state) => state.setSession);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<RegisterFormValues>({ resolver: zodResolver(registerSchema) });

  async function onSubmit(values: RegisterFormValues) {
    try {
      const { user, ...tokens } = await registerUser(
        values.email,
        values.password,
      );
      setSession(user, tokens);
      router.push("/");
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setError("root", { message: "Ky email është regjistruar tashmë" });
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
    <AuthLayout>
      <div className="flex flex-col gap-6 rounded-xl border bg-card p-6 shadow-sm sm:p-8">
        <div>
          <h1 className="text-2xl font-semibold">Krijo llogari</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Regjistrohu për të rezervuar vendparkim në Prizren
          </p>
        </div>

        <GoogleButton />

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <div className="h-px flex-1 bg-border" />
          ose
          <div className="h-px flex-1 bg-border" />
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

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">Fjalëkalimi</Label>
            <PasswordInput
              id="password"
              autoComplete="new-password"
              aria-invalid={!!errors.password}
              {...register("password")}
            />
            {errors.password ? (
              <p className="text-xs text-destructive">
                {errors.password.message}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Të paktën 8 karaktere
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
            {isSubmitting ? "Duke u regjistruar..." : "Regjistrohu"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Ke tashmë llogari?{" "}
          <Link
            href="/login"
            className="font-medium text-primary underline underline-offset-4"
          >
            Kyçu
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
