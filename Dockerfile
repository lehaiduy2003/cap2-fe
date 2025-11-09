# Build stage
FROM node:18 AS build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Migration stage
FROM build AS migration

# Run migrations (requires DB connection, may fail if DB not available during build)
RUN npm run migration:run

# Deploy stage
FROM node:18-alpine AS deploy

WORKDIR /app

# Copy node_modules from build stage
COPY --from=build /app/node_modules ./node_modules

# Copy application code
COPY --from=build /app/server ./server
COPY --from=build /app/migrations ./migrations
COPY --from=build /app/package.json ./

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

USER nodejs

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
