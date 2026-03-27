# 1. Étape de dépendances
FROM node:20-alpine AS deps
WORKDIR /app
COPY portfolio/package.json portfolio/package-lock.json ./
RUN npm ci

# 2. Étape de Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY portfolio/ .
# Important : Passe tes variables d'environnement secrètes ici si besoin pour le build
RUN npm run build

# 3. Étape de Production (Image finale ultra-légère)
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV production

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
CMD ["node", "server.js"]

