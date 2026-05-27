/** Resolve the public site origin behind Vercel / reverse proxies. */
export function getRequestOrigin(req: Request): string {
  const forwardedHost = req.headers.get("x-forwarded-host");
  const forwardedProto = req.headers.get("x-forwarded-proto");

  if (forwardedHost) {
    const host = forwardedHost.split(",")[0]?.trim();
    const proto = (forwardedProto ?? "https").split(",")[0]?.trim() ?? "https";
    if (host) return `${proto}://${host}`;
  }

  const host = req.headers.get("host");
  if (host) {
    const url = new URL(req.url);
    const proto =
      process.env.NODE_ENV === "production" ? "https" : url.protocol.replace(":", "");
    return `${proto}://${host}`;
  }

  return new URL(req.url).origin;
}

export function buildAbsoluteUrl(req: Request, pathname: string): URL {
  return new URL(pathname, getRequestOrigin(req));
}
