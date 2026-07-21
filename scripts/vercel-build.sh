#!/usr/bin/env bash
# Vercel build: use Postgres (from the connected Neon store), create the schema,
# seed demo data, then build. Local dev stays on SQLite (this only runs on Vercel).
set -e

sed -i 's/provider = "sqlite"/provider = "postgresql"/' prisma/schema.prisma

export DATABASE_URL="${DATABASE_URL_UNPOOLED:-$DATABASE_URL}"

node_modules/.bin/prisma generate
node_modules/.bin/prisma db push --accept-data-loss --skip-generate
node_modules/.bin/tsx prisma/seed.ts
node_modules/.bin/next build
