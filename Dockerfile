### Dockerfile for Next.js Frontend (Cloud Run)

# 1. Build stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install --production=false
COPY . .
RUN npm run build

# 2. Production stage
FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy built assets and dependencies
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules

COPY --from=builder /app/package.json ./package.json

# Expose port and start
EXPOSE 3000
CMD ["npm", "start"]
