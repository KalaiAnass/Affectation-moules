# syntax=docker/dockerfile:1
# Multi-stage build for the NestJS API. Build context = repo root.

FROM node:20-alpine AS base
RUN apk add --no-cache openssl
WORKDIR /app

# ---- deps: install the whole workspace (engine + api) ----
FROM base AS deps
COPY package.json package-lock.json ./
COPY packages/engine/package.json packages/engine/
COPY apps/api/package.json apps/api/
RUN npm ci

# ---- build: compile engine, generate prisma client, build api ----
FROM deps AS build
COPY packages/engine packages/engine
COPY apps/api apps/api
RUN npm run build --workspace @mpc/engine
RUN npm run prisma:generate --workspace @mpc/api
RUN npm run build --workspace @mpc/api

# ---- runner: production image ----
FROM base AS runner
ENV NODE_ENV=production
COPY package.json package-lock.json ./
COPY packages/engine/package.json packages/engine/
COPY apps/api/package.json apps/api/
RUN npm ci --omit=dev && npm cache clean --force
# Built artifacts
COPY --from=build /app/packages/engine/dist packages/engine/dist
COPY --from=build /app/packages/engine/data packages/engine/data
COPY --from=build /app/apps/api/dist apps/api/dist
COPY --from=build /app/apps/api/prisma apps/api/prisma
# Prisma client (generated) + engine binaries live in node_modules
COPY --from=build /app/node_modules/.prisma node_modules/.prisma
COPY --from=build /app/node_modules/@prisma node_modules/@prisma

WORKDIR /app/apps/api
EXPOSE 3001
# Apply migrations, then start. (Seed is run separately, see compose.)
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
