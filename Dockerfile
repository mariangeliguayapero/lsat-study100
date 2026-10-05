FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

# --- Dependencies ---
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# --- Build ---
FROM base AS builder
WORKDIR /app
ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ARG NEXT_PUBLIC_CLARITY_ID
ENV NEXT_PUBLIC_CLARITY_ID=$NEXT_PUBLIC_CLARITY_ID
ARG NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY
ENV NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=$NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY
RUN test -n "$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY" || \
      (echo "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY build argument is required" >&2; exit 1) && \
    test -n "$NEXT_PUBLIC_SUPABASE_URL" || \
      (echo "NEXT_PUBLIC_SUPABASE_URL build argument is required" >&2; exit 1) && \
    test -n "$NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY" || \
      (echo "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY build argument is required" >&2; exit 1)
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN rm -rf agents
RUN pnpm build

# --- Production ---
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
CMD ["node", "server.js"]
