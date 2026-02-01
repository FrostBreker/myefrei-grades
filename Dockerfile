# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install ALL dependencies (including devDependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Stage 2: Production
FROM node:20-alpine AS runner

WORKDIR /app

# Set production environment
ENV NODE_ENV=production

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files from builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Copy New Relic configuration file
COPY --from=builder /app/newrelic.cjs ./newrelic.cjs

# Set ownership
RUN chown -R nextjs:nodejs /app

USER nextjs

# Expose port
EXPOSE 3000

# Environment variables
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Optional: Set Node.js memory limit (adjust based on your VPS RAM)
# ENV NODE_OPTIONS="--max-old-space-size=512"

# Health check to ensure the app is running
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/api/user/check-admin', (r) => process.exit(r.statusCode === 200 ? 0 : 1))" || exit 1

# New Relic requires the agent to be loaded before the app
# The -r flag preloads the newrelic module before server.js runs
CMD ["node", "-r", "newrelic", "server.js"]
