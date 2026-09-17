#!/usr/bin/env bash

set -euo pipefail

if ! command -v psql >/dev/null 2>&1; then
  echo "psql is required to apply the LSAT migrations." >&2
  exit 1
fi

if [[ -z "${HETZNER_SUPABASE_DB_URL:-}" ]]; then
  echo "Set HETZNER_SUPABASE_DB_URL to the PostgreSQL connection URI." >&2
  exit 1
fi

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
migrations_dir="${script_dir}/../supabase/migrations"
bootstrap_file="${migrations_dir}/20260222000000_lsat_schema.sql"

apply_migration() {
  local migration_file="$1"
  local filename version name applied

  filename="$(basename "$migration_file")"
  version="${filename%%_*}"
  name="${filename#*_}"
  name="${name%.sql}"

  if [[ ! "$version" =~ ^[0-9]{14}$ ]] || [[ ! "$name" =~ ^[a-z0-9_]+$ ]]; then
    echo "Invalid migration filename: ${filename}" >&2
    exit 1
  fi

  applied="$(
    psql "$HETZNER_SUPABASE_DB_URL" \
      -X -A -t -v ON_ERROR_STOP=1 \
      -c "SELECT EXISTS (SELECT 1 FROM lsat.schema_migrations WHERE version = '$version');"
  )"

  if [[ "$applied" == "t" ]]; then
    echo "Skipping ${filename} (already applied)"
    return
  fi

  echo "Applying ${filename}"
  psql "$HETZNER_SUPABASE_DB_URL" \
    -X -v ON_ERROR_STOP=1 --single-transaction \
    -f "$migration_file" \
    -c "INSERT INTO lsat.schema_migrations (version, name) VALUES ('$version', '$name');"
}

# The bootstrap is idempotent and creates the schema-local history table.
psql "$HETZNER_SUPABASE_DB_URL" \
  -X -v ON_ERROR_STOP=1 --single-transaction \
  -f "$bootstrap_file" \
  -c "INSERT INTO lsat.schema_migrations (version, name) VALUES ('20260222000000', 'lsat_schema') ON CONFLICT (version) DO NOTHING;"

for migration_file in "$migrations_dir"/*.sql; do
  if [[ "$migration_file" == "$bootstrap_file" ]]; then
    continue
  fi
  apply_migration "$migration_file"
done

echo "LSAT migrations are up to date."
