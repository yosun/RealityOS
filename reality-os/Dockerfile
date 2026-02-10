# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm install

# Copy source
COPY . .

# Build frontend
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Copy package files for server dependencies
COPY package*.json ./
RUN npm install --production

# Install ts-node for running the server (or compile it)
# Installing ts-node in production is fine for this scale, or we could compile.
# Let's install typescript and ts-node
RUN npm install -g ts-node typescript

# Copy built assets
COPY --from=builder /app/dist ./dist

# Copy server code
COPY --from=builder /app/server ./server

# Expose port
EXPOSE 3000

# Environment variables should be passed at runtime
ENV NODE_ENV=production
ENV PORT=3000

# Start command
CMD ["ts-node", "server/index.ts"]
