import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

let _serverClient: SupabaseClient<Database> | null = null;

function getServerClient(): SupabaseClient<Database> {
  if (!_serverClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const secretKey =
      process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
    const schema =
      process.env.NEXT_PUBLIC_SUPABASE_DB_SCHEMA?.trim() || "public";

    if (!url || !secretKey) {
      throw new Error(
        "Missing server Supabase key. Set SUPABASE_SECRET_KEY in .env.local and restart the dev server."
      );
    }

    _serverClient = createClient<Database>(url, secretKey, {
      // The generated types describe Athena's table shape under `public`.
      // Hetzner exposes the identical shape from the dedicated `lsat` schema.
      db: { schema: schema as "public" },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  return _serverClient;
}

export const supabaseServer: SupabaseClient<Database> = new Proxy(
  {} as SupabaseClient<Database>,
  {
    get(_target, prop) {
      return (getServerClient() as unknown as Record<string | symbol, unknown>)[prop];
    },
  }
);
