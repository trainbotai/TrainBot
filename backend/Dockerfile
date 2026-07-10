FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts

FROM node:22-alpine AS builder
WORKDIR /app
RUN apk add --no-cache openssl
COPY package*.json ./
RUN npm ci --ignore-scripts
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache openssl

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 trainbot

# Runtime primește DOAR dependențele de producție (fără typescript/vitest/testcontainers)
# + clientul Prisma generat de builder (peste @prisma/client care e dep de producție).
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY package*.json ./

RUN mkdir -p /var/uploads/trainbot && \
    chown -R trainbot:nodejs /var/uploads/trainbot

USER trainbot

EXPOSE 3000

CMD ["node", "dist/src/index.js"]
