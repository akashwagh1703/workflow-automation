import { env } from "@/config/env";
import { apiOk } from "@/lib/api/errors";

export async function GET() {
  return apiOk({
    status: "ok",
    supabaseConfigured: Boolean(
      env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY,
    ),
    timestamp: new Date().toISOString(),
  });
}
