import { env } from "@/config/env";

export type MetaGraphTestResult =
  | { ok: true; data: unknown }
  | { ok: false; error: string };

export async function testMetaGraphConnection(accessToken: string) {
  const version = env.META_GRAPH_API_VERSION;
  const url = `https://graph.facebook.com/${encodeURIComponent(
    version.replace(/^v/, "v"),
  )}/me?fields=id,name&access_token=${encodeURIComponent(accessToken)}`;

  const res = await fetch(url, {
    method: "GET",
    headers: { "content-type": "application/json" },
  });

  const dataUnknown = (await res.json().catch(() => null)) as unknown;
  const data =
    typeof dataUnknown === "object" && dataUnknown !== null
      ? (dataUnknown as { error?: { message?: string; error_subcode?: string } })
      : undefined;
  if (!res.ok) {
    const msg =
      data?.error?.message ??
      data?.error?.error_subcode ??
      "Meta Graph API request failed";
    return { ok: false, error: String(msg) } satisfies MetaGraphTestResult;
  }

  return { ok: true, data } satisfies MetaGraphTestResult;
}

