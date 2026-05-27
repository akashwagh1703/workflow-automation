import { createHmac, timingSafeEqual } from "crypto";

export function verifyMetaWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
): boolean {
  const secret = process.env.META_APP_SECRET;
  if (!secret) {
    // Optional in dev; required for production hardening when set.
    return true;
  }

  if (!signatureHeader?.startsWith("sha256=")) {
    return false;
  }

  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  const received = signatureHeader.slice("sha256=".length);

  try {
    return timingSafeEqual(
      Buffer.from(expected, "hex"),
      Buffer.from(received, "hex"),
    );
  } catch {
    return false;
  }
}

export function isSignatureVerificationEnabled() {
  return Boolean(process.env.META_APP_SECRET);
}
