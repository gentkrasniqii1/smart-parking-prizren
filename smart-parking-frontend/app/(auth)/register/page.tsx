"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { register } from "@/lib/auth";
import { useAuthStore } from "@/store/useAuthStore";
import { ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";

export default function RegisterPage() {
  const router = useRouter();
  const setSession = useAuthStore((state) => state.setSession);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const { user, ...tokens } = await register(email, password);
      setSession(user, tokens);
      router.push("/");
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setError("Ky email është regjistruar tashmë");
      } else if (err instanceof ApiError && err.status === 400) {
        setError("Fjalëkalimi duhet të ketë të paktën 8 karaktere");
      } else if (err instanceof ApiError && err.status === 429) {
        setError("Shumë tentativa — provo përsëri pas pak minutash");
      } else {
        setError("Diçka shkoi keq");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex flex-1 items-center justify-center p-8">
      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-sm flex-col gap-4"
      >
        <h1 className="text-2xl font-semibold">Regjistrohu</h1>

        <div className="flex flex-col gap-1">
          <label htmlFor="email" className="text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-md border px-3 py-2 text-sm"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="password" className="text-sm font-medium">
            Fjalëkalimi (min. 8 karaktere)
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-md border px-3 py-2 text-sm"
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Duke u regjistruar..." : "Regjistrohu"}
        </Button>

        <p className="text-sm text-muted-foreground">
          Ke tashmë llogari?{" "}
          <Link href="/login" className="underline">
            Kyçu
          </Link>
        </p>
      </form>
    </main>
  );
}
