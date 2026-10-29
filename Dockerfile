FROM node:22-bookworm-slim AS builder

WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Build against an empty local database. The Render service supplies its own
# PostgreSQL URL at runtime, and migrations run before the server starts.
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_PROVIDER=sqlite
ENV DATABASE_URL=file:./prisma/dev.db
ARG NEXT_PUBLIC_SHOP_EMAIL=omub22@gmail.com
ARG NEXT_PUBLIC_SHOP_WHATSAPP_NUMBER=918878498130
ARG NEXT_PUBLIC_SHOP_CITY="Sarafa Bazar, Katni"
ENV NEXT_PUBLIC_SHOP_EMAIL=${NEXT_PUBLIC_SHOP_EMAIL}
ENV NEXT_PUBLIC_SHOP_WHATSAPP_NUMBER=${NEXT_PUBLIC_SHOP_WHATSAPP_NUMBER}
ENV NEXT_PUBLIC_SHOP_CITY=${NEXT_PUBLIC_SHOP_CITY}
RUN npx prisma generate \
  && npx prisma generate --schema prisma/schema.postgresql.prisma --config prisma.config.postgresql.ts \
  && npx prisma migrate deploy --config prisma.config.ts \
  && npm run build

FROM node:22-bookworm-slim AS runner

WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=10000
ENV HOSTNAME=0.0.0.0

COPY --from=builder /app ./

EXPOSE 10000
CMD ["sh", "-c", "npx prisma migrate deploy --config prisma.config.postgresql.ts && npx tsx scripts/import-public-catalogue.ts && npm start"]

