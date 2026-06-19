# syntax=docker/dockerfile:1
# Multi-stage build for the Next.js web app (standalone output). Context = repo root.

FROM node:20-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json ./
COPY apps/web/package.json apps/web/
RUN npm ci

FROM deps AS build
COPY apps/web apps/web
# API URL baked into the client bundle at build time.
ARG NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
RUN npm run build --workspace @mpc/web

FROM base AS runner
ENV NODE_ENV=production
ENV PORT=3000
# Standalone server bundles only what it needs.
COPY --from=build /app/apps/web/.next/standalone ./
COPY --from=build /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=build /app/apps/web/public ./apps/web/public
EXPOSE 3000
CMD ["node", "apps/web/server.js"]
