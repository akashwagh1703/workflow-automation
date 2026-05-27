import { NextResponse } from "next/server";

export function apiError(message: string, status = 500) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

export function apiOk<T extends Record<string, unknown>>(data: T) {
  return NextResponse.json({ ok: true, ...data });
}
