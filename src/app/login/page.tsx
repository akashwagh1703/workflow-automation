import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { maskAdminEmail } from "@/lib/auth/credentials";
import { env } from "@/config/env";

function loginMessage(error?: string, reason?: string) {
  if (error === "credentials") {
    return {
      tone: "error" as const,
      text: "Invalid email or password. On Vercel, credentials come from Environment Variables (ADMIN_EMAIL / ADMIN_PASSWORD), not your local .env.local file.",
    };
  }
  if (reason === "missing") {
    return {
      tone: "info" as const,
      text: "Please log in to access the dashboard.",
    };
  }
  if (reason === "invalid") {
    return {
      tone: "error" as const,
      text: "Your session expired or is invalid. Log in again. If this keeps happening, ensure JWT_SECRET is the same across all Vercel deployments.",
    };
  }
  return {
    tone: "info" as const,
    text: `Sign in with the admin account configured on this server (${maskAdminEmail(env.ADMIN_EMAIL)}). No signup — email + password only.`,
  };
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; reason?: string }>;
}) {
  const { error, reason } = await searchParams;
  const message = loginMessage(error, reason);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Admin Login</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            className={
              message.tone === "error"
                ? "rounded-md border border-red-500/20 bg-red-500/10 text-red-500 px-3 py-2 text-sm"
                : "rounded-md border border-foreground/10 bg-foreground/5 text-foreground/80 px-3 py-2 text-sm"
            }
          >
            {message.text}
          </div>

          <form className="space-y-3" method="post" action="/api/auth/login">
            <label className="block space-y-1 text-sm">
              <span>Email</span>
              <Input
                name="email"
                type="email"
                placeholder={env.ADMIN_EMAIL}
                autoComplete="username"
                required
              />
            </label>
            <label className="block space-y-1 text-sm">
              <span>Password</span>
              <Input
                name="password"
                type="password"
                placeholder="Enter admin password"
                autoComplete="current-password"
                required
              />
            </label>

            <Button type="submit" className="w-full">
              Login
            </Button>
          </form>

          <div className="text-xs text-foreground/60 space-y-1">
            <p>
              After login, open{" "}
              <Link href="/api/auth/whoami" className="underline">
                /api/auth/whoami
              </Link>{" "}
              — it should show <code>authenticated: true</code>.
            </p>
            <Link href="/">Go to home</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
