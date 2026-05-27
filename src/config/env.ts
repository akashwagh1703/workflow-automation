import { z } from "zod";

// NOTE: we provide safe defaults so `next build` works even before env is configured.
// Runtime code should validate the *real* presence/values before doing network/DB calls.
const envSchema = z.object({
  ADMIN_EMAIL: z.string().email().default("admin@example.com"),
  ADMIN_PASSWORD: z.string().min(1).default("123456"),
  JWT_SECRET: z
    .string()
    .min(32)
    .default("dev_jwt_secret_change_me_change_me_1234567890"),
  COOKIE_NAME: z.string().default("wa_admin_session"),

  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),

  META_GRAPH_API_VERSION: z.string().default("v19.0"),

  // Public base URL for webhook links (e.g. https://your-domain.com)
  APP_URL: z.string().url().optional(),
});

export const env = envSchema.parse(process.env);

export function requireSupabaseEnv() {
  const result = z
    .object({
      SUPABASE_URL: z.string().url(),
      SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
    })
    .safeParse(process.env);

  if (!result.success) {
    const issues = result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    throw new Error(`Missing/invalid Supabase env. ${issues}`);
  }

  return result.data;
}

