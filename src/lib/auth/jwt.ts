import { SignJWT, jwtVerify } from "jose";

import { env } from "@/config/env";

export type AdminJwtClaims = {
  sub: "admin";
  email: string;
};

const secret = new TextEncoder().encode(env.JWT_SECRET);

export async function signAdminSession(claims: AdminJwtClaims) {
  return new SignJWT(claims)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret);
}

export async function verifyAdminSession(token: string): Promise<AdminJwtClaims> {
  const { payload } = await jwtVerify(token, secret, { algorithms: ["HS256"] });
  if (payload.sub !== "admin" || typeof payload.email !== "string") {
    throw new Error("Invalid admin JWT payload");
  }
  return payload as AdminJwtClaims;
}

export function getAdminCookieName() {
  return env.COOKIE_NAME;
}

