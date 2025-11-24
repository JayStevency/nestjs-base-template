# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Dummy DATABASE_URL for prisma generate (not used at runtime)
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run prisma:generate
RUN npm run build

# Production stage
FROM node:22-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./

RUN npm ci --omit=dev

# Copy built application
COPY --from=builder /app/dist ./dist

# Copy generated Prisma client
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

EXPOSE 3000

CMD ["node", "dist/main"]
