const required = [
  "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
  "CLERK_SECRET_KEY",
  "NEXT_PUBLIC_CLERK_SIGN_IN_URL",
  "NEXT_PUBLIC_CLERK_SIGN_UP_URL",
  "NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL",
  "NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY",
  "AGENT_SERVICE_URL",
  "APP_URL",
];

const missing = required.filter((name) => !process.env[name]?.trim());

if (
  !process.env.SUPABASE_SECRET_KEY?.trim() &&
  !process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
) {
  missing.push("SUPABASE_SECRET_KEY (or SUPABASE_SERVICE_ROLE_KEY)");
}

const invalid = [];
for (const name of [
  "NEXT_PUBLIC_SUPABASE_URL",
  "AGENT_SERVICE_URL",
  "APP_URL",
]) {
  const value = process.env[name];
  if (!value) continue;

  try {
    const url = new URL(value);
    if (url.protocol !== "https:") {
      invalid.push(`${name} must use HTTPS`);
    }
    if (["localhost", "127.0.0.1", "0.0.0.0"].includes(url.hostname)) {
      invalid.push(`${name} must not point to a local host for QA`);
    }
  } catch {
    invalid.push(`${name} must be a valid absolute URL`);
  }
}

if (missing.length || invalid.length) {
  console.error("QA deployment environment validation failed.");
  if (missing.length) {
    console.error(`Missing: ${missing.join(", ")}`);
  }
  for (const issue of invalid) {
    console.error(`Invalid: ${issue}`);
  }
  process.exit(1);
}

console.log("QA deployment environment validation passed.");
