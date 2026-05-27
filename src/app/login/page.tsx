import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Admin Login</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error ? (
            <div className="rounded-md border border-red-500/20 bg-red-500/10 text-red-500 px-3 py-2 text-sm">
              Invalid email or password.
            </div>
          ) : (
            <div className="text-sm text-foreground/70">
              Use the configured admin credentials in your environment.
            </div>
          )}

          {/* We keep the login static and server-validated. */}
          <form className="space-y-3" method="post" action="/api/auth/login">
            <label className="block space-y-1 text-sm">
              <span>Email</span>
              <Input name="email" type="email" placeholder="admin@example.com" required />
            </label>
            <label className="block space-y-1 text-sm">
              <span>Password</span>
              <Input
                name="password"
                type="password"
                placeholder="Enter admin password"
                required
              />
            </label>

            <Button type="submit" className="w-full">
              Login
            </Button>
          </form>

          <div className="text-xs text-foreground/60">
            <Link href="/">Go to home</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

