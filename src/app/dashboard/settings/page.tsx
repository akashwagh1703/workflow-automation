"use client";

import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type AppSettings = {
  adminEmailMasked: string;
  supabaseConfigured: boolean;
  metaGraphApiVersion: string;
  appUrl: string | null;
  sessionTimeoutMinutes: number;
  cookieName: string;
};

export default function SettingsPage() {
  const [settings, setSettings] = React.useState<AppSettings | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch("/api/settings");
      const json = await res.json().catch(() => null);
      if (!cancelled && json?.settings) {
        setSettings(json.settings as AppSettings);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-4 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          {!settings ? (
            <p className="text-foreground/70">Loading...</p>
          ) : (
            <>
              <div className="flex items-center justify-between gap-4 border-b border-foreground/10 pb-3">
                <span className="text-foreground/70">Admin email</span>
                <span className="font-medium">{settings.adminEmailMasked}</span>
              </div>
              <div className="flex items-center justify-between gap-4 border-b border-foreground/10 pb-3">
                <span className="text-foreground/70">Supabase</span>
                {settings.supabaseConfigured ? (
                  <Badge variant="success">Configured</Badge>
                ) : (
                  <Badge variant="danger">Missing env</Badge>
                )}
              </div>
              <div className="flex items-center justify-between gap-4 border-b border-foreground/10 pb-3">
                <span className="text-foreground/70">Meta Graph API</span>
                <span>{settings.metaGraphApiVersion}</span>
              </div>
              <div className="flex items-center justify-between gap-4 border-b border-foreground/10 pb-3">
                <span className="text-foreground/70">Public app URL</span>
                <span className="font-mono text-xs break-all text-right">
                  {settings.appUrl ?? "Not set (add APP_URL)"}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4 border-b border-foreground/10 pb-3">
                <span className="text-foreground/70">Session timeout</span>
                <span>{settings.sessionTimeoutMinutes} minutes</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-foreground/70">Session cookie</span>
                <span className="font-mono text-xs">{settings.cookieName}</span>
              </div>

              <p className="text-xs text-foreground/60 pt-2">
                Environment variables are configured in <code>.env.local</code>.
                Set <code>META_APP_SECRET</code> in production for webhook
                signature verification. Restart the dev server after changes.
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
