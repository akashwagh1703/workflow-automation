import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { requireSupabaseEnv } from "@/config/env";

let adminClient: SupabaseClient | null = null;

export function getSupabaseAdminClient() {
  if (adminClient) return adminClient;

  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = requireSupabaseEnv();

  adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  return adminClient;
}

