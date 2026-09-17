import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

let _client: SupabaseClient<Database> | null = null;

function getClient(): SupabaseClient<Database> {
  if (!_client) {
    const schema =
      process.env.NEXT_PUBLIC_SUPABASE_DB_SCHEMA?.trim() || "public";

    _client = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
      {
        // The generated types describe Athena's table shape under `public`.
        // Hetzner exposes the identical shape from the dedicated `lsat` schema.
        db: { schema: schema as "public" },
      }
    );
  }
  return _client;
}

export const supabase: SupabaseClient<Database> = new Proxy(
  {} as SupabaseClient<Database>,
  {
    get(_target, prop) {
      return (getClient() as unknown as Record<string | symbol, unknown>)[prop];
    },
  }
);
