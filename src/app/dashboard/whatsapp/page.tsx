"use client";

import * as React from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const formSchema = z.object({
  access_token: z.string().optional(),
  phone_number_id: z.string().min(1, "Phone number ID is required"),
  business_account_id: z.string().min(1, "Business account ID is required"),
  verify_token: z.string().min(1, "Verify token is required"),
});

type FormValues = z.infer<typeof formSchema>;

type IntegrationStatus = {
  supabaseConfigured: boolean;
  credentialsConfigured: boolean;
  phoneNumberId: string | null;
  businessAccountId: string | null;
  verifyTokenConfigured: boolean;
  webhookPath: string;
  webhookUrl: string | null;
  metaGraphApiVersion: string;
  signatureVerificationEnabled?: boolean;
};

export default function WhatsAppPage() {
  const [integration, setIntegration] = React.useState<IntegrationStatus | null>(
    null,
  );
  const [copyStatus, setCopyStatus] = React.useState<string | null>(null);
  const [hasAccessToken, setHasAccessToken] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [testState, setTestState] = React.useState<
    | { status: "idle" }
    | { status: "testing" }
    | { status: "success"; meta: unknown }
    | { status: "error"; error: string }
  >({ status: "idle" });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      access_token: "",
      phone_number_id: "",
      business_account_id: "",
      verify_token: "",
    },
  });

  async function loadIntegrationStatus() {
    const origin =
      typeof window !== "undefined" ? window.location.origin : "";
    const res = await fetch(
      `/api/whatsapp/status?origin=${encodeURIComponent(origin)}`,
    );
    const json = await res.json().catch(() => null);
    if (json?.status) setIntegration(json.status as IntegrationStatus);
  }

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      await loadIntegrationStatus();
      const res = await fetch("/api/whatsapp/accounts");
      if (!res.ok) return;
      const json = await res.json().catch(() => null);
      const account = json?.account;
      if (!account || cancelled) return;
      setHasAccessToken(Boolean(account.has_access_token));
      form.reset({
        access_token: "",
        phone_number_id: account.phone_number_id ?? "",
        business_account_id: account.business_account_id ?? "",
        verify_token: account.verify_token ?? "",
      });
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onSubmit(values: FormValues) {
    if (!hasAccessToken && !values.access_token?.trim()) {
      setTestState({
        status: "error",
        error: "Access token is required for first-time setup",
      });
      return;
    }

    setLoading(true);
    setTestState({ status: "idle" });

    const payload = {
      ...values,
      access_token: values.access_token?.trim() || undefined,
    };

    const res = await fetch("/api/whatsapp/accounts", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });

    const json = await res.json().catch(() => null);
    setLoading(false);

    if (!res.ok || !json?.ok) {
      setTestState({
        status: "error",
        error: json?.error ? String(json.error) : "Failed to save credentials",
      });
      return;
    }

    setTestState({ status: "idle" });
    if (values.access_token?.trim()) setHasAccessToken(true);
    await loadIntegrationStatus();
  }

  async function copyWebhookUrl() {
    const url = integration?.webhookUrl;
    if (!url) {
      setCopyStatus("Set APP_URL in .env.local for a public webhook URL.");
      return;
    }
    await navigator.clipboard.writeText(url);
    setCopyStatus("Webhook URL copied.");
    setTimeout(() => setCopyStatus(null), 2000);
  }

  async function handleTestConnection() {
    setTestState({ status: "testing" });
    const values = form.getValues();
    const token = values.access_token?.trim();
    const res = await fetch("/api/whatsapp/test", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(
        token ? { access_token: token } : {},
      ),
    });

    const json = await res.json().catch(() => null);

    if (!res.ok || !json?.ok) {
      setTestState({
        status: "error",
        error: json?.error ? String(json.error) : "Connection test failed",
      });
      return;
    }

    setTestState({ status: "success", meta: json.meta });
  }

  return (
    <div className="space-y-4 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle>Integration status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex flex-wrap gap-2">
            <Badge variant={integration?.supabaseConfigured ? "success" : "danger"}>
              Supabase
            </Badge>
            <Badge
              variant={
                integration?.credentialsConfigured ? "success" : "secondary"
              }
            >
              Credentials
            </Badge>
            <Badge
              variant={
                integration?.verifyTokenConfigured ? "success" : "secondary"
              }
            >
              Verify token
            </Badge>
            <Badge
              variant={
                integration?.signatureVerificationEnabled ? "success" : "warning"
              }
            >
              Signature verify
            </Badge>
          </div>

          <div className="space-y-1">
            <div className="text-foreground/70">Webhook URL (for Meta)</div>
            <div className="font-mono text-xs break-all rounded-md border border-foreground/10 p-2">
              {integration?.webhookUrl ??
                "Set APP_URL in .env.local (e.g. your ngrok URL) to display the full webhook URL."}
            </div>
            <div className="flex gap-2 items-center">
              <Button type="button" variant="secondary" size="sm" onClick={copyWebhookUrl}>
                Copy webhook URL
              </Button>
              {copyStatus ? (
                <span className="text-xs text-foreground/60">{copyStatus}</span>
              ) : null}
            </div>
          </div>

          <ul className="list-disc pl-5 text-foreground/70 space-y-1">
            <li>
              Callback path: <code>{integration?.webhookPath ?? "/api/webhook"}</code>
            </li>
            <li>Subscribe to the <strong>messages</strong> field in Meta.</li>
            <li>
              Use the same verify token here and in the Meta webhook settings.
            </li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>WhatsApp Cloud API</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <p className="text-sm text-foreground/70">
            Save your Meta WhatsApp Cloud API credentials. Then test the
            connection and use the same verification token in your webhook
            settings.
          </p>

          <form className="space-y-3" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="space-y-1">
              <label className="text-sm">Access token</label>
              <Input
                type="password"
                placeholder={
                  hasAccessToken
                    ? "Leave blank to keep existing token"
                    : "Paste Meta permanent access token"
                }
                {...form.register("access_token")}
              />
              {form.formState.errors.access_token && (
                <div className="text-xs text-red-500">
                  {form.formState.errors.access_token.message}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-sm">Phone number ID</label>
                <Input {...form.register("phone_number_id")} />
                {form.formState.errors.phone_number_id && (
                  <div className="text-xs text-red-500">
                    {form.formState.errors.phone_number_id.message}
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-sm">Business account ID</label>
                <Input {...form.register("business_account_id")} />
                {form.formState.errors.business_account_id && (
                  <div className="text-xs text-red-500">
                    {form.formState.errors.business_account_id.message}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm">Webhook verify token</label>
              <Input {...form.register("verify_token")} />
              {form.formState.errors.verify_token && (
                <div className="text-xs text-red-500">
                  {form.formState.errors.verify_token.message}
                </div>
              )}
            </div>

            <div className="flex gap-2 flex-wrap pt-2">
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : "Save credentials"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={handleTestConnection}
                disabled={testState.status === "testing"}
              >
                {testState.status === "testing"
                  ? "Testing..."
                  : "Test connection"}
              </Button>
            </div>
          </form>

          {testState.status !== "idle" && (
            <div className="pt-2 space-y-2">
              {testState.status === "success" && (
                <div className="flex items-center gap-2">
                  <Badge variant="success">Connection OK</Badge>
                  <div className="text-xs text-foreground/70">
                    Meta Graph API responded successfully.
                  </div>
                </div>
              )}
              {testState.status === "error" && (
                <div className="flex items-center gap-2">
                  <Badge variant="danger">Connection failed</Badge>
                  <div className="text-xs text-red-500">
                    {testState.error}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
